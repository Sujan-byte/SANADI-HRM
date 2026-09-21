import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeavePolicyComponent } from './leave-policy.component';

describe('LeaveEntryComponent', () => {
  let component: LeavePolicyComponent;
  let fixture: ComponentFixture<LeavePolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeavePolicyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LeavePolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
