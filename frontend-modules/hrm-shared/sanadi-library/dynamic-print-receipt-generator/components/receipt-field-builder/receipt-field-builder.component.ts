import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { CareerLetterPrintComponent } from '../../print-components/career-letter-print/career-letter-print.component';

@Component({
  selector: 'app-receipt-field-builder',
  standalone: true,
  imports: [CommonModule, CareerLetterPrintComponent],
  templateUrl: './receipt-field-builder.component.html',
  styleUrls: ['./receipt-field-builder.component.scss']
})
export class ReceiptFieldBuilderComponent implements OnInit {
  @Input() fields: any
  @Input() selectedColorClass: string = 'theme-blue';

  constructor() { }

  ngOnInit(): void {
  }

}
