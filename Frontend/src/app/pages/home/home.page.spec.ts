import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HomePage } from './home.page';
import { AuthService } from 'src/app/services/auth-service';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const setupComponent = () => {
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate'], {
      config: [
        { path: 'dashboard-ingreso', data: { allowedRoles: [3, 4] } },
        { path: 'dashboard-jefe', data: { allowedRoles: [2, 4] } },
        { path: 'dashboard-coordinadora', data: { allowedRoles: [1, 4] } },
        { path: 'dashboard-analista', data: { allowedRoles: [0, 4] } },
        { path: 'dashboard-admin', data: { allowedRoles: [4] } }
      ]
    });
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getUsuario', 'canAccess', 'getLandingRoute']);

    await TestBed.configureTestingModule({
      declarations: [HomePage],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create', () => {
    authServiceSpy.getUsuario.and.returnValue({ rut: '1-9', roles: [0], primaryRole: 0, activeRole: 0 } as any);
    authServiceSpy.getLandingRoute.and.returnValue('/dashboard-analista');
    authServiceSpy.canAccess.and.returnValue(true);

    setupComponent();

    expect(component).toBeTruthy();
  });

  it('redirige según el primaryRole de una sesión multi-rol', () => {
    authServiceSpy.getUsuario.and.returnValue({ rut: '1-9', roles: [1, 0], primaryRole: 1, activeRole: 1 } as any);
    authServiceSpy.getLandingRoute.and.returnValue('/dashboard-coordinadora');
    authServiceSpy.canAccess.and.returnValue(true);

    setupComponent();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard-coordinadora'], { replaceUrl: true });
  });

  it('redirige a login cuando no hay usuario en sesión', () => {
    authServiceSpy.getUsuario.and.returnValue(null);

    setupComponent();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });

  it('administrator con primaryRole=4 redirige a dashboard-admin', () => {
    authServiceSpy.getUsuario.and.returnValue({ rut: '4-4', roles: [4], primaryRole: 4 } as any);
    authServiceSpy.getLandingRoute.and.returnValue('/dashboard-admin');
    authServiceSpy.canAccess.and.returnValue(true);

    setupComponent();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard-admin'], { replaceUrl: true });
  });

  it('jefe_area con primaryRole=2 redirige a dashboard-jefe', () => {
    authServiceSpy.getUsuario.and.returnValue({ rut: '2-2', roles: [2], primaryRole: 2 } as any);
    authServiceSpy.getLandingRoute.and.returnValue('/dashboard-jefe');
    authServiceSpy.canAccess.and.returnValue(true);

    setupComponent();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard-jefe'], { replaceUrl: true });
  });

  it('ingreso con primaryRole=3 redirige a dashboard-ingreso', () => {
    authServiceSpy.getUsuario.and.returnValue({ rut: '3-3', roles: [3], primaryRole: 3 } as any);
    authServiceSpy.getLandingRoute.and.returnValue('/dashboard-ingreso');
    authServiceSpy.canAccess.and.returnValue(true);

    setupComponent();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard-ingreso'], { replaceUrl: true });
  });

  it('analista con primaryRole=0 redirige a dashboard-analista', () => {
    authServiceSpy.getUsuario.and.returnValue({ rut: '0-0', roles: [0], primaryRole: 0 } as any);
    authServiceSpy.getLandingRoute.and.returnValue('/dashboard-analista');
    authServiceSpy.canAccess.and.returnValue(true);

    setupComponent();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard-analista'], { replaceUrl: true });
  });

  it('admin multi-rol con primaryRole=4 redirige a dashboard-admin (precedencia sobre roles secundarios)', () => {
    authServiceSpy.getUsuario.and.returnValue({ rut: '4-1', roles: [4, 1], primaryRole: 4 } as any);
    authServiceSpy.getLandingRoute.and.returnValue('/dashboard-admin');
    authServiceSpy.canAccess.and.returnValue(true);

    setupComponent();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard-admin'], { replaceUrl: true });
  });
});
