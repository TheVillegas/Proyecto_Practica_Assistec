import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService, SessionUser } from '../services/auth-service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const analistaUser: SessionUser = {
    rut: '1-9',
    roles: [0],
    primaryRole: 0,
    activeRole: 0
  };

  const adminMultiRoleUser: SessionUser = {
    rut: '4-1',
    roles: [4, 1],
    primaryRole: 4,
    activeRole: 4
  };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getToken', 'getUsuario', 'canAccess', 'getLandingRoute']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['createUrlTree'], {
      config: [
        { path: 'dashboard-ingreso', data: { allowedRoles: [3, 4] } },
        { path: 'dashboard-jefe', data: { allowedRoles: [2, 4] } },
        { path: 'dashboard-coordinadora', data: { allowedRoles: [1, 4] } },
        { path: 'dashboard-analista', data: { allowedRoles: [0, 4] } },
        { path: 'dashboard-admin', data: { allowedRoles: [4] } },
        { path: 'solicitud-ingreso', data: { allowedRoles: [1, 2, 3, 4] } }
      ]
    });

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('redirige a login cuando no hay token', () => {
    const loginTree = new UrlTree();
    authServiceSpy.getToken.and.returnValue(null);
    routerSpy.createUrlTree.and.returnValue(loginTree);

    const result = (guard as any).canActivate({ data: {} });

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result as any).toBe(loginTree);
  });

  it('bloquea una ruta sin roles permitidos y redirige al dashboard autorizado', () => {
    const landingTree = new UrlTree();
    authServiceSpy.getToken.and.returnValue('token-valido');
    authServiceSpy.getUsuario.and.returnValue(analistaUser);
    authServiceSpy.getLandingRoute.and.returnValue('/dashboard-analista');
    authServiceSpy.canAccess.and.callFake((allowedRoles: number[]) => allowedRoles.includes(0));
    routerSpy.createUrlTree.and.returnValue(landingTree);

    const result = (guard as any).canActivate({ data: { allowedRoles: [2, 4] } });

    expect(authServiceSpy.canAccess).toHaveBeenCalledWith([2, 4], analistaUser);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/dashboard-analista']);
    expect(result as any).toBe(landingTree);
  });

  it('permite la ruta cuando hay intersección de roles', () => {
    authServiceSpy.getToken.and.returnValue('token-valido');
    authServiceSpy.getUsuario.and.returnValue({ ...analistaUser, roles: [1, 0], primaryRole: 1, activeRole: 1 });
    authServiceSpy.canAccess.and.returnValue(true);

    const result = (guard as any).canActivate({ data: { allowedRoles: [1, 4] } });

    expect(result).toBeTrue();
  });

  it('admin multi-rol bloqueado de dashboard-jefe redirige a dashboard-admin por primaryRole', () => {
    const adminLandingTree = new UrlTree();
    authServiceSpy.getToken.and.returnValue('token-valido');
    authServiceSpy.getUsuario.and.returnValue(adminMultiRoleUser);
    authServiceSpy.getLandingRoute.and.returnValue('/dashboard-admin');
    authServiceSpy.canAccess.and.returnValue(false); // admin no tiene role 2
    routerSpy.createUrlTree.and.returnValue(adminLandingTree);

    const result = (guard as any).canActivate({ data: { allowedRoles: [2] } });

    expect(authServiceSpy.canAccess).toHaveBeenCalledWith([2], adminMultiRoleUser);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/dashboard-admin']);
    expect(result as any).toBe(adminLandingTree);
  });

  it('permite la ruta cuando no tiene data.allowedRoles definido', () => {
    authServiceSpy.getToken.and.returnValue('token-valido');
    authServiceSpy.getUsuario.and.returnValue(analistaUser);

    const result = (guard as any).canActivate({ data: {} });

    expect(result).toBeTrue();
  });

  it('permite a coordinadora acceder a solicitud-ingreso para revisar una solicitud existente', () => {
    const coordinadora = { ...analistaUser, roles: [1], primaryRole: 1, activeRole: 1 };
    authServiceSpy.getToken.and.returnValue('token-valido');
    authServiceSpy.getUsuario.and.returnValue(coordinadora);
    authServiceSpy.canAccess.and.returnValue(true);

    const result = (guard as any).canActivate({ data: { allowedRoles: [1, 2, 3, 4] } });

    expect(result).toBeTrue();
  });
});
