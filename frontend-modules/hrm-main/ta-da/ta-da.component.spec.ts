import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaDaComponent } from './ta-da.component';

describe('TaDaComponent', () => {
  let component: TaDaComponent;
  let fixture: ComponentFixture<TaDaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaDaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TaDaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
