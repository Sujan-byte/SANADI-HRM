import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'radio',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.scss']
})
export class RadioComponent implements OnInit {

  @Input() field:any = {};
  @Input() form:UntypedFormGroup | any;
  selectedValue: any;
  constructor() { }

  ngOnInit(): void {
    this.selectedValue = this.field?.value;
  }

}
