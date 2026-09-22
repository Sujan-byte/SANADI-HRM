import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService, MenuItem, MessageService, PrimeNGConfig } from 'primeng/api';
import { CustomDialogService } from 'src/app/modules/hrm-shared/core/shared/services/custom-dialog';
import { AdvancePFileComponent, ImageFormats, ImageTypes } from './advance-p-file/advance-p-file.component';

@Component({
  selector: 'carousel',
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss'
})
export class CarouselComponent implements OnInit {

  private _customDialog = inject(CustomDialogService);
  public messageService = inject(MessageService);
  public confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);

  @Input() field: any = {};
  @Input() form: UntypedFormGroup | any;
  @Input() formFields: any;

  fileSelected: any[] = [];
  responsiveOptions: any[] | undefined;
  private uploadFileConfig = signal({});
  selectedFile: any = {};
  private readonly contextRowImage = signal('')
  imageOptions: MenuItem[] = [
    {
      label: 'Preview', icon: 'pi pi-eye', command: () => {
        this.previewRowFile();
      }
    },
    {
      label: 'Download', icon: 'pi pi-cloud-download', command: () => {
        this.downloadRowFile();
      }
    }
  ];

  ngOnInit(): void {
    if (this.field?.value) {
      this.fileSelected = this.field?.value || [];
      this.fileSelected.map(async (file) => {
        file.file = await this.urlToBase64(file?.file);
        return file;
      });
    }
    this.responsiveOptions = [
      {
        breakpoint: '1400px',
        numVisible: 3,
        numScroll: 3
      },
      {
        breakpoint: '1220px',
        numVisible: 2,
        numScroll: 2
      },
      {
        breakpoint: '1100px',
        numVisible: 1,
        numScroll: 1
      }
    ];
  }

  constructor(private primeNgConfig: PrimeNGConfig) { }

  // IMAGE CONTENT
  setFileUploadConfig() {
    this.uploadFileConfig.set({
      pageTitle: this.translate.instant('uploadDataCardFile_TC'),
      dialogData: {},
      dialogConfig: {
        height: '70%',
        width: '40%'
      },
      isShowDialog: true,
    })
  }

  // CLICK ON UPLOAD
  async clickOnUpload(event: any) {
    const updatedArray = this.fileSelected;
    const response: any = await this._customDialog.openDialog(this.uploadFileConfig(), AdvancePFileComponent);
    if (response?.length) {
      for (let i = 0; i < response?.length; i++) {
        const file = response[i];
        updatedArray.push({
          id: this.generateUniqueId(),
          file: await this.convertToBase64(file),
          file_name: file?.name,
          size: this.formatSize(file?.size),
          file_type: file?.type,
        });
      }
    }
    this.fileSelected = updatedArray;
    this.updateFile(this.fileSelected);
    this.responsiveOptions = [
      {
        breakpoint: '1400px',
        numVisible: 3,
        numScroll: 3
      },
      {
        breakpoint: '1220px',
        numVisible: 2,
        numScroll: 2
      },
      {
        breakpoint: '1100px',
        numVisible: 1,
        numScroll: 1
      }
    ];
    // console.log('event', response, this.fileSelected);
  }

  generateUniqueId() {
    return Math.floor(1000000000000 + Math.random() * 9000) + 'A';
  }

  // IS IMAGE
  isImage(file: any): boolean {
    return ImageTypes.includes(file.file_type);
  }

  // DEFAULT ICON
  getDefaultIcon(file: any): string {
    const fileType = file.file_name.split('.').pop().toLowerCase();
    // console.log('getDefaultIcon', fileType);
    switch (fileType) {
      case 'pdf':
        return '/assets/images/pdf.png';
      case 'doc':
      case 'docx':
        return '/assets/images/word-doc.png';
      case 'xlsx':
      case 'xls':
      case 'csv':
        return '/assets/images/excel.png';
      case 'dwg':
        return '/assets/images/dwg.png';
      // case 'x-dwg':
      // case 'x-dwg':
      default:
        return '/assets/images/image_not_found.png';
    }
  }

  // FROMAT SIZE
  formatSize(bytes) {
    const k = 1024;
    const dm = 3;
    const sizes = this.primeNgConfig.translation.fileSizeTypes;
    if (bytes === 0) {
      return `0 ${sizes[0]}`;
    }

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

    return `${formattedSize} ${sizes[i]}`;
  }

  // REMOVE FILE
  onRemoveTemplatingFile(event, file: any, index) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure, you want to delete?`,
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.fileSelected = (this.fileSelected || []).filter((ele: any) => ele?.id != file?.id);
        this.updateFile(this.fileSelected);
        this.messageService.add({
          key: 'toaster',
          severity: 'success',
          summary: 'Deleted',
          detail: `${file?.file_name} has been successfully deleted!`,
          life: 3000,
        });
      },
      reject: () => {
      },
    });
  }

  // CONTEXT MENU
  async onContextMenu(event, file: any) {
    // console.log("on context menu", file);
    this.selectedFile = file;
    // const base64: any = await this.convertToBase64(this.selectedFile);
    this.contextRowImage.set(this.selectedFile?.file);
  }

  // ON HIDE IMAGE CONTEXT GLOBAL
  onHideImageContext() {
    // console.log('on hide image context');
    this.contextRowImage.set('');
    this.selectedFile = undefined;
  }

  // CONVERT FILE TO BASE64
  async convertToBase64(file) {
    if (file) {
      const reader = new FileReader();
      const readFile = new Promise((resolve, reject) => {
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.onerror = () => {
          reject(reader.error);
        };
      });
      reader.readAsDataURL(file);
      return readFile
    }
    return ""
  }

  // CONVERT URL TO BASE64
  async urlToBase64(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // PREVIEW IMAGE
  previewRowFile() {
    const fileName = this.selectedFile.file_name;
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const fileUrl = this.contextRowImage();

    const newTab = window.open('', '_blank', 'width=500,height=400');

    if (ImageFormats.includes(fileExtension)) {
      newTab.document.body.innerHTML = `<img src="${fileUrl}" style="max-width: 100%; max-height: 100%; display: block; margin: auto;">`;
    } else if (fileExtension === 'pdf') {
      newTab.document.body.innerHTML = `<embed src="${fileUrl}" width="100%" height="100%" type="application/pdf">`;
    } else {
      newTab.document.body.innerHTML = `<p>Preview is not available for this file type: ${fileExtension.toUpperCase()}</p>`;
    }
  }

  // DOWNLOAD IMAGE
  downloadRowFile() {
    const fileName = this.selectedFile.file_name;
    // const fileExtension = fileName.split('.').pop().toLowerCase();
    const fileUrl = this.contextRowImage();

    const link = document.createElement('a');
    link.href = fileUrl;
    // link.target = '_blank';
    link.download = fileName;

    link.click();
  }
  // CONTEXT MENU
  // IMAGE CONTENT

  // UPDATE FILE COMPONENT
  updateFile(files) {
    this.form.get(this.field.name).setValue(files || []);
    this.field.value = files;
  }

}
