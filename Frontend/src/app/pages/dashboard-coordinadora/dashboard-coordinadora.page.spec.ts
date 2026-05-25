import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { SolicitudIngresoService } from 'src/app/services/solicitud-ingreso.service';
import { DashboardCoordinadoraPage } from './dashboard-coordinadora.page';

describe('DashboardCoordinadoraPage — visibilidad por rol', () => {
  let component: DashboardCoordinadoraPage;
  let fixture: ComponentFixture<DashboardCoordinadoraPage>;
  let routerSpy: jasmine.SpyObj<Router>;
  let serviceStub: jasmine.SpyObj<SolicitudIngresoService>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    serviceStub = jasmine.createSpyObj<SolicitudIngresoService>('SolicitudIngresoService', [
      'obtenerResumenDashboard',
      'obtenerBandejaDashboard'
    ]);

    serviceStub.obtenerResumenDashboard.and.returnValue(of({
      summary: { editable: 0, resubmittable: 0, under_review: 5, post_validation: 2 }
    }));
    serviceStub.obtenerBandejaDashboard.and.returnValue(of({
      items: [
        {
          id_solicitud: 'sol-3', numero_ali: 2001, codigo_externo: 'EXT-3',
          estado: 'enviado', family: 'under_review', updated_at: '2026-05-20',
          nombre_cliente: 'Cliente X'
        }
      ],
      summary: { under_review: 5 }
    }));

    await TestBed.configureTestingModule({
      declarations: [DashboardCoordinadoraPage],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: SolicitudIngresoService, useValue: serviceStub }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardCoordinadoraPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // REQ-14: Coordinadora dashboard shows under_review and post_validation counters
  it('muestra counters de revisión y post-validación desde summary', () => {
    expect(serviceStub.obtenerResumenDashboard).toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;

    const reviewEl = compiled.querySelector('[data-family="under_review"]');
    const postValEl = compiled.querySelector('[data-family="post_validation"]');

    expect(reviewEl?.textContent).toContain('5');
    expect(postValEl?.textContent).toContain('2');
  });

  // REQ-15: Shared review queue — no implica secuencia coordinadora→jefa
  it('muestra items de la cola compartida de revisión sin etiquetar secuencia falsa', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('[data-queue-item]');
    expect(items.length).toBeGreaterThanOrEqual(1);

    // No debe mencionar "jefe" o "jefatura" como paso secuencial
    const fullText = compiled.textContent ?? '';
    expect(fullText).not.toMatch(/pendiente.*jef(e|atura).*aprobaci[oó]n/i);
    expect(fullText).not.toMatch(/espera.*validaci[oó]n.*jef(e|atura)/i);
  });

  // REQ-16: Empty state cuando la cola está vacía
  it('muestra estado vacío si la bandeja no tiene items', () => {
    serviceStub.obtenerResumenDashboard.and.returnValue(of({
      summary: { editable: 0, resubmittable: 0, under_review: 0, post_validation: 0 }
    }));
    serviceStub.obtenerBandejaDashboard.and.returnValue(of({ items: [] }));
    fixture = TestBed.createComponent(DashboardCoordinadoraPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyEl = compiled.querySelector('[data-queue-empty]');
    expect(emptyEl).not.toBeNull();
  });

  it('conserva navegación a búsqueda de solicitudes y ALI', () => {
    component.busquedaSolicitud();
    component.busquedaALI();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/busqueda-solicitud-ingreso']);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/busqueda-ali']);
  });

  it('abre el detalle de la solicitud desde la bandeja de revisión', () => {
    component.verDetalle(component.queueItems[0]);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/solicitud-ingreso'], {
      queryParams: { id: 'sol-3' }
    });
  });
});
