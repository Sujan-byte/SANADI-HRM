import { TestBed } from '@angular/core/testing';

import { SalaryCalculationService } from './salary-calculation.service';

describe('SalaryCalculationService', () => {
  let service: SalaryCalculationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SalaryCalculationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
