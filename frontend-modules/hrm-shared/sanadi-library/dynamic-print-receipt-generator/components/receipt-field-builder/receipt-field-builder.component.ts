import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-receipt-field-builder',
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
