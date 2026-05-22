import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService, SessionUser } from './auth-service';

describe('AuthService', () => {
  let service: AuthService;

  const buildUser = (overrides: Partial<SessionUser> = {}): SessionUser => ({
    rut: '1-9',
    roles: [0],
    primaryRole: 0,
    rol: 0,
    ...overrides
  });

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', () => {
    service = TestBed.inject(AuthService);
    expect(service).toBeTruthy();
  });

  it('normaliza una sesión multi-rol y resuelve el landing por primaryRole', () => {
    sessionStorage.setItem('usuario', JSON.stringify({
      rut: '1-9',
      nombre: 'Ana Lab',
      roles: [1, 0],
      primaryRole: 1,
      rol: 1
    }));

    service = TestBed.inject(AuthService);

    expect(service.getUsuario()?.roles).toEqual([1, 0]);
    expect(service.hasRole(1)).toBeTrue();
    expect(service.hasRole(0)).toBeTrue();
    expect(service.getLandingRoute()).toBe('/dashboard-coordinadora');
  });

  it('mantiene compatibilidad con sesiones legacy de un solo rol', () => {
    sessionStorage.setItem('usuario', JSON.stringify({
      rut: '9-9',
      nombre: 'Admin QA',
      rol: 4
    }));

    service = TestBed.inject(AuthService);

    expect(service.getUsuario()?.roles).toEqual([4]);
    expect(service.getUsuario()?.primaryRole).toBe(4);
    expect(service.hasRole(4)).toBeTrue();
    expect(service.getLandingRoute()).toBe('/dashboard-admin');
  });

  it('canAccess retorna true cuando hay intersección entre allowedRoles y roles del usuario', () => {
    sessionStorage.setItem('usuario', JSON.stringify({
      rut: '1-9',
      roles: [1, 0],
      primaryRole: 1
    }));

    service = TestBed.inject(AuthService);
    const user = service.getUsuario();

    expect(service.canAccess([1, 4], user)).toBeTrue();
    expect(service.canAccess([0, 3], user)).toBeTrue();
  });

  it('canAccess retorna false cuando no hay intersección de roles', () => {
    sessionStorage.setItem('usuario', JSON.stringify({
      rut: '2-2',
      roles: [2],
      primaryRole: 2
    }));

    service = TestBed.inject(AuthService);
    const user = service.getUsuario();

    expect(service.canAccess([3, 4], user)).toBeFalse();
    expect(service.canAccess([1], user)).toBeFalse();
  });

  it('getLandingRoute resuelve /dashboard-admin para administrator (primaryRole=4)', () => {
    sessionStorage.setItem('usuario', JSON.stringify({ rut: '4-4', roles: [4], primaryRole: 4 }));
    service = TestBed.inject(AuthService);
    expect(service.getLandingRoute()).toBe('/dashboard-admin');
  });

  it('getLandingRoute resuelve /dashboard-jefe para jefe_area (primaryRole=2)', () => {
    sessionStorage.setItem('usuario', JSON.stringify({ rut: '2-2', roles: [2], primaryRole: 2 }));
    service = TestBed.inject(AuthService);
    expect(service.getLandingRoute()).toBe('/dashboard-jefe');
  });

  it('getLandingRoute resuelve /dashboard-ingreso para ingreso (primaryRole=3)', () => {
    sessionStorage.setItem('usuario', JSON.stringify({ rut: '3-3', roles: [3], primaryRole: 3 }));
    service = TestBed.inject(AuthService);
    expect(service.getLandingRoute()).toBe('/dashboard-ingreso');
  });

  it('getLandingRoute resuelve /dashboard-analista para analista (primaryRole=0)', () => {
    sessionStorage.setItem('usuario', JSON.stringify({ rut: '0-0', roles: [0], primaryRole: 0 }));
    service = TestBed.inject(AuthService);
    expect(service.getLandingRoute()).toBe('/dashboard-analista');
  });

  it('hasRole retorna false para un rol que el usuario no tiene', () => {
    sessionStorage.setItem('usuario', JSON.stringify({ rut: '3-3', roles: [3], primaryRole: 3 }));
    service = TestBed.inject(AuthService);
    expect(service.hasRole(4)).toBeFalse();
    expect(service.hasRole(2)).toBeFalse();
  });

  it('getUsuario retorna null cuando no hay sesión en storage', () => {
    service = TestBed.inject(AuthService);
    expect(service.getUsuario()).toBeNull();
  });
});
