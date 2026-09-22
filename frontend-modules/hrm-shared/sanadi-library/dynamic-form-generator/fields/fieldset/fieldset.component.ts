import { Component, Input, OnInit } from '@angular/core';
import { Form, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-fieldset',
  templateUrl: './fieldset.component.html',
  styleUrls: ['./fieldset.component.scss']
})
export class FieldSetComponent implements OnInit {

  @Input() fields:any;
  @Input() form: Form;
  @Input() header: any;
  @Input() fillScreen: any;
  @Input() height: any;
  @Input() align:any;
  @Input() legendAlign:any;
  @Input() collapsed:boolean=false;
  // get isValid() { 
  //   return this.form?.controls[this.field.name].valid; 
  // }
  // get isDirty() { 
  //   return this.form?.controls[this.field.name].dirty; 
  // }

  constructor() { }

  ngOnInit(): void {
  // console.log("align",this.align)
  }

}
