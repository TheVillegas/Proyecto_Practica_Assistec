import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CatalogosService } from './catalogos.service';
import { LoteReactivo } from '../interfaces/catalogo.interfaces';

describe('CatalogosService', () => {
  let service: CatalogosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(CatalogosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLotesReactivo', () => {
    it('should GET lotes reactivo filtered by tipo', () => {
      const mockLotes: LoteReactivo[] = [
        { idLoteReactivo: '1', tipo: 'agar_vrbg', codigoLote: 'VRBG-2025-A', fechaVencimiento: '2026-12-31', activo: true },
        { idLoteReactivo: '2', tipo: 'agar_vrbg', codigoLote: 'VRBG-2025-B', fechaVencimiento: '2027-06-30', activo: true }
      ];

      service.getLotesReactivo('agar_vrbg').subscribe((res) => {
        expect(res.length).toBe(2);
        expect(res[0].codigoLote).toBe('VRBG-2025-A');
      });

      const req = httpMock.expectOne('http://localhost:3002/api/catalogo/lotes_reactivo?tipo=agar_vrbg');
      expect(req.request.method).toBe('GET');
      req.flush(mockLotes);
    });
  });
});
