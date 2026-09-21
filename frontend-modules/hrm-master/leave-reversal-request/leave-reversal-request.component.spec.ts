import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveReversalRequestComponent } from './leave-reversal-request.component';

describe('LeaveReversalRequestComponent', () => {
  let component: LeaveReversalRequestComponent;
  let fixture: ComponentFixture<LeaveReversalRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveReversalRequestComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LeaveReversalRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
