import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EnterobacteriasApiService } from './enterobacterias-api.service';
import { EntEtapaPayload, EntFormularioCompleto } from '../interfaces/enterobacterias.interfaces';

describe('EnterobacteriasApiService', () => {
  let service: EnterobacteriasApiService;
  let httpMock: HttpTestingController;

  const baseUrl = 'http://localhost:3002/api/formulario/ent';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(EnterobacteriasApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('obtenerPorAnalisis', () => {
    it('should GET por-analisis and return existe:true with formulario', () => {
      const mockResponse = {
        existe: true,
        formulario: {
          idEntFormulario: '1',
          idSolicitudAnalisis: '2',
          etapaActual: 1,
          subetapaActual: 1,
          estado: 'en_proceso',
          createdAt: '2026-06-24T00:00:00.000Z',
          updatedAt: '2026-06-24T00:00:00.000Z',
          muestras: []
        } as EntFormularioCompleto
      };

      service.obtenerPorAnalisis(99).subscribe((res) => {
        expect(res.existe).toBeTrue();
        expect(res.formulario?.idEntFormulario).toBe('1');
      });

      const req = httpMock.expectOne(`${baseUrl}/por-analisis/99`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return existe:false when no formulario exists', () => {
      service.obtenerPorAnalisis(999).subscribe((res) => {
        expect(res.existe).toBeFalse();
        expect(res.formulario).toBeNull();
      });

      const req = httpMock.expectOne(`${baseUrl}/por-analisis/999`);
      expect(req.request.method).toBe('GET');
      req.flush({ existe: false, formulario: null });
    });
  });

  describe('obtener', () => {
    it('should GET formulario by id', () => {
      const mockForm: EntFormularioCompleto = {
        idEntFormulario: '7',
        idSolicitudAnalisis: '10',
        etapaActual: 2,
        subetapaActual: 5,
        estado: 'en_proceso',
        updatedAt: '2026-06-24T10:00:00.000Z',
        createdAt: '2026-06-23T10:00:00.000Z',
        muestras: []
      };

      service.obtener(7).subscribe((res) => {
        expect(res.idEntFormulario).toBe('7');
        expect(res.etapaActual).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/7`);
      expect(req.request.method).toBe('GET');
      req.flush(mockForm);
    });
  });

  describe('guardarEtapa', () => {
    it('should PUT etapa with updated_at, completada and etapa payload', () => {
      const payload: EntEtapaPayload = {
        completada: true,
        etapa: { codigoAli: 'ALI-01', nActa: 'ACTA-01', tipoMuestra: 'Mixta' }
      };
      const updatedAt = '2026-06-24T12:00:00.000Z';
      const mockResponse: EntFormularioCompleto = {
        idEntFormulario: '1',
        idSolicitudAnalisis: '2',
        etapaActual: 2,
        subetapaActual: 1,
        estado: 'en_proceso',
        updatedAt: '2026-06-24T12:01:00.000Z',
        createdAt: '2026-06-24T11:00:00.000Z',
        muestras: []
      };

      service.guardarEtapa(1, 1, payload, updatedAt).subscribe((res) => {
        expect(res.idEntFormulario).toBe('1');
        expect(res.updatedAt).toBe('2026-06-24T12:01:00.000Z');
      });

      const req = httpMock.expectOne(`${baseUrl}/1/etapa/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        updated_at: updatedAt,
        completada: true,
        etapa: { codigoAli: 'ALI-01', nActa: 'ACTA-01', tipoMuestra: 'Mixta' }
      });
      req.flush(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should propagate 409 CONCURRENCY_ERROR', () => {
      const payload: EntEtapaPayload = { completada: true, etapa: {} };
      let receivedError: unknown;

      service.guardarEtapa(1, 1, payload, '2026-06-24T12:00:00.000Z').subscribe({
        next: () => fail('should have failed'),
        error: (err) => { receivedError = err; }
      });

      const req = httpMock.expectOne(`${baseUrl}/1/etapa/1`);
      req.flush(
        { codigo: 'CONCURRENCY_ERROR', mensaje: 'El registro fue modificado por otro usuario' },
        { status: 409, statusText: 'Conflict' }
      );

      expect((receivedError as { status: number }).status).toBe(409);
    });

    it('should propagate 422 INCUBATION_LOCKOUT with horas_restantes', () => {
      const payload: EntEtapaPayload = { completada: true, etapa: {} };
      let receivedError: unknown;

      service.guardarEtapa(1, 2, payload, '2026-06-24T12:00:00.000Z').subscribe({
        next: () => fail('should have failed'),
        error: (err) => { receivedError = err; }
      });

      const req = httpMock.expectOne(`${baseUrl}/1/etapa/2`);
      req.flush(
        { codigo: 'INCUBATION_LOCKOUT', mensaje: 'Deben transcurrir 24 horas', detalles: { horas_restantes: 5 } },
        { status: 422, statusText: 'Unprocessable Entity' }
      );

      const error = receivedError as { status: number; error: { codigo: string } };
      expect(error.status).toBe(422);
      expect(error.error.codigo).toBe('INCUBATION_LOCKOUT');
    });
  });
});
