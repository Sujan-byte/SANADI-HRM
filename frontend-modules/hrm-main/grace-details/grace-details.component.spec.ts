import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraceDetailsComponent } from './grace-details.component';

describe('GraceDetailsComponent', () => {
  let component: GraceDetailsComponent;
  let fixture: ComponentFixture<GraceDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraceDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GraceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
