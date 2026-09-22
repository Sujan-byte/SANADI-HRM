import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TableBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/table.builder';
import { LeaveMasterDetailsBreakupEnum, LeaveMasterDetailsEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/masters_enum/leave-master.enum';
import { LeaveMasterBreakupDetails } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/leave-master.model';
import { filter } from 'rxjs';


@Injectable({
    providedIn: 'root',
})
export class LeaveBreakupFormConfig {
    private translate = inject(TranslateService);

    public readonly LeaveBreakupDetailForm =
        () =>
            (dataFromComponent?: any, initialData?: any, isEditMode?: boolean, data?: any) => {
                console.log('data', data);
                let breakup_details = isEditMode ? data : [];
                return [
                  new TableBuilder(this.translate, LeaveMasterDetailsEnum.breakup_details, '',true)
                                  .columnSchema([
                                    { name: LeaveMasterDetailsBreakupEnum.allocated_year + "_TC",filter:true },
                                    { name: LeaveMasterDetailsBreakupEnum.allocated_month + "_TC",filter:true },
                                    { name: LeaveMasterDetailsBreakupEnum.opening_balance + "_TC" },
                                    { name: LeaveMasterDetailsBreakupEnum.allocated_leaves + "__TC" },
                                    { name: LeaveMasterDetailsBreakupEnum.utilized_leaves + "__TC" },
                                    { name: LeaveMasterDetailsBreakupEnum.available_leaves + "__TC" },
                                  ])
                                  .formInitialise<LeaveMasterBreakupDetails>(new LeaveMasterBreakupDetails())
                                  .formSchema([
            
                                    {
                                      name: LeaveMasterDetailsBreakupEnum.allocated_year,
                                      type: 'input',
                                      readonly:true
                                    },
                                    {
                                      name: LeaveMasterDetailsBreakupEnum.allocated_month,
                                      type: 'input',
                                      readonly:true
                                    },
                                    {
                                      name: LeaveMasterDetailsBreakupEnum.opening_balance,
                                      type: 'input',
                                      readonly:true
                                    },
                                    {
                                      name: LeaveMasterDetailsBreakupEnum.allocated_leaves,
                                      type: 'number',
                                    //   onValueChange: this.onChangeLeaveCalculationFields.bind(this),
                                    //   updateTableFooter: this.updateTableFooterValues.bind(this),
                                      maxFractionDigits: 2,
                                      minFractionDigits: 0,
                                    },
                                    {
                                      name: LeaveMasterDetailsBreakupEnum.utilized_leaves,
                                      type: 'number',
                                      maxFractionDigits: 2,
                                      minFractionDigits: 0,
                                      readonly: true
                                    },
                                    {
                                      name: LeaveMasterDetailsBreakupEnum.available_leaves,
                                      type: 'number',
                                      maxFractionDigits: 2,
                                      minFractionDigits: 0,
                                      readonly: true
                                    },
                                  ])
                                  .setTableWidth('62vw')
                                  .getDatasource<Array<LeaveMasterBreakupDetails>>('id', breakup_details)
                                  .buttonStates(true,true,true,true,true,true)
                                  .isHiddenAddButton(true)
                                  .build(),
                ];
            };
}
