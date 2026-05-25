import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SolicitudIngresoService } from './solicitud-ingreso.service';
import { environment } from '../../environments/environment';

describe('SolicitudIngresoService', () => {
  let service: SolicitudIngresoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(SolicitudIngresoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('consulta el resumen del dashboard con family y actingRole tipados', () => {
    service.obtenerResumenDashboard({ family: 'under_review', actingRole: 1 }).subscribe();

    const request = httpMock.expectOne((req) => req.url === `${environment.apiUrl}/solicitud/summary`);

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('family')).toBe('under_review');
    expect(request.request.params.get('actingRole')).toBe('1');

    request.flush({ summary: { editable: 0, resubmittable: 0, under_review: 3, post_validation: 1 } });
  });

  it('consulta la bandeja del dashboard y omite parámetros indefinidos', () => {
    service.obtenerBandejaDashboard({ assignedToMe: true }).subscribe();

    const request = httpMock.expectOne((req) => req.url === `${environment.apiUrl}/solicitud/queue`);

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('assignedToMe')).toBe('true');
    expect(request.request.params.has('actingRole')).toBeFalse();
    expect(request.request.params.has('family')).toBeFalse();

    request.flush({ items: [] });
  });
});
