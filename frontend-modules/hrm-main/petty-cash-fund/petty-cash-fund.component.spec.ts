import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PettyCashFundComponent } from './petty-cash-fund.component';

describe('PettyCashFundComponent', () => {
  let component: PettyCashFundComponent;
  let fixture: ComponentFixture<PettyCashFundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PettyCashFundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PettyCashFundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
