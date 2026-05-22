import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../services/auth-service';
import { BehaviorSubject } from 'rxjs';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let currentUserSubject: BehaviorSubject<any>;

  const createUser = (overrides: Record<string, unknown> = {}) => ({
    rut: '1-9',
    nombre: 'Ana Lab',
    roles: [0],
    primaryRole: 0,
    activeRole: 0,
    rol: 0,
    ...overrides
  });

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<any>(createUser({
      rut: '1-9',
      nombre: 'Ana Lab',
      roles: [1, 0],
      primaryRole: 1,
      activeRole: 1,
      rol: 1
    }));

    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser$: currentUserSubject.asObservable(),
            logout: jasmine.createSpy('logout'),
            canAccess: (allowedRoles: number[], user: any) => allowedRoles.some((role) => user?.roles?.includes(role)),
            hasRole: (role: number, user: any) => user?.roles?.includes(role) ?? false
          }
        }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra navegación combinada para usuarios multi-rol sin exponer solicitud ingreso', () => {
    fixture.detectChanges();

    const navLabels = Array.from(fixture.nativeElement.querySelectorAll('[data-label]') as NodeListOf<Element>).map((item) => item.getAttribute('data-label'));

    expect(component.userRole).toContain('Coordinadora');
    expect(navLabels).toContain('Búsqueda ALI');
    expect(navLabels).toContain('Búsqueda Solicitud');
    expect(navLabels).not.toContain('Solicitud Ingreso');
  });

  it('expone toda la navegación operativa cuando el usuario es administrator', () => {
    currentUserSubject.next(createUser({
      rut: '4-4',
      nombre: 'Admin QA',
      roles: [4],
      primaryRole: 4,
      activeRole: 4,
      rol: 4
    }));

    fixture.detectChanges();

    const navLabels = Array.from(fixture.nativeElement.querySelectorAll('[data-label]') as NodeListOf<Element>).map((item) => item.getAttribute('data-label'));

    expect(component.userRole).toContain('Administrator');
    expect(navLabels).toContain('Búsqueda ALI');
    expect(navLabels).toContain('Búsqueda Solicitud');
    expect(navLabels).toContain('Solicitud Ingreso');
  });

  it('jefe de área no ve el link de Solicitud Ingreso', () => {
    currentUserSubject.next(createUser({
      rut: '2-2',
      nombre: 'Jefe QA',
      roles: [2],
      primaryRole: 2,
      activeRole: 2,
      rol: 2
    }));

    fixture.detectChanges();

    const navLabels = Array.from(fixture.nativeElement.querySelectorAll('[data-label]') as NodeListOf<Element>).map((item) => item.getAttribute('data-label'));

    expect(component.userRole).toContain('Jefe de Área');
    expect(navLabels).toContain('Búsqueda ALI');
    expect(navLabels).toContain('Búsqueda Solicitud');
    expect(navLabels).not.toContain('Solicitud Ingreso');
  });

  it('analista ve solo Búsqueda ALI, no Solicitud Ingreso ni Búsqueda Solicitud', () => {
    currentUserSubject.next(createUser({
      rut: '0-0',
      nombre: 'Analista QA',
      roles: [0],
      primaryRole: 0,
      activeRole: 0,
      rol: 0
    }));

    fixture.detectChanges();

    const navLabels = Array.from(fixture.nativeElement.querySelectorAll('[data-label]') as NodeListOf<Element>).map((item) => item.getAttribute('data-label'));

    expect(component.userRole).toContain('Analista');
    expect(navLabels).toContain('Búsqueda ALI');
    expect(navLabels).not.toContain('Búsqueda Solicitud');
    expect(navLabels).not.toContain('Solicitud Ingreso');
  });

  it('muestra etiqueta multi-rol con Administrator como primario y roles secundarios', () => {
    currentUserSubject.next(createUser({
      rut: '4-1',
      nombre: 'Admin Coord',
      roles: [4, 1],
      primaryRole: 4,
      activeRole: 4,
      rol: 4
    }));

    fixture.detectChanges();

    expect(component.userRole).toBe('Administrator · Coordinadora de Área');
  });

  it('administrator con rol único muestra solo Administrator', () => {
    currentUserSubject.next(createUser({
      rut: '4-4',
      nombre: 'Admin Solo',
      roles: [4],
      primaryRole: 4,
      activeRole: 4,
      rol: 4
    }));

    fixture.detectChanges();

    expect(component.userRole).toBe('Administrator');
  });
});
