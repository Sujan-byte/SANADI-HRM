import { TestBed } from '@angular/core/testing';

import { TaDaService } from './ta-da.service';

describe('TaDaService', () => {
  let service: TaDaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaDaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
