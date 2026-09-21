import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PettyCashTransactionComponent } from './petty-cash-transaction.component';

describe('PettyCashTransactionComponent', () => {
  let component: PettyCashTransactionComponent;
  let fixture: ComponentFixture<PettyCashTransactionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PettyCashTransactionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PettyCashTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
