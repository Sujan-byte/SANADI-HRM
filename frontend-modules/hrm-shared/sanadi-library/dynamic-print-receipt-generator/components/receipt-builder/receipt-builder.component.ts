import { AfterViewInit, Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { PrintTemplateService } from '../services/print-template.service';
import { After } from 'node:v8';

interface receiptFields {
  type: '',
  label_1: '',
  label_2: '',
  label_3: '',
  label_4: '',
  label_5: '',
  label_6: '',
  value: {};
}

@Component({
  selector: 'app-receipt-builder',
  templateUrl: './receipt-builder.component.html',
  styleUrls: ['./receipt-builder.component.scss']
})
export class ReceiptBuilderComponent implements OnDestroy  {
  @Input() fields: receiptFields[] | any;
  @Input() layout: any;
  @Input() config: any;

  constructor() { }
  @Input() selectedColor: string = '';
  @Input() selectedColorClass: string = '';

  @Input() pdfSrc!: any;

  applyColor() {
    if (!this.selectedColor) {
      this.selectedColorClass = '';
      return;
    }

    this.selectedColorClass = this.selectedColor;
  }

  ngOnDestroy(): void {
  this.pdfSrc = null;
}



}
