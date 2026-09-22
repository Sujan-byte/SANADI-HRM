import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToggleBtnService{
    private dataSource = new Subject<any>();

  sendData(data: any) {
    this.dataSource.next(data);
  }

  getData() {
    return this.dataSource.asObservable();
  }
}