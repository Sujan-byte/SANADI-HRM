import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CareerLetterComponent } from './career-letter.component';

describe('CareerLetterComponent', () => {
  let component: CareerLetterComponent;
  let fixture: ComponentFixture<CareerLetterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CareerLetterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CareerLetterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
