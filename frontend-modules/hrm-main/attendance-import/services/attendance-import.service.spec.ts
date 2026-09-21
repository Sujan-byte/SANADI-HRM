import { TestBed } from '@angular/core/testing';

import { AttendanceImportService } from './attendance-import.service';

describe('AttendanceImportService', () => {
  let service: AttendanceImportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttendanceImportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
