import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftTimingsComponent } from './shift-timings.component';

describe('ShiftTimingsComponent', () => {
  let component: ShiftTimingsComponent;
  let fixture: ComponentFixture<ShiftTimingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShiftTimingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShiftTimingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
