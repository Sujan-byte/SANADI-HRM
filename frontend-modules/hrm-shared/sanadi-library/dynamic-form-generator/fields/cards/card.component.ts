import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit {

  @Input() fields:any;
  @Input() form: any;
  @Input() header: any;
  @Input() footer: any;
  @Input() fillScreen:any;

  // get isValid() { 
  //   return this.form?.controls[this.field.name].valid; 
  // }
  // get isDirty() { 
  //   return this.form?.controls[this.field.name].dirty; 
  // }

  constructor() { }

  ngOnInit(): void {
  
  // console.log("card fields",this.fields)
  }

}
