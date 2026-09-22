import { Injectable, inject } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { DialogComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/dialog/dialog.component';
import { DialogFooterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/dialog/dialog-footer/dialog-footer.component';

@Injectable({
  providedIn: 'root'
})
export class CustomDialogService {
  constructor(
    private dialogService: DialogService,
  ) { }

  openDialog(config: any, component: any, data?: any) {
    config['dialogService'] = this.dialogService;
    return new Promise((resolve, reject) => {
      const ref = this.dialogService.open(component, {
        header: config.pageTitle,
        width: config.dialogConfig?.width || '80%',
        height: config.dialogConfig?.height || '100%',
        contentStyle: { overflow: 'auto' },
        breakpoints: {
          '960px': '100vw',
          '640px': '100vw',
        },
        dismissableMask: true,
        appendTo: 'body',
        maximizable: true,
        modal: true,
        closeOnEscape: config?.closeOnEscape ?? true,
        closable: config?.closable ?? true,
        // baseZIndex:20,
        data: {
          config: config,
          customDialog: true,
          data: data,
        }
      });
      if (config?.maximize) {
        this.dialogService.getInstance(ref).maximize();
      }
      ref.onClose.subscribe((response: any) => {
        if (response) {
          resolve(response);
        }
      });
    })
  }

  openFormDialog(config: any, component: any, formConfig: any, data?: any) {
    // console.log("config: any, component: any, formConfig: any, data?: any",config?.isFooter, config, formConfig, data)
    return new Promise((resolve, reject) => {
      const ref = this.dialogService.open(component, {
        header: config.pageTitle,
        width: config.dialogConfig?.width || '100%',
        height: config.dialogConfig?.height || '100%',
        contentStyle: { overflow: 'auto' },
        breakpoints: {
          '960px': '100vw',
          '640px': '100vw',
        },
        dismissableMask: true,
        appendTo: 'body',
        maximizable: true,
        modal: true,
        closeOnEscape: config?.closeOnEscape === false ? false : true,
        closable: config?.closable === false ? false : true,
        // baseZIndex:20,
        data: {
          config: config,
          form: formConfig,
          customDialog: config?.customDialog ?? true,
          data: data,
          item: data,
        },
        templates: {
          // footer: config?.dialogConfig?.localFooterComponent ?? DialogFooterComponent,
          footer: (config?.isFooter==false) ? undefined: DialogFooterComponent,
        },
      });
      ref.onClose.subscribe((response: any) => {
        if (response) {
          resolve(response);
        }
      });
    })
  }
}
