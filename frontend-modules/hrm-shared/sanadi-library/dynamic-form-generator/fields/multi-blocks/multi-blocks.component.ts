import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'multi-blocks',
  templateUrl: './multi-blocks.component.html',
  styleUrls: ['./multi-blocks.component.scss'],
})
export class MultiBlocksComponent implements OnInit {
  @Input() fields: any;
  @Input() form: any;
  @Input() header: any;
  @Input() fillScreen: any;
  @Input() legendAlign: any;
  @Input() blockDivider: any;
  @Input() variant: string = 'single';
  @Input() toggleable: boolean = false;

  constructor() {}

  ngOnInit(): void {
    // console.log("multi fields",this.fillScreen)
  }
}
