import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimesheetApprovalsComponent } from './timesheet-approvals.component';

describe('TimesheetApprovalsComponent', () => {
  let component: TimesheetApprovalsComponent;
  let fixture: ComponentFixture<TimesheetApprovalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimesheetApprovalsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TimesheetApprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
