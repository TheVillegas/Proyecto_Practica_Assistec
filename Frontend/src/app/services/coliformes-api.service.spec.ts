import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ColiformesApiService } from './coliformes-api.service';
import { BloqueTabla } from '../pages/form-coliformes/form-coliformes.page';

const MOCK_UPDATED_AT = '2025-01-01T00:00:00.000Z';

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

  describe('mapSubmuestrasToPayload', () => {
    it('should convert BloqueTabla to ColiFase3Submuestra array', () => {
      const tabla: BloqueTabla = {
        fechaLectura: '2025-06-21',
        horaLectura: '10:00',
        analistaResponsable: 'Ana',
        entradas: [
          {
            id: '1',
            esDuplicado: false,
            label: 'Muestra 1',
            submuestras: {
              '1ml': ['positivo', 'negativo', 'sin_registrar'],
              '0.1ml': ['negativo', 'positivo', 'positivo'],
              '0.01ml': ['sin_registrar', 'sin_registrar', 'negativo'],
            },
          },
        ],
      };
      const diluciones = ['1ml', '0.1ml', '0.01ml'];

      const result = service.mapSubmuestrasToPayload(tabla, 'totales', diluciones);

      expect(result.length).toBe(9); // 1 entrada × 3 diluciones × 3 tubos
      expect(result[0]).toEqual({
        idColiMuestra: 1,
        tipoLectura: 'totales',
        dilucion: '1ml',
        numeroTubo: 1,
        presencia: true,
      });
      expect(result[1].presencia).toBeFalse();
      expect(result[2].presencia).toBeNull();
    });

    it('should use explicit tipoLectura passed in', () => {
      const diluciones = ['1ml'];
      const tabla: BloqueTabla = {
        fechaLectura: '',
        horaLectura: '',
        analistaResponsable: '',
        entradas: [
          { id: '1', esDuplicado: false, label: 'M1', submuestras: { '1ml': ['positivo', 'sin_registrar', 'sin_registrar'] } },
        ],
      };

      const resultFecales = service.mapSubmuestrasToPayload(tabla, 'fecales', diluciones);
      expect(resultFecales[0].tipoLectura).toBe('fecales');

      const resultEcoli = service.mapSubmuestrasToPayload(tabla, 'ecoli', diluciones);
      expect(resultEcoli[0].tipoLectura).toBe('ecoli');
    });
  });

  describe('HTTP methods', () => {
    it('should GET formulario by id', () => {
      const mockForm = { idColiFormulario: 1, faseActual: 1, estado: 'BORRADOR', updatedAt: MOCK_UPDATED_AT, muestras: [] };
      service.getFormulario(1).subscribe((res) => {
        expect(res.idColiFormulario).toBe(1);
      });

      const req = httpMock.expectOne('http://localhost:3002/api/coliformes/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockForm);
    });

    it('should PUT saveFase1 with correct URL and updated_at in body', () => {
      const payload = { rutAnalistaInicio: 'Ana', rutAnalistaTermino: 'Ben', completada: true };
      service.saveFase1(1, payload, MOCK_UPDATED_AT).subscribe();

      const req = httpMock.expectOne('http://localhost:3002/api/coliformes/1/fase/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.updated_at).toBe(MOCK_UPDATED_AT);
      expect(req.request.body.fase.rut_analista_inicio).toBe('Ana');
      req.flush({});
    });

    it('should PUT saveFase2 with correct URL and payload', () => {
      const payload = { codigoCaldoLauril: 'CL-01', estufas: [{ idIncubacion: 1 }], micropipetas: [{ idPipeta: 1, capacidad: '1ml' }], completada: true };
      service.saveFase2(1, payload, MOCK_UPDATED_AT).subscribe();

      const req = httpMock.expectOne('http://localhost:3002/api/coliformes/1/fase/2');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.updated_at).toBe(MOCK_UPDATED_AT);
      req.flush({});
    });

    it('should PUT saveFase3 with correct URL and payload', () => {
      const payload = { submuestras: [], completada: true };
      service.saveFase3(1, payload, MOCK_UPDATED_AT).subscribe();

      const req = httpMock.expectOne('http://localhost:3002/api/coliformes/1/fase/3');
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('should PUT saveFase35 with correct URL 3.5', () => {
      const payload = {
        controles: {
          ctControlKAerogenes: 'presencia', ctControlSAureus: 'ausencia',
          ctControlEColi: 'presencia', ctControlBlanco: 'OK',
          cfControlEColi: 'presencia', cfControlKAerogenes: 'ausencia', cfControlBlanco: 'OK',
          ecControlEColi: 'presencia', ecControlKAerogenes: 'ausencia', ecControlBlanco: 'OK'
        },
        completada: true
      };
      service.saveFase35(1, payload, MOCK_UPDATED_AT).subscribe();

      const req = httpMock.expectOne('http://localhost:3002/api/coliformes/1/fase/3.5');
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('should PUT saveFase4 with correct URL and payload', () => {
      const payload = { submuestras: [], completada: true };
      service.saveFase4(1, payload, MOCK_UPDATED_AT).subscribe();

      const req = httpMock.expectOne('http://localhost:3002/api/coliformes/1/fase/4');
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });
  });

  describe('error handling', () => {
    it('should retry once on network error after 2s delay', fakeAsync(() => {
      let errorCount = 0;
      const payload = { rutAnalistaInicio: 'Ana', rutAnalistaTermino: 'Ben', completada: true };

      service.saveFase1(1, payload, MOCK_UPDATED_AT).subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          errorCount++;
          expect(err.status).toBe(500);
        },
      });

      const req1 = httpMock.expectOne('http://localhost:3002/api/coliformes/1/fase/1');
      req1.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      tick(2000);

      const req2 = httpMock.expectOne('http://localhost:3002/api/coliformes/1/fase/1');
      req2.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      tick(0);

      expect(errorCount).toBe(1);
      flush();
    }));

    it('should propagate 409 conflict without retry', () => {
      let errorReceived = false;
      const payload = { rutAnalistaInicio: 'Ana', rutAnalistaTermino: 'Ben', completada: true };

      service.saveFase1(1, payload, MOCK_UPDATED_AT).subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          errorReceived = true;
          expect(err.status).toBe(409);
        },
      });

      const req = httpMock.expectOne('http://localhost:3002/api/coliformes/1/fase/1');
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });

      expect(errorReceived).toBeTrue();
    });
  });
});
