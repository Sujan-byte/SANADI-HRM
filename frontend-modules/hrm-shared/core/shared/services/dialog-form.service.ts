import { Injectable, inject } from '@angular/core';
import { DialogService, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { DialogComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/dialog/dialog.component';
import { DialogFooterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/dialog/dialog-footer/dialog-footer.component';
import { DialogHeaderComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/dialog/dialog-header/dialog-header.component';

@Injectable({
  providedIn: 'root'
})
export class DialogHandlerService {
  constructor(
    private dialogService: DialogService,
  ) { }

  openDialog(config: any, formConfig: any, isEditMode: boolean = false, data?: any) {
    // console.log("config", config, formConfig);
    config['dialogService'] = this.dialogService;
    const dialogConfig: DynamicDialogConfig = {
      header: config.pageTitle,
      width: config.dialogConfig?.width || '100%',
      height: config.dialogConfig?.height || '100%',
      contentStyle: { overflow: 'auto' },
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      dismissableMask: config?.dismissableMask ?? false,
      appendTo: 'body',
      maximizable: config?.maximizable ?? true,
      position: config?.position ?? 'center',
      data: {
        config: config,
        form: formConfig,
        isEditMode: isEditMode,
        item: data,
        customDialog: config?.customDialog ?? true,
        initialData: config.dialogData
      },
      templates: {
        footer: config?.isShowFooter === false ? undefined : DialogFooterComponent,
        header: config.dialogConfig?.headerActions ? DialogHeaderComponent : undefined
      },
    }
    if ('baseZIndex' in dialogConfig) {
      dialogConfig.baseZIndex = dialogConfig?.baseZIndex;
    }
    return new Promise((resolve, reject) => {
      const ref = this.dialogService.open(DialogComponent,
        dialogConfig
      );
      ref.onClose.subscribe((response: any) => {
        // console.log('dialogService', response);
        if (response) {
          resolve(response);
        }
        if (config?.onCloseResponse) {
          resolve(response);
        }
      });
      if (!config.dialogConfig) {
        this.dialogService.dialogComponentRefMap.forEach(x => {
          x.instance.maximized = true;
        });
      }
    })
  }
}
