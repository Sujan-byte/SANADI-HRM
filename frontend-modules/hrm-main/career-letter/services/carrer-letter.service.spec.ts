import { TestBed } from '@angular/core/testing';

import { CarrerLetterService } from './carrer-letter.service';

describe('CarrerLetterService', () => {
  let service: CarrerLetterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CarrerLetterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
