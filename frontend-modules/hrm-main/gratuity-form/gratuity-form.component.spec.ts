import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GratuityFormComponent } from './gratuity-form.component';

describe('GratuityFormComponent', () => {
  let component: GratuityFormComponent;
  let fixture: ComponentFixture<GratuityFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GratuityFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GratuityFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
