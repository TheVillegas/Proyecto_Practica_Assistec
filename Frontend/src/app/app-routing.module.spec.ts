import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';

describe('AppRoutingModule', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppRoutingModule]
    });

    router = TestBed.inject(Router);
  });

  it('declara allowedRoles para dashboards protegidos', () => {
    expect(router.config.find((route) => route.path === 'dashboard-admin')?.data?.['allowedRoles']).toEqual([4]);
    expect(router.config.find((route) => route.path === 'dashboard-jefe')?.data?.['allowedRoles']).toEqual([2, 4]);
    expect(router.config.find((route) => route.path === 'dashboard-coordinadora')?.data?.['allowedRoles']).toEqual([1, 4]);
    expect(router.config.find((route) => route.path === 'dashboard-analista')?.data?.['allowedRoles']).toEqual([0, 4]);
    expect(router.config.find((route) => route.path === 'dashboard-ingreso')?.data?.['allowedRoles']).toEqual([3, 4]);
  });
});
