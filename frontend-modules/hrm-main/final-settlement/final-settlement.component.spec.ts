import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalSettlementComponent } from './final-settlement.component';

describe('FinalSettlementComponent', () => {
  let component: FinalSettlementComponent;
  let fixture: ComponentFixture<FinalSettlementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalSettlementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FinalSettlementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
