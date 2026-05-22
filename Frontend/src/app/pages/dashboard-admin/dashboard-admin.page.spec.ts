import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { SolicitudIngresoService } from 'src/app/services/solicitud-ingreso.service';
import { DashboardAdminPage } from './dashboard-admin.page';

describe('DashboardAdminPage — admin ve todas las familias', () => {
  let component: DashboardAdminPage;
  let fixture: ComponentFixture<DashboardAdminPage>;
  let routerSpy: jasmine.SpyObj<Router>;
  let serviceStub: jasmine.SpyObj<SolicitudIngresoService>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    serviceStub = jasmine.createSpyObj<SolicitudIngresoService>('SolicitudIngresoService', [
      'obtenerResumenDashboard',
      'obtenerBandejaDashboard'
    ]);

    serviceStub.obtenerResumenDashboard.and.returnValue(of({
      summary: { editable: 3, resubmittable: 2, under_review: 6, post_validation: 4 }
    }));
    serviceStub.obtenerBandejaDashboard.and.returnValue(of({
      items: [
        {
          id_solicitud: 'sol-admin-1', numero_ali: 5001, codigo_externo: 'EXT-ADM-1',
          estado: 'enviado', family: 'under_review', updated_at: '2026-05-21',
          nombre_cliente: 'Cliente Admin'
        }
      ],
      summary: { under_review: 6 }
    }));

    await TestBed.configureTestingModule({
      declarations: [DashboardAdminPage],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: SolicitudIngresoService, useValue: serviceStub }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardAdminPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea la página del dashboard administrador', () => {
    expect(component).toBeTruthy();
  });

  // REQ-26: Admin debe ver todas las familias en summary
  it('llama a summary() y muestra counters de todas las familias', () => {
    expect(serviceStub.obtenerResumenDashboard).toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;

    const editableEl = compiled.querySelector('[data-family="editable"]');
    const resubmittableEl = compiled.querySelector('[data-family="resubmittable"]');
    const reviewEl = compiled.querySelector('[data-family="under_review"]');
    const postValEl = compiled.querySelector('[data-family="post_validation"]');

    expect(editableEl?.textContent).toContain('3');
    expect(resubmittableEl?.textContent).toContain('2');
    expect(reviewEl?.textContent).toContain('6');
    expect(postValEl?.textContent).toContain('4');
  });

  // REQ-27: Admin puede ver items de la bandeja compartida
  it('muestra items de la cola de revisión desde queue()', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('[data-queue-item]');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Cliente Admin');
  });

  // REQ-28: Admin empty state cuando summary devuelve todo cero
  it('muestra estado vacío cuando no hay solicitudes en ninguna familia', () => {
    serviceStub.obtenerResumenDashboard.and.returnValue(of({
      summary: { editable: 0, resubmittable: 0, under_review: 0, post_validation: 0 }
    }));
    serviceStub.obtenerBandejaDashboard.and.returnValue(of({ items: [] }));
    fixture = TestBed.createComponent(DashboardAdminPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyEl = compiled.querySelector('[data-queue-empty]');
    expect(emptyEl).not.toBeNull();
  });

  it('navega a la cola de revisión compartida y a la búsqueda ALI', () => {
    component.irABandejaRevision();
    component.irABusquedaAli();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/busqueda-solicitud-ingreso']);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/busqueda-ali']);
  });

  it('navega al dashboard de ingreso para operar como ingreso cuando hace falta', () => {
    component.irADashboardIngreso();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard-ingreso']);
  });
});
