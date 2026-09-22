import { AfterViewInit, Component, Input, OnInit, ViewChild, signal } from '@angular/core';
import { Accordion, AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'sanadi-accordion',
  // standalone: true,
  // imports: [AccordionModule],
  templateUrl: './accordion.component.html',
  styleUrl: './accordion.component.scss'
})
export class AccordionComponent implements OnInit, AfterViewInit {
  @Input() mainField: any;
  @Input() fields: any;
  @Input() form: any;
  @Input() multiple: boolean = false;
  @Input() accordionStyle: any;
  @ViewChild('acc') accordion: Accordion;
  @Input() formFields: any;
  ngOnInit() {
    this.accordionStyle = this.mainField?.accordionStyle || { 'width': '94vw' };
  }
  ngAfterViewInit() {
    if (!this.multiple) {
      this.accordion.activeIndex = 0;
    }
    // console.log("form fields",this.fields)
  }
  hideFields(val: Function) {
    // console.log('hidefiels', formValue, val(formValue))
    return val(this.form.value);
  }
}
