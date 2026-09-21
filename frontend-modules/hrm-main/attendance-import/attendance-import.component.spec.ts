import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceImportComponent } from './attendance-import.component';

describe('AttendanceImportComponent', () => {
  let component: AttendanceImportComponent;
  let fixture: ComponentFixture<AttendanceImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceImportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AttendanceImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
