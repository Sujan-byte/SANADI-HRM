import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from 'src/app/core/services/api.service';
import { matchModeOptionsDate } from 'src/app/core/shared/common/enum/app.enum';
import { TravelPlanningEnum } from 'src/app/core/shared/common/enum/hrm-enum/travel-planning.enum';
import { DynamicTableModel } from 'src/app/core/shared/common/model/app.model';
import { CustomDialogService } from 'src/app/core/shared/services/custom-dialog';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { DynamicTableComponent } from 'src/app/sanadi-library/sanadi-components/dynamic-table/dynamic-table.component';

@Injectable({
  providedIn: 'root'
})
export class TaDaService {
  public translate = inject(TranslateService);
  public _customDialogService = inject(CustomDialogService);
  public _apiService = inject(ApiService);

  constructor() { }

  travelPlanningConfig = {
    pageTitle: 'Select Travel Planning',
    dialogConfig: {
      width: '80%',
      height: '80%'
    },
  };

  async addTravelPlanning(formValue: any, object: any) {
    const dynamicObject: DynamicTableModel = {
      columnSchema: [
        { name: this.translate.instant(`${TravelPlanningEnum.plan_number}_TC`), field: TravelPlanningEnum.plan_number },
        { name: this.translate.instant(`${TravelPlanningEnum.from_date}_TC`), field: TravelPlanningEnum.from_date, matchModeOption: matchModeOptionsDate}, 
        { name: this.translate.instant(`${TravelPlanningEnum.to_date}_TC`), field: TravelPlanningEnum.to_date, matchModeOption: matchModeOptionsDate},
        { name: this.translate.instant(`${TravelPlanningEnum.place_name}_TC`), field: TravelPlanningEnum.place_name },
      ],
      selectionMode: 'single',
      rows: 10,
      scrollHeight: '55vh',
      formInitialise: [TravelPlanningEnum.plan_number, TravelPlanningEnum.from_date, TravelPlanningEnum.to_date,TravelPlanningEnum.place_name],
      paginator: true,
      scrollable: true,
      lazy: true,
      fontSize: '14px',
      queryParams: {
        ...object?.query,
        search_key: `${TravelPlanningEnum.plan_number},${TravelPlanningEnum.from_date},${TravelPlanningEnum.to_date},${TravelPlanningEnum.place_name}`,
        required_fields: `id,${TravelPlanningEnum.plan_number},${TravelPlanningEnum.from_date},${TravelPlanningEnum.to_date},${TravelPlanningEnum.place_name}`,
      },
      url: `${ServiceUrlConstants.TRAVEL_PLANNING_CRUD}`,
      tableName: 'table',
      height: '75vh',
      width: '75vw',
      directSelectedArray: true,
      idsList: object?.idsList || [],
    };
    const data: any = { field: dynamicObject, tableDataSource: [] };
    const response: any = await this._customDialogService.openDialog(this.travelPlanningConfig, DynamicTableComponent, data);
    console.log('response?.tempArray', response?.tempArray);
    return { tempArray: response?.tempArray };
  }

  async getLists(url: string, queryParams: any) {
    return await this._apiService.get(url, queryParams).toPromise();
  }
  
}
