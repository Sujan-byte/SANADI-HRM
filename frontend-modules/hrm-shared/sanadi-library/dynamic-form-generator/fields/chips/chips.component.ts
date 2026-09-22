import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import * as _ from "lodash";

@Component({
  selector: 'chips',
  templateUrl: './chips.component.html',
  styleUrls: ['./chips.component.scss']
})
export class ChipsComponent implements OnInit {
  selectedData: any = []
  tempArray: any = [];
  filtering: any;
  @Input() formName: string = '';
  rowSelected: boolean = false;
  rowUnSelected: boolean = false;
  tempDataSource: any = [];
  selectedArray: any = [];
  selectedMainArray: any = [];
  @Input() field: any = {};
  @Input() form: UntypedFormGroup | any;
  allowDuplicate: boolean = false;
  displayDialog: boolean = false;
  constructor() { }

  ngOnInit(): void {
    this.selectedData = this.field.value;
    if (this.field.selectedArray !== undefined && this.field.selectedCheckbox) {
      if (this.field.selectedArray.length) {
        // console.log("fields seected array",this.field.selectedArray)
        this.selectedArray = this.field.selectedArray;
      }
      else {
        // const _ = require('lodash');
        console.log("fields seected array", this.selectedData)
        this.selectedArray = _.chain(this.field?.tableList)
          .filter(o => _.some(this.selectedData, i => i.tableRowId === o.id))
          .map(o => ({ ...o, tableRowId: o.id }))
          .value();
      }
    }
  }

  onRowSelect(event: any) {
    event.data.tableRowId = event.data.id
    this.tempArray.push(event.data)
    this.tempDataSource = this.selectedData.filter(o => this.selectedArray.some(i => i.tableRowId !== o.tableRowId));
  }
  onRowUnselect(event: any) {
    this.rowUnSelected = true;
    this.tempArray = this.tempArray.filter((e) =>
      e.id !== event.data.id)
    this.tempDataSource = this.selectedData.filter(o => this.selectedArray.some(i => i.id === o.tableRowId));
    console.log("unselected data", this.tempDataSource, this.selectedData, this.selectedArray, this.tempArray)
  }


  getDialogueData(event: any) {
    if (this.field?.selectedCheckbox === true) {
      this.selectedData = this.tempDataSource;
      this.form.get(this.formName).setValue(this.tempDataSource);
    }
    else {
      this.tempArray = this.selectedArray;
    }
    if (typeof (this.field.getDialogueData) === 'function') {
      this.field?.getDialogueData(this.tempArray, this.form.value, this.selectedArray);
      this.filtering = 'none';
    }
  }
  onSelectAllData(event) {
    this.tempArray = this.selectedArray;
  }
  onCloseDialog(event, op) {
    this.rowUnSelected = false;
    if (this.field.selectedArray !== undefined && this.field.selectedCheckbox) {
      console.log("seleced data on close", this.selectedData, this.selectedArray)
      this.selectedArray = this.selectedArray.filter(o => this.selectedData.some(i => i.tableRowId === o.id));
      this.tempDataSource = [];
      this.tempArray = [];
      this.ngOnInit();
    }
  }
  globalSearch(event: any, tb: any) {
    return tb.filterGlobal(event.target.value, 'contains');
  }

  getSelectedItem(selectedItem) {
    console.log("selected item", selectedItem)
  }
  onChipRemoved(event) {
    if (typeof (this.field.onChipRemoved) === 'function') {
      this.field?.onChipRemoved(event.value, this.selectedData, this.form.value, this.selectedArray);
    }
    console.log("event on chip remove", this.selectedArray, this.selectedData)
  }


  openDialog(){
    if(this.field?.readonly!=true){
      this.displayDialog=true;
    }
  }
}
