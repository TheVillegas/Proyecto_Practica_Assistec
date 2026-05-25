import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { SolicitudIngresoService } from 'src/app/services/solicitud-ingreso.service';
import { DashboardJefePage } from './dashboard-jefe.page';

describe('DashboardJefePage — cola compartida de revisión', () => {
  let component: DashboardJefePage;
  let fixture: ComponentFixture<DashboardJefePage>;
  let routerSpy: jasmine.SpyObj<Router>;
  let serviceStub: jasmine.SpyObj<SolicitudIngresoService>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    serviceStub = jasmine.createSpyObj<SolicitudIngresoService>('SolicitudIngresoService', [
      'obtenerResumenDashboard',
      'obtenerBandejaDashboard'
    ]);

    serviceStub.obtenerResumenDashboard.and.returnValue(of({
      summary: { editable: 0, resubmittable: 0, under_review: 4, post_validation: 1 }
    }));
    serviceStub.obtenerBandejaDashboard.and.returnValue(of({
      items: [
        {
          id_solicitud: 'sol-4', numero_ali: 3001, codigo_externo: 'EXT-4',
          estado: 'enviado', family: 'under_review', updated_at: '2026-05-21',
          nombre_cliente: 'Cliente Y'
        }
      ],
      summary: { under_review: 4 }
    }));

    await TestBed.configureTestingModule({
      declarations: [DashboardJefePage],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: SolicitudIngresoService, useValue: serviceStub }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardJefePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // REQ-17: Jefe dashboard comparte cola con coordinadora — mismos datos visibles
  it('muestra los mismos counters under_review y post_validation desde summary', () => {
    expect(serviceStub.obtenerResumenDashboard).toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;

    const reviewEl = compiled.querySelector('[data-family="under_review"]');
    const postValEl = compiled.querySelector('[data-family="post_validation"]');

    expect(reviewEl?.textContent).toContain('4');
    expect(postValEl?.textContent).toContain('1');
  });

  // REQ-18: No hay narrativa secuencial en UI
  it('no muestra etiquetas que impliquen secuencia coordinadora→jefa', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const fullText = compiled.textContent ?? '';

    expect(fullText).not.toMatch(/pendiente.*coordinador.*validaci[oó]n/i);
    expect(fullText).not.toMatch(/aprobado por.*coordinador/i);
    expect(fullText).not.toMatch(/revisi[oó]n previa/i);
  });

  // REQ-19: Dashboard jefe muestra items de la bandeja compartida
  it('muestra los items de la cola de revisión compartida', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('[data-queue-item]');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Cliente Y');
  });

  // REQ-20: Empty state cuando no hay revisiones
  it('muestra estado vacío con cero revisiones', () => {
    serviceStub.obtenerResumenDashboard.and.returnValue(of({
      summary: { editable: 0, resubmittable: 0, under_review: 0, post_validation: 0 }
    }));
    serviceStub.obtenerBandejaDashboard.and.returnValue(of({ items: [] }));
    fixture = TestBed.createComponent(DashboardJefePage);
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
      queryParams: { id: 'sol-4' }
    });
  });
});
