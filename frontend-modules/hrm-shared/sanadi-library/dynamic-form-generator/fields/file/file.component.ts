import { Component, Input, OnInit, signal, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { File } from 'buffer';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'file',
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.scss']
})
export class FileComponent implements OnInit {
  @Input() field: any = {};
  @Input() form: UntypedFormGroup | any;
  @Input() cardHeight: any;
  @Input() imageHeight: any;
  @Input() imageWidth: any;
  @Input() align: any;
  @Input() downloadButton: any;
  @Input() labelOnDownload: any;
  @ViewChild('file') file: File;
  preloadedImageArray: any = [];
  preloadedImage: any = [];
  isShowPreviewImage = false;
  base64Image: any;
  get isValid() {
    return this.form?.controls[this.field.name].valid;
  }
  get isDirty() {
    return this.form?.controls[this.field.name].dirty;
  }
  isHovering: boolean = false;
  responsiveOptions = [
    {
      breakpoint: '1024px',
      numVisible: 3,
      numScroll: 3
    },
    {
      breakpoint: '768px',
      numVisible: 2,
      numScroll: 2
    },
    {
      breakpoint: '560px',
      numVisible: 1,
      numScroll: 1
    }
  ];
  private newArray = signal([]);

  constructor(private confirmationService: ConfirmationService,
    public translate: TranslateService,) {

  }

  ngOnInit() {
    // console.log(this.field);
    // console.log("image file ng opn it", this.field?.value);
    if (this.field?.value) {
      this.isShowPreviewImage = false;
      if (this.field?.isBase64String) {
        if (this.field.multiple) {
          this.preloadedImageArray = this.field?.value
        } else {
          this.base64Image = this.field.value;
        }
        this.isShowPreviewImage = true;
      }
      else {
        if (typeof (this.field?.value) == 'string' && !this.field.multiple) {
          this.preloadedImage.push(this.field.value) 
        } else {
          this.preloadedImageArray = this.field?.value || [];
        } 
        setTimeout(() => this.isShowPreviewImage = true);
      }
    }
    // console.log("image file ng opn it", this.preloadedImageArray);
  }

  ngOnChange() {
    // this.field.value.
  }

  toggleHover($event: any) {
    this.isHovering != this.isHovering
  }

  onChange(event: any) {
    // console.log("file event", event);
    if (event.target.files.length) {
      [...event.target.files].forEach((file) => {
        file['fileUpload'] = `${this.generateUniqueId()}+A`
      })
    }
    if (this.field?.selectedFiles) {
      if (!this.field.multiple) {
        this.field.selectedFiles = [];
        this.field.selectedFiles.push(event.target.files[0])
      }
    }
    this.previewImages(event);
    if (typeof this.field.onUpload === 'function') {
      return this.field.onUpload(event.target.files, this.field);
    }

  }

  previewImages(event: any) {
    if (event.target.files) {
      this.isShowPreviewImage = false;
      if (this.field.multiple) {
        this.previewImageArray(event.target.files);
      } else {
        this.preloadedImageArray = [];
        this.previewImage(event.target.files[0])
      }
      setTimeout(() => this.isShowPreviewImage = true, 10);
    }
  }

  previewImageArray(files: any) {
    if (files.length) {
      [...files].forEach((file) => {
        this.previewImage(file)
      })
    }
  }

  previewImage(file: any) {
    // console.log("prieview image file",file)
    if (file) {
      let oFReader = new FileReader();
      oFReader.readAsDataURL(file);

      // console.log('file upload', this.preloadedImageArray);
      oFReader.onload = (oFREvent) => {
        if (this.field.multiple) {
          this.preloadedImageArray = [...this.preloadedImageArray, { id: file.fileUpload, file: oFREvent?.target?.result, file_creation: 'A' }];

        } else {
          // this.preloadedImage = [...this.preloadedImage, oFREvent?.target?.result];
          this.preloadedImage = [oFREvent?.target?.result];
          // console.log('file upload', this.preloadedImage);
        }
      };
    }
  }

  generateUniqueId() {
    return Math.floor(800000000000000000000 + Math.random() * 1000);
  }

  display(data: any) {
    this.checkType(data);
    let fileName = '';
    if (data.startsWith("http")) {
      let stringStart = data.search("/media/images/");
      fileName = data.slice(stringStart + 14);
      // console.log('file name', fileName);
    }
    return fileName
  }

  checkType(data: any) {
    let fileType = ''
    // console.log('check file', typeof (data), data);
    if (data?.startsWith("http")) {
      let stringStart = data.search("/media/images/");
      let fileName = data.slice(stringStart + 14);
      // console.log('file name', fileName);
      // console.log('file type', fileName.lastIndexOf("."))
      let endDot = fileName.lastIndexOf(".");
      fileType = fileName.slice(endDot);
      // console.log('file type', fileType);
    } else if (data.startsWith('data:')) {
      fileType = this.getFileTypeFromBase64(data);
    }
    return fileType;
  }

  deleteImage(event: any, data: any) {
    if (event.defaultPrevented) return;
    event.preventDefault();
    // console.log('deleted', data);
    // console.log('image list', this.preloadedImageArray);
    // let imageIndex = this.preloadedImageArray.indexOf(data);
    // console.log('index', imageIndex);
    this.confirmationService.confirm({
      target: event.currentTarget || undefined,
      message: this.translate.instant('entityDeleteItem_SC', {
        entity: '',
      }),
      header: this.translate.instant('confirm_TC'),
      icon: 'pi pi-exclamation-triangle',
      key: 'deleteFile',
      accept: () => {
        if (this.field?.multiple) {
          this.preloadedImageArray.forEach((element: any, index: any) => {
            if (element.id == data.id) this.preloadedImageArray.splice(index, 1);
          });
          this.field.deleteFile(data.id);
        }
        else {
          // console.log("selected files",this.field.selectedFiles,event)
          this.preloadedImage = [];
          this.field.value = "";
          this.form.get(this.field.name).setValue(this.field.value);
          this.field.selectedFiles = Array.from([])
        }
      }
    })
  }

  openImage(url) {
    window.open(url, '_blank');
  }

  async onChangeConvertToBase64(event) {
    const file = event?.target.files[0];
    // console.log("file", file);
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
      try {
        const base64String = await readFile;
        if (this.field.multiple) {
          const fileObject = {
            id: `${this.generateUniqueId()}+A`,
            file: base64String,
            file_name: file.name,
            type: file.type
          }
          const currentValue = this.form.get(this.field.name).value;
          this.newArray.set([...currentValue, fileObject]);
          this.preloadedImageArray = [...currentValue, fileObject]
          this.form.get(this.field.name).setValue(this.newArray());
        } else {
          this.form.get(this.field.name).setValue(base64String);
        }
        this.base64Image = base64String;
        this.isShowPreviewImage = true;
      } catch (error) {
        console.error("Error reading file:", error);
        return null;
      }
    } else {
      console.error("No file uploaded");
      return null;
    }
  }


  getFileType(input: string): string | null {
    if (input.startsWith('data:')) {
      return this.getFileTypeFromBase64(input);
    } else if (this.isValidURL(input)) {
      return this.getFileTypeFromURL(input);
    } else {
      return null;
    }
  }

  getFileTypeFromBase64(base64String: string): string | null {
    const mimeTypeMatch = base64String.match(/^data:(.*?);base64,/);
    if (mimeTypeMatch && mimeTypeMatch[1]) {
      const mimeType = mimeTypeMatch[1];
      switch (mimeType) {
        case 'application/pdf':
          return '.pdf';
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          return '.xlsx';
        case 'text/csv':
          return '.csv';
        case 'application/msword':
          return '.doc';
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return '.docx';
        case 'application/vnd.ms-excel':
          return '.xls';
        case 'image/webp':
          return '.webp';
        default:
          return null;
      }
    }
    return null;
  }

  getFileTypeFromURL(url: string): string | null {
    const extensionMatch = url.match(/\.(pdf|xlsx|csv|doc|docx|xls)(\?|$)/);
    if (extensionMatch && extensionMatch[1]) {
      return `.${extensionMatch[1]}`;
    }
    return null;
  }

  isValidURL(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}
