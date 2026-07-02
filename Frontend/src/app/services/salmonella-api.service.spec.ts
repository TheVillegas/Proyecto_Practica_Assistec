import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SalmonellaApiService } from './salmonella-api.service';
import {
  SalFase1Payload,
  SalFase2aPayload,
  SalFase3cPayload,
  SalFormularioCompleto
} from '../interfaces/salmonella.interfaces';
import { environment } from '../../environments/environment';

describe('SalmonellaApiService', () => {
  let service: SalmonellaApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SalmonellaApiService]
    });
    service = TestBed.inject(SalmonellaApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe obtener formulario por analisis', () => {
    const mockResponse = { existe: true, formulario: null as SalFormularioCompleto | null };

    service.obtenerPorAnalisis(123).subscribe((res) => {
      expect(res.existe).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/formulario/sal/por-analisis/123`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('debe obtener formulario por id', () => {
    const mockResponse = { idSalFormulario: 1 } as SalFormularioCompleto;

    service.obtener(1).subscribe((res) => {
      expect(res.idSalFormulario).toBe(1);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/formulario/sal/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('debe guardar fase 1 bajo key fase (snake_case, validado por Zod en el backend)', () => {
    const payload: SalFase1Payload = {
      fecha_hora_inicio_incubacion: '2026-06-24T10:00:00.000Z',
      tipo_matriz: 'Chocolate',
      peso_muestra: '25g',
      id_medio_caldo_homogeneizacion: 3,
      completada: true
    };

    service.guardarFase(1, 1, payload, '2026-06-24T10:00:00.000Z').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/formulario/sal/1/fase/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      updated_at: '2026-06-24T10:00:00.000Z',
      completada: true,
      fase: payload
    });
    req.flush({} as SalFormularioCompleto);
  });

  it('debe guardar fase 2 bajo key fase2a', () => {
    const payload: SalFase2aPayload = {
      fecha_siembra: '2026-06-24T00:00:00.000Z',
      hora_inicio_homo: '2026-06-24T10:00:00.000Z',
      hora_termino_homo: '2026-06-24T10:00:00.000Z',
      hora_ingreso_estufa: '2026-06-24T10:30:00.000Z',
      rut_analista_responsable: '1-9',
      completada: true
    };

    service.guardarFase(1, 2, payload, '2026-06-24T10:00:00.000Z').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/formulario/sal/1/fase/2`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      updated_at: '2026-06-24T10:00:00.000Z',
      completada: true,
      fase2a: payload
    });
    req.flush({} as SalFormularioCompleto);
  });

  it('debe guardar fase 7 bajo key lecturas (sin wrapper fase)', () => {
    const payload: SalFase3cPayload = {
      lecturas: [{ id_sal_muestra: 1 }],
      completada: true
    };

    service.guardarFase(1, 7, payload, '2026-06-24T10:00:00.000Z').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/formulario/sal/1/fase/7`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      updated_at: '2026-06-24T10:00:00.000Z',
      completada: true,
      lecturas: [{ id_sal_muestra: 1 }]
    });
    req.flush({} as SalFormularioCompleto);
  });

  it('debe incluir arreglos extra (tween_pipetas/micropipetas) para fase 3', () => {
    const payload = {
      id_medio_caldo: 1,
      id_estufa: 2,
      completada: false
    };

    service.guardarFase(1, 3, payload, '2026-06-24T10:00:00.000Z', {
      tween_pipetas: [{ id_material: 5 }],
      micropipetas: [{ id_pipeta: 7 }]
    }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/formulario/sal/1/fase/3`);
    expect(req.request.body).toEqual({
      updated_at: '2026-06-24T10:00:00.000Z',
      completada: false,
      fase: payload,
      tween_pipetas: [{ id_material: 5 }],
      micropipetas: [{ id_pipeta: 7 }]
    });
    req.flush({} as SalFormularioCompleto);
  });
});
