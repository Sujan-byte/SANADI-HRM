import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, pairwise, startWith } from 'rxjs/operators';

@Component({
  selector: 'slide-toggle',
  templateUrl: './slide-toggle.component.html',
  styleUrls: ['./slide-toggle.component.scss']
})
export class SlideToggleComponent implements OnInit {

  @Input() field:any = {};
  @Input() form:UntypedFormGroup | any;
  @Input() formFields: any;
  toggleField: any;

  constructor() { }

  ngOnInit(): void {
    this.onValueChanges();
  }

  // async onChangeHandler($event: any) {
  //   // console.log("on Slide Toggle event", $event);
  //   if ($event?.value) {
  //     this.field.value = $event?.value;
  //   }
  //   if (typeof (this.field.onClickValue) === 'function') {
  //     const response = await this.field.onClickValue($event, this.form.value, this.formFields, this.field, this.form);
  //     if (response)
  //       this.form.patchValue(response);
  //   }
  // }

async onChangeHandler($event: any) {
    // console.log("on change dropdowj event", $event)
    if ($event) {
      this.field.value = $event?.checked;
      let value
      // console.log("value", $event?.checked)
      if (typeof (this.field?.onValueChangeOnly) === 'function') {
        value = await this.field?.onValueChangeOnly($event?.checked, $event?.checked, this.form.value, this.formFields);
      }
      if (typeof (this.field.onClickValue) === 'function') {
        value = await this.field.onClickValue($event, $event?.checked, this.form.value, this.formFields);
      }
      if (value) {
        this.form.patchValue(value);
      }
    }
  }
  
  onValueChanges() {
    if (typeof (this.field.onValueChange) === 'function') {
      this.form.get(this.field.name)
        .valueChanges
        .pipe(debounceTime(500), startWith(null), distinctUntilChanged(), pairwise())
        .subscribe(([prev, next]: [any, any]) => {
          // console.log('formFields in onValueChanges:', this.formFields); // Debugging line
          const value = this.field?.onValueChange(prev, next, this.form.value, this.formFields);
          if (value) {
            this.form.patchValue(value);
          }
        });
    }
  }

}
