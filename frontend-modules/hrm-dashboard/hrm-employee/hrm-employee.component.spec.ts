import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrmEmployeeComponent } from './hrm-employee.component';

describe('HrmEmployeeComponent', () => {
  let component: HrmEmployeeComponent;
  let fixture: ComponentFixture<HrmEmployeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrmEmployeeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HrmEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
