import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ColiformesApiService } from './coliformes-api.service';

describe('ColiformesApiService', () => {
  let service: ColiformesApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ColiformesApiService]
    });
    service = TestBed.inject(ColiformesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('mapPresencia', () => {
    it('should map sin_registrar to null', () => {
      expect(service.mapPresencia('sin_registrar')).toBeNull();
    });

    it('should map positivo to true', () => {
      expect(service.mapPresencia('positivo')).toBeTrue();
    });

    it('should map negativo to false', () => {
      expect(service.mapPresencia('negativo')).toBeFalse();
    });

    it('should map unknown values to null', () => {
      expect(service.mapPresencia('random')).toBeNull();
      expect(service.mapPresencia('')).toBeNull();
    });
  });
});
