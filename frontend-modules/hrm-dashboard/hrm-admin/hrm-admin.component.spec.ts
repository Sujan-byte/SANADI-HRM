import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrmAdminComponent } from './hrm-admin.component';

describe('HrmAdminComponent', () => {
  let component: HrmAdminComponent;
  let fixture: ComponentFixture<HrmAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrmAdminComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HrmAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
