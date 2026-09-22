import { Component, inject, signal } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { TableFilterComponent } from "src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component";
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
// import { ShiftMasterService } from "./services/shift-master.service"; // You'll need to create this service
import { LocalCompServiceConfig } from "src/app/modules/hrm-shared/core/shared/common/model/app.model";
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ShiftService } from "./service/shift-services";

@Component({
    selector: "sanadi-shift-master",
    standalone: true,
    imports: [TableFilterComponent, DragDropModule],
    templateUrl: './shift-master.component.html',
    styleUrl: './shift-master.component.scss'
})
export class ShiftMasterComponent {
    private translate = inject(TranslateService);
    private shiftService: LocalCompServiceConfig = inject(ShiftService);
    
    // private shiftMasterService: LocalCompServiceConfig = inject(ShiftMasterService);
    private readonly shiftMasterRequiredFields = signal('id,shift_code,shift_name,start_time,end_time,status,duration');

    shiftMasterConfig = signal({
        formName: 'Shift Master',
        modelName: 'ShiftMaster',
        headerTitleKey: 'shift_code',
        pageTitle: this.translate.instant('Shift_master_TC'),
        tableHeaders: [
            {
                label: 'shift_code_TC',
                field: 'shift_code',
                matchModeOptions: [
                    { label: 'Starts With', value: FilterOptions.istartsWith },
                    { label: 'Ends With', value: FilterOptions.iendsWith },
                    { label: 'Contains', value: FilterOptions.iContains },
                    { label: 'Equal', value: FilterOptions.iExact },
                ],
                isFilterRequired: true,
            },
            {
                label: 'shift_name_TC',
                field: 'shift_name',
                matchModeOptions: [
                    { label: 'Starts With', value: FilterOptions.istartsWith },
                    { label: 'Ends With', value: FilterOptions.iendsWith },
                    { label: 'Contains', value: FilterOptions.iContains },
                    { label: 'Equal', value: FilterOptions.iExact },
                ],
                isFilterRequired: true,
            },
            {
                label: 'status_TC',
                field: 'status',
                matchModeOptions: [
                    { label: 'Starts With', value: FilterOptions.istartsWith },
                    { label: 'Ends With', value: FilterOptions.iendsWith },
                    { label: 'Contains', value: FilterOptions.iContains },
                    { label: 'Equal', value: FilterOptions.iExact },
                ],
                isFilterRequired: true,
            },
            {
                label: 'start_time_TC',
                field: 'start_time',
                matchModeOptions: [
                    { label: 'Equal', value: FilterOptions.iExact },
                    { label: 'Less than', value: FilterOptions.lt },
                    { label: 'Greater than', value: FilterOptions.gt },
                ],
                isFilterRequired: true,
            },
            {
                label: 'end_time_TC',
                field: 'end_time',
                matchModeOptions: [
                    { label: 'Equal', value: FilterOptions.iExact },
                    { label: 'Less than', value: FilterOptions.lt },
                    { label: 'Greater than', value: FilterOptions.gt },
                ],
                isFilterRequired: true,
            },
            {
                label: 'duration_TC',
                field: 'duration',
                matchModeOptions: [
                    { label: 'Equal', value: FilterOptions.iExact },
                    { label: 'Less than', value: FilterOptions.lt },
                    { label: 'Greater than', value: FilterOptions.gt },
                ],
                isFilterRequired: true,
            },
        ],
        tableBody: ['shift_code', 'shift_name', 'status', 'start_time', 'end_time', 'duration'],
        editable: true,
        params: {
            get: { required_fields: this.shiftMasterRequiredFields(), }
        },
        url: {
            post: '/master/shift-master/',
            get: '/master/shift-master/',
            delete: '/master/shift-master/',
            put: '/master/shift-master/',
        },
        actions: [
            {
                label: '',
                icon: 'pencil',
                getById: true,
                actionType: 'EDIT',
                tooltip: 'Edit',
            },
            {
                label: '',
                icon: 'trash',
                actionType: 'DELETE',
                tooltip: 'De-activate',
            },
            {
                label: '',
                icon: 'undo',
                actionType: 'RESTORE',
                tooltip: 'Restore',
            },
            {
                label: '',
                icon: 'history',
                actionType: 'HISTORY',
                tooltip: 'History',
            },
        ],
        toolBarActionConfig: {
            activeButton: true,
            inActiveButton: true
        },
        dialogData: {},
        isShowDialog: true,
        localCompService: this.shiftService

    });

    shiftMasterForm = signal(null);

    private readonly shiftMasterFormConfig = inject(FormConfig);

    ngOnInit(): void {
        this.shiftMasterForm.set(this.shiftMasterFormConfig.getForm()['shift-master'])
    }
}