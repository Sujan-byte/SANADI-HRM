import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, pairwise, startWith } from 'rxjs';

@Component({
  selector: 'checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss']
})
export class CheckboxComponent implements OnInit {

  @Input() field: any = {};
  @Input() form: UntypedFormGroup | any;
  get isValid() { 
    return this.form?.controls[this.field.name].valid; 
  }
  get isDirty() { 
    return this.form?.controls[this.field.name].dirty; 
  }

  constructor() { }

  ngOnInit(): void {
    this.onValueChanges()
  }

  onValueChanges() {
    if (typeof (this.field.onValueChange) === 'function') {
      this.form.get(this.field.name)
        .valueChanges
        // .pipe(debounceTime(500), startWith(null), distinctUntilChanged(), pairwise())
        .subscribe(async ([prev, next]: [any, any]) => {
          const value = await this.field?.onValueChange(prev, next, this.form.value);
          // console.log("out patch value dropdown",value)
          if (value) {
            // console.log("patch value dropdown",value)
            this.form.patchValue(value);
          }
        });
    }
  }

}
