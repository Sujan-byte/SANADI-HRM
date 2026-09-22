import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import * as moment from 'moment';
import { debounceTime, distinctUntilChanged, pairwise, startWith } from 'rxjs/operators';

@Component({
  selector: 'date',
  templateUrl: './date.component.html',
  styleUrls: ['./date.component.scss']
})
export class DateComponent implements OnInit {
  @Input() field: any = {};
  @Input() form: UntypedFormGroup | any;
  calenderTimePicker:string;
  isReadOnly=true;
  minDateValue: Date;
  selectionMode:any
  maxDateValue: Date;
  defaultDate = new Date()
  @Input() formFields: any;
  get isValid() { 
    return this.form?.controls[this.field.name].valid; 
  }
  get isDirty() { 
    return this.form?.controls[this.field.name].dirty; 
  }
  constructor() { }

  ngOnInit(): void {
    if (this.field.value) {
      if(this.field?.timeOnly && this.field.value){
        const time = this.field.value;
        const [hoursStr, minutesStr] = time.split(':');
        const hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);  
        if (!isNaN(hours) && !isNaN(minutes)) {
            const date = new Date();
            date.setHours(hours, minutes);
            this.form.get(this.field.name).setValue(date);
        }
      }
      else{
        if (this.field?.variant=="multiple"){
          const momentDate=[];
          this.field.value.forEach(element => {
            momentDate.push(new Date(element))
          });
          this.form.get(this.field.name).setValue(momentDate);
        }
        else
        {
          this.form.get(this.field.name).setValue(this.field.value);
        }
      }
    }
    this.onValueChanges();
    this.disableDate();
  }

  onValueChanges() {
    if (typeof (this.field.onValueChange) === 'function') {
      this.form.get(this.field.name)
        .valueChanges
        .pipe(debounceTime(500), startWith(null), distinctUntilChanged(), pairwise())
        .subscribe(([prev, next]: [any, any]) => {
          const value = this.field?.onValueChange(prev, next, this.form.value, this.formFields);
          if (value) {
            this.form.patchValue(value);
          }
        });
    }
  }

  onSelectDate(date:Date){
    const momenDate = moment(date).format(this.field?.momentFormat??'DD-MM-YYYY')
    console.log("moment date",momenDate)
    this.form?.get(this.field.name)?.setValue(momenDate);
  }

  disableDate(){
    if(this.field?.disabled){
      this.field.readonly = true;
      // this.field.minDateValue = new Date(this.field?.value);
      // this.field.maxDateValue = new Date(this.field?.value);
    }
  }

}
