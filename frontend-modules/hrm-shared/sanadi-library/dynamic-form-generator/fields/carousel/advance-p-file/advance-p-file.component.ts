
import { MenuItem, MessageService, PrimeNGConfig } from 'primeng/api';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { BadgeModule } from 'primeng/badge';
import { HttpClientModule } from '@angular/common/http';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { AfterViewInit, Component, inject, signal, ViewChild } from '@angular/core'
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SharedService } from '../../../../../core/shared/services/shared.service';
import { ContextMenuModule } from 'primeng/contextmenu';
import { Console } from 'console';

export const ImageFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
export const ImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'];

@Component({
  selector: 'sanadi-advance-p-file',
  standalone: true,
  imports: [FileUploadModule, ButtonModule, BadgeModule, ProgressBarModule, ToastModule,
    HttpClientModule, CommonModule, ContextMenuModule],
  providers: [MessageService],
  templateUrl: './advance-p-file.component.html',
  styleUrl: './advance-p-file.component.scss'
})
export class AdvancePFileComponent implements AfterViewInit {

  dialogRef = inject(DynamicDialogRef);
  dialogConfig = inject(DynamicDialogConfig);
  _sharedService = inject(SharedService);
  @ViewChild('fp') fileUpload: FileUpload;
  selectedFiles = [];
  files = [];
  selectedFile: any;
  private readonly contextRowImage = signal('');
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
  totalSize: number = 0;

  totalSizePercent: number = 0;

  index = 0;

  constructor(private config: PrimeNGConfig, private messageService: MessageService) { }

  ngAfterViewInit() {
    // console.group("checked file", this.fileUpload)
    const data = this.dialogConfig?.data?.data;
    if (data?.final_data_card_file) {
      this.convertUrlsToFiles(data?.final_data_card_file).then(files => {
        this.selectedFiles = [files];
      }).catch(error => {
        console.error('Error converting URLs to files:', error);
      });
    }
  }

  async convertUrlsToFiles(url: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    const filename = url.substring(url.lastIndexOf('/') + 1);
    const filePromises = new File([blob], filename, {
      type: blob.type,
      lastModified: Date.now()
    });
    return filePromises;
  }

  // CONTEXT MENU
  // ON OPEN IMAGE CONTEXT GLOBAL
  async onOpenImageContext(event, value) {
    // console.log('value', value);
    if (value?.length) {
      const base64: any = await this.onChangeConvertToBase64(value[0])
      this.contextRowImage.set(base64);
    }
  }

  // CONVERT FILE TO BASE64
  async onChangeConvertToBase64(file) {
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

  async onContextMenu(event, file) {
    // console.log("on context menu", file);
    this.selectedFile = file;
    const base64: any = await this.onChangeConvertToBase64(this.selectedFile);
    this.contextRowImage.set(base64);
  }

  // ON HIDE IMAGE CONTEXT GLOBAL
  onHideImageContext() {
    // console.log('on hide image context');
    this.contextRowImage.set('');
  }

  // PREVIEW IMAGE
  previewRowFile() {
    const fileName = this.selectedFile.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const fileUrl = this.contextRowImage();

    const newTab = window.open('', '_blank', 'width=500,height=400');

    if (!fileUrl || !fileExtension) {
      newTab.document.body.innerHTML = `<p>Preview is not available for this file: URL not found.</p>`;
      return;
    }

    if (fileExtension && ImageFormats.includes(fileExtension)) {
      newTab.document.body.innerHTML = `<img src="${fileUrl}" style="max-width: 100%; max-height: 100%; display: block; margin: auto;">`;
    } else if (this.selectedFile?.type === 'application/pdf') {
      newTab.document.body.innerHTML = `<embed src="${fileUrl}" width="100%" height="100%" type="application/pdf">`;
    } else if (this.selectedFile?.type.startsWith('application/')) {
      newTab.document.body.innerHTML = `<embed src="${fileUrl}" width="100%" height="100%" type="${this.selectedFile?.type}">`;
    } else {
      newTab.document.body.innerHTML = `<p>Preview is not available for this file type: ${fileExtension?.toUpperCase()}.</p>`;
      newTab.document.body.innerHTML += `<a href="${fileUrl}" download>Download the file</a>`;
    }

    newTab.onerror = () => {
      newTab.document.body.innerHTML = `<p>Preview is not available due to an error with the file URL or unsupported format.</p>`;
    };
  }

  // DOWNLOAD IMAGE
  downloadRowFile() {
    const fileName = this.selectedFile.name;
    // const fileExtension = fileName.split('.').pop().toLowerCase();
    const fileUrl = this.contextRowImage();

    const link = document.createElement('a');
    link.href = fileUrl;

    link.download = fileName;

    link.click();
  }
  // CONTEXT MENU

  // IMAGE CONTENT
  // IS IMAGE
  isImage(file: File): boolean {
    return ImageTypes.includes(file.type);
  }

  // DEFAULT ICON
  getDefaultIcon(file: File): string {
    const fileType = file.name.split('.').pop().toLowerCase();

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
      default:
        return '/assets/images/image_not_found.png';
    }
  }
  // IMAGE CONTENT

  // ON SELECT FILE
  onSelectedFiles(event) {
    // console.log('onSelectedFiles', event);
    this.files = event.currentFiles;
    this.files.forEach((file) => {
      this.totalSize += parseInt(this.formatSize(file.size));
    });
    this.selectedFiles = this.files;
    // console.log("selected file percent", this.selectedFiles, this.totalSize);
  }

  // FROMAT SIZE
  formatSize(bytes) {
    const k = 1024;
    const dm = 3;
    const sizes = this.config.translation.fileSizeTypes;
    if (bytes === 0) {
      return `0 ${sizes[0]}`;
    }

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

    return `${formattedSize} ${sizes[i]}`;
  }
  // ON SELECT FILE

  // REMOVE FILE
  onRemoveTemplatingFile(event, file, index) {
    // removeFileCallback(event, index);
    // console.log('onRemoveTemplatingFile', event, file, index, this.selectedFiles);
    this.selectedFiles = (this.selectedFiles || []).filter((ele: any) => ele?.name != file?.name);
    this.totalSize -= parseInt(this.formatSize(file.size));
    this.totalSizePercent = this.totalSize / 10;
  }
  // REMOVE FILE

  // UPLOAD FILE
  myUploader(event: any) {
    // console.log('clicked', event);
    if (!this.files || this.files.length === 0) {
      this._sharedService.handleWarning('No new files selected!');
      // this.dialogRef.close(this.files);
      this.dialogRef.close(this.selectedFiles);
      return;
    }
    this.totalSizePercent = this.totalSize / 1;
    setTimeout(() => {
      // this.dialogRef.close(this.files);
      this.dialogRef.close(this.selectedFiles);
    }, 1000);
    this.messageService.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 });
  }

  generateUniqueId() {
    return Math.floor(1000000000000 + Math.random() * 9000) + 'A';
  }

  // REMOVE ALL FILE
  onClearTemplatingUpload(event) {
    // clear();
    this.totalSize = 0;
    this.totalSizePercent = 0;
    this.selectedFiles = [];
  }
  // REMOVE ALL FILE

  // OLD CODE
  choose(event, callback) {
    callback();
  }

  uploadEvent(callback) {
    // console.log("checked file", this.files, callback)
    //   callback();
    if (!this.files || this.files.length === 0) {
      this._sharedService.handleWarning('No new files selected!');
      this.dialogRef.close(this.files)
      return;
    }
    this.totalSizePercent = this.totalSize / 1;
    setTimeout(() => {
      this.dialogRef.close(this.files)
    }, 1000)
  }

  onTemplatedUpload() {
    // console.log('comes')
    this.messageService.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 });
  }
}
