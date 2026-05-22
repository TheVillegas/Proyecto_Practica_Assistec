import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { RamService } from './ram-service';

describe('RamService', () => {
  let service: RamService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(RamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
