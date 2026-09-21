import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HolidayMasterComponent } from './holiday-master.component';

describe('HolidayMasterComponent', () => {
  let component: HolidayMasterComponent;
  let fixture: ComponentFixture<HolidayMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HolidayMasterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HolidayMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
