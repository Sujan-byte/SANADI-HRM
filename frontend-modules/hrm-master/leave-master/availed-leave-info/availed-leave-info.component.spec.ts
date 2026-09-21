import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailedLeaveInfoComponent } from './availed-leave-info.component';

describe('AvailedLeaveInfoComponent', () => {
  let component: AvailedLeaveInfoComponent;
  let fixture: ComponentFixture<AvailedLeaveInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailedLeaveInfoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AvailedLeaveInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
