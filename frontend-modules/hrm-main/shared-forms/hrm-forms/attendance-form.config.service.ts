import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { DateField } from 'src/app/core/shared/common/forms/core/builders/date.builder';
import { AttendanceDetailsEnum, AttendanceImportEnum } from 'src/app/core/shared/common/enum/hrm-enum/attendance.enum';
import { AttendanceDetails, AttendanceImportModel } from 'src/app/core/shared/common/model/hrm/attendance.model';
import { FileField } from 'src/app/core/shared/common/forms/core/builders/file.builder';
import { TableBuilder } from 'src/app/core/shared/common/forms/core/builders/table.builder';
import * as moment from 'moment';
@Injectable({
  providedIn: 'root',
})
export class AttendanceImportFormConfig {
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);

  public readonly AttendanceImportForm =
    () =>
      (dataFromComponent?: any, initialData?: AttendanceImportModel, isEditMode?: boolean, data?: AttendanceImportModel) => {
        initialData = new AttendanceImportModel();
        let attendance_details = isEditMode ? data.attendance_details : [];
        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('attendanceDetails_TC'),
                fields: [
                    new FileField(this.translate, AttendanceImportEnum.attendance, isEditMode, data, initialData).addFieldWidth('20%').setAlignment('center').toObject(),
                    new DateField(this.translate, AttendanceImportEnum.date, isEditMode, data, initialData).addFieldWidth('24%').toObject(),
                    new TableBuilder(this.translate, AttendanceImportEnum.attendance_details, '', true)
                    .columnSchema([
                      { name: AttendanceDetailsEnum.date + "_TC", colWidth: '100px' },
                      { name: AttendanceDetailsEnum.employee_code + "_TC", colWidth: '150px' },
                      { name: AttendanceDetailsEnum.employee_name + "_TC", colWidth: '150px' },
                      { name: AttendanceDetailsEnum.login_time + "_TC", colWidth: '150px' },
                      { name: AttendanceDetailsEnum.logout_time + "_TC", colWidth: '150px' },
                      { name: AttendanceDetailsEnum.working_time + "_TC", colWidth: '150px' },
                      { name: AttendanceDetailsEnum.status + "_TC", colWidth: '150px' },
                    ])
                    .formInitialise<AttendanceDetails>(new AttendanceDetails())
                    .formSchema([
                      {
                        name: AttendanceDetailsEnum.date,
                        type: 'input',
                        readonly: true,
                      },
                      {
                        name: AttendanceDetailsEnum.employee_code,
                        type: 'input',
                        readonly: true,
                      },
                      {
                        name: AttendanceDetailsEnum.employee_name,
                        type: 'input',
                        readonly: true,
                      },
                      {
                        name: AttendanceDetailsEnum.login_time,
                        type: 'input',
                        readonly: true,
                      },
                      {
                        name: AttendanceDetailsEnum.logout_time,
                        type: 'input',
                        readonly: true,
                      },
                      {
                        name: AttendanceDetailsEnum.working_time,
                        type: 'input',
                        readonly: true,
                      },
                      {
                        name: AttendanceDetailsEnum.status,
                        type: 'input',
                        readonly: true,
                      },
                 
                    ])
                    .getDatasource<Array<AttendanceDetails>>('id', attendance_details)
                    .setAddButton(true)
                    .build(),
                ],
              }
            ])
        ];
      };

      public onImportResponse(response: any, formValue: AttendanceImportModel) {
        formValue.date = moment(response?.date).format('DD-MM-YYYY');
        response?.employee_attendance_list?.forEach((element: any) => {
            let tableRowObject = {
                id: '',
                date: '',
                employee_code: '',
                employee_name: '',
                login_time: '',
                logout_time: '',
                working_time: '',
                status: ''
            };
            const id = this.generateUniqueId();
            tableRowObject.id = id;
            tableRowObject.date = moment(element.date).format('DD-MM-YYYY');
            tableRowObject.employee_code = element.employee_code;
            tableRowObject.employee_name = element.employee_name;
            tableRowObject.login_time = element.login_time;
            tableRowObject.logout_time = element.logout_time;
            tableRowObject.working_time = element.working_time;
            tableRowObject.status = element.status;
            formValue.attendance_details.push(tableRowObject);
        });
    
        console.log("Response from onImport:", response);
    }
    
      generateUniqueId() {
        return Math.floor(1000000000000 + Math.random() * 9000) + 'A';
      }
}
