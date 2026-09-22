import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'p-file',
  templateUrl: './p-file.component.html',
  styleUrls: ['./p-file.component.scss']
})
export class PFileComponent implements OnInit {
  @Input() field:any = {};
  @Input() form:UntypedFormGroup | any;
  get isValid() { 
    return this.form?.controls[this.field.name].valid; 
  }
  get isDirty() { 
    return this.form?.controls[this.field.name].dirty; 
  }

  constructor() { }

  ngOnInit(): void {
    console.log('File Value', this.field.value)

  }

  onFileChange(event: any) {
    const selectedFiles: any[]= []
    if (event.files && event.files.length) {
      for (let i = 0; i < event.files.length; i++) {
        const reader = new FileReader()
        reader.readAsDataURL(event.files[i])
        reader.onload = (e: any) => {
          selectedFiles.push(e.target?.result)
        }
      }
      console.log('file', selectedFiles)
      return this.field.onUpload(selectedFiles);
    }
  }

}
