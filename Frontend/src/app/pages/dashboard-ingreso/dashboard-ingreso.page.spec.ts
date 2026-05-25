import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { SolicitudIngresoService } from 'src/app/services/solicitud-ingreso.service';
import { DashboardIngresoPage } from './dashboard-ingreso.page';

describe('DashboardIngresoPage — integración real con summary/queue', () => {
  let component: DashboardIngresoPage;
  let fixture: ComponentFixture<DashboardIngresoPage>;
  let routerSpy: jasmine.SpyObj<Router>;
  let serviceStub: jasmine.SpyObj<SolicitudIngresoService>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    serviceStub = jasmine.createSpyObj<SolicitudIngresoService>('SolicitudIngresoService', [
      'obtenerResumenDashboard',
      'obtenerBandejaDashboard'
    ]);

    serviceStub.obtenerResumenDashboard.and.returnValue(of({
      summary: { editable: 2, resubmittable: 1, under_review: 3, post_validation: 0 }
    }));
    serviceStub.obtenerBandejaDashboard.and.returnValue(of({
      items: [
        {
          id_solicitud: 'sol-1', numero_ali: 1001, codigo_externo: 'EXT-1',
          estado: 'borrador', family: 'editable', updated_at: '2026-05-20',
          nombre_cliente: 'Cliente A'
        },
        {
          id_solicitud: 'sol-2', numero_ali: 1002, codigo_externo: 'EXT-2',
          estado: 'enviado', family: 'under_review', updated_at: '2026-05-19',
          nombre_cliente: 'Cliente B'
        }
      ],
      summary: { editable: 2, under_review: 3 }
    }));

    await TestBed.configureTestingModule({
      declarations: [DashboardIngresoPage],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: SolicitudIngresoService, useValue: serviceStub }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardIngresoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // REQ-10: Ingreso dashboard must show family counters from /summary
  it('llama a summary() al inicializar y muestra counters por familia', () => {
    expect(serviceStub.obtenerResumenDashboard).toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;

    const editableEl = compiled.querySelector('[data-family="editable"]');
    const resubmittableEl = compiled.querySelector('[data-family="resubmittable"]');
    const reviewEl = compiled.querySelector('[data-family="under_review"]');

    expect(editableEl?.textContent).toContain('2');
    expect(resubmittableEl?.textContent).toContain('1');
    expect(reviewEl?.textContent).toContain('3');
  });

  // REQ-11: Ingreso dashboard must show items from /queue
  it('llama a queue() al inicializar y muestra items de la bandeja', () => {
    expect(serviceStub.obtenerBandejaDashboard).toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;

    const items = compiled.querySelectorAll('[data-queue-item]');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Cliente A');
    expect(items[1].textContent).toContain('Cliente B');
  });

  // REQ-12: Empty state when a family has zero items
  it('muestra estado vacío cuando una familia no tiene solicitudes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const postValidationSection = compiled.querySelector('[data-family="post_validation"]');

    // post_validation is 0 in summary — expect empty state
    expect(postValidationSection?.textContent).toContain('0');
  });

  // REQ-13: Empty state when no items in queue
  it('muestra bandeja vacía cuando queue no devuelve items', () => {
    serviceStub.obtenerBandejaDashboard.and.returnValue(of({ items: [] }));
    component.cargarBandeja(); // recargar
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('[data-queue-item]');
    expect(items.length).toBe(0);
    const emptyEl = compiled.querySelector('[data-queue-empty]');
    expect(emptyEl).not.toBeNull();
  });

  // Navegación existente se mantiene
  it('navega a /solicitud-ingreso y /busqueda-solicitud-ingreso', () => {
    component.solicitudIngreso();
    component.busquedaSolicitud();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/solicitud-ingreso']);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/busqueda-solicitud-ingreso']);
  });
});
