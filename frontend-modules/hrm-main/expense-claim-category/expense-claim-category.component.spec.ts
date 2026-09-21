import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseClaimCategoryComponent } from './expense-claim-category.component';

describe('ExpenseClaimCategoryComponent', () => {
  let component: ExpenseClaimCategoryComponent;
  let fixture: ComponentFixture<ExpenseClaimCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseClaimCategoryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExpenseClaimCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
