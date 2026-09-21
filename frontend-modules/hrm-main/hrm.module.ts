import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HrmRoutingModule } from './hrm-routing.module';
import { TableModule } from 'primeng/table';
import { NgxSpinnerModule } from 'ngx-spinner';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HrmRoutingModule,
    TableModule,
    NgxSpinnerModule,



  ]
})
export class HrmModule { }
