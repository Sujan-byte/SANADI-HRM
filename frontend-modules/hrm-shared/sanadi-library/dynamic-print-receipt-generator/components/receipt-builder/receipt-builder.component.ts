import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { NgxPrintModule } from 'ngx-print';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { PrintTemplateService } from '../services/print-template.service';
import { ReceiptFieldBuilderComponent } from '../receipt-field-builder/receipt-field-builder.component';

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
  standalone: true,
  imports: [CommonModule, ButtonModule, NgxPrintModule, NgxExtendedPdfViewerModule, ReceiptFieldBuilderComponent],
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
