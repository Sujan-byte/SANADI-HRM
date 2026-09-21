import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalaryCalculationComponent } from './salary-calculation.component';

describe('SalaryCalculationComponent', () => {
  let component: SalaryCalculationComponent;
  let fixture: ComponentFixture<SalaryCalculationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalaryCalculationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SalaryCalculationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
