import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalaryComponentsComponent } from './salary-components.component';

describe('SalaryComponentsComponent', () => {
  let component: SalaryComponentsComponent;
  let fixture: ComponentFixture<SalaryComponentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalaryComponentsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SalaryComponentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
