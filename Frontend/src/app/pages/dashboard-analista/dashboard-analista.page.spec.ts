import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { SolicitudIngresoService } from 'src/app/services/solicitud-ingreso.service';
import { DashboardAnalistaPage } from './dashboard-analista.page';

describe('DashboardAnalistaPage — solo post-validation asignado', () => {
  let component: DashboardAnalistaPage;
  let fixture: ComponentFixture<DashboardAnalistaPage>;
  let routerSpy: jasmine.SpyObj<Router>;
  let serviceStub: jasmine.SpyObj<SolicitudIngresoService>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    serviceStub = jasmine.createSpyObj<SolicitudIngresoService>('SolicitudIngresoService', [
      'obtenerResumenDashboard',
      'obtenerBandejaDashboard'
    ]);

    serviceStub.obtenerResumenDashboard.and.returnValue(of({
      summary: { editable: 0, resubmittable: 0, under_review: 0, post_validation: 3 }
    }));
    serviceStub.obtenerBandejaDashboard.and.returnValue(of({
      items: [
        {
          id_solicitud: 'sol-5', numero_ali: 4001, codigo_externo: 'EXT-5',
          estado: 'validado', family: 'post_validation', updated_at: '2026-05-21',
          nombre_cliente: 'Cliente Analista'
        }
      ],
      summary: { post_validation: 3 }
    }));

    await TestBed.configureTestingModule({
      declarations: [DashboardAnalistaPage],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: SolicitudIngresoService, useValue: serviceStub }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardAnalistaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // REQ-21: Analista solo ve post_validation asignado
  it('llama a summary() y queue() con filtro assignedToMe correcto', () => {
    expect(serviceStub.obtenerResumenDashboard).toHaveBeenCalledWith(
      jasmine.objectContaining({ family: 'post_validation', assignedToMe: true })
    );
    expect(serviceStub.obtenerBandejaDashboard).toHaveBeenCalledWith(
      jasmine.objectContaining({ family: 'post_validation', assignedToMe: true })
    );
  });

  // REQ-22: Muestra el counter post_validation
  it('muestra el counter de trabajos asignados en post_validation', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const postValEl = compiled.querySelector('[data-family="post_validation"]');
    expect(postValEl?.textContent).toContain('3');
  });

  // REQ-23: No muestra familias que no le corresponden
  it('no muestra counters de editable, resubmittable ni under_review', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-family="editable"]')).toBeNull();
    expect(compiled.querySelector('[data-family="resubmittable"]')).toBeNull();
    expect(compiled.querySelector('[data-family="under_review"]')).toBeNull();
  });

  // REQ-24: Muestra items de la bandeja asignada
  it('muestra los items de post_validation asignados en la bandeja', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('[data-queue-item]');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Cliente Analista');
  });

  // REQ-25: Empty state cuando no tiene trabajos asignados
  it('muestra estado vacío cuando no hay trabajos asignados', () => {
    serviceStub.obtenerResumenDashboard.and.returnValue(of({
      summary: { editable: 0, resubmittable: 0, under_review: 0, post_validation: 0 }
    }));
    serviceStub.obtenerBandejaDashboard.and.returnValue(of({ items: [] }));
    fixture = TestBed.createComponent(DashboardAnalistaPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyEl = compiled.querySelector('[data-queue-empty]');
    expect(emptyEl).not.toBeNull();
  });

  it('conserva navegación a búsqueda ALI', () => {
    component.busquedaALI();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/busqueda-ali']);
  });
});
