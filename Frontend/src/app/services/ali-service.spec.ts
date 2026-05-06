import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { AliService } from './ali-service';

describe('AliService', () => {
  let service: AliService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(AliService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
