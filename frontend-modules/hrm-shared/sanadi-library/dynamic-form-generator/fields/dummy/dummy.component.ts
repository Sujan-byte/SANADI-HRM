import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'dummy',
  standalone: false,
  templateUrl: './dummy.component.html',
  styleUrl: './dummy.component.scss'
})
export class DummyComponent {
  @Input() field: any = {};
  @Input() form: FormGroup | any;
  @Input() formFields: any = [];

  constructor() { }

  ngOnInit() {
    // console.log('DummyComponent', this.form.get(this.field.name).value, this.field.name);
  }
}
