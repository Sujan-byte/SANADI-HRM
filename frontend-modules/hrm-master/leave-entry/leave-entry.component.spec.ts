import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveEntryComponent } from './leave-entry.component';

describe('LeaveEntryComponent', () => {
  let component: LeaveEntryComponent;
  let fixture: ComponentFixture<LeaveEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LeaveEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
