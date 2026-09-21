import { TestBed } from '@angular/core/testing';

import { LeaveEntryService } from './leave-entry.service';

describe('LeaveEntryService', () => {
  let service: LeaveEntryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeaveEntryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
