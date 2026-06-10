import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then((m) => m.HomePageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [0, 1, 2, 3, 4] }
  },
  {
    path: 'dashboard-admin',
    loadChildren: () => import('./pages/dashboard-admin/dashboard-admin.module').then((m) => m.DashboardAdminPageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [4] }
  },
  {
    path: 'dashboard-ingreso',
    loadChildren: () => import('./pages/dashboard-ingreso/dashboard-ingreso.module').then((m) => m.DashboardIngresoPageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [3, 4] }
  },
  {
    path: 'dashboard-jefe',
    loadChildren: () => import('./pages/dashboard-jefe/dashboard-jefe.module').then((m) => m.DashboardJefePageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [2, 4] }
  },
  {
    path: 'dashboard-coordinadora',
    loadChildren: () => import('./pages/dashboard-coordinadora/dashboard-coordinadora.module').then((m) => m.DashboardCoordinadoraPageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [1, 4] }
  },
  {
    path: 'dashboard-analista',
    loadChildren: () => import('./pages/dashboard-analista/dashboard-analista.module').then((m) => m.DashboardAnalistaPageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [0, 4] }
  },
  {
    path: 'solicitud-ingreso',
    loadChildren: () => import('./pages/solicitud-ingreso/solicitud-ingreso.module').then((m) => m.SolicitudIngresoPageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [1, 2, 3, 4] }
  },
  {
    path: 'busqueda-solicitud-ingreso',
    loadChildren: () => import('./pages/busqueda-solicitud-ingreso/busqueda-solicitud-ingreso.module').then((m) => m.BusquedaSolicitudIngresoPageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [1, 2, 3, 4] }
  },
  {
    path: 'busqueda-ali',
    loadChildren: () => import('./pages/busqueda-ali/busqueda-ali.module').then((m) => m.BusquedaALIPageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [0, 1, 2, 4] }
  },
  {
    path: 'reporte-tpa/:codigoALI',
    loadChildren: () => import('./pages/reporte-tpa/reporte-tpa.module').then((m) => m.ReporteTPAPageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [1, 2, 4] }
  },
  {
    path: 'reporte-ram/:codigoALI',
    loadChildren: () => import('./pages/reporte-ram/reporte-ram.module').then((m) => m.ReporteRamPageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [1, 2, 4] }
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then((m) => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then((m) => m.RegisterPageModule)
  },
  {
    path: 'configuracion-usuario',
    loadChildren: () => import('./pages/configuracion-usuario/configuracion-usuario.module').then((m) => m.ConfiguracionUsuarioPageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [0, 1, 2, 3, 4] }
  },
  {
    path: 'form-coliformes',
    loadChildren: () => import('./pages/form-coliformes/form-coliformes.module').then((m) => m.FormColiformesPageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [0, 4] }
  },
  {
    path: 'form-s-aureus',
    loadChildren: () => import('./pages/form-s-aureus/form-s-aureus.module').then((m) => m.FormSAureusPageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [0, 4] }
  },
  {
    path: 'form-enterobacterias',
    loadChildren: () => import('./pages/form-enterobacterias/form-enterobacterias.module').then((m) => m.FormEnterobacteriasPageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [0, 4] }
  },
  {
    path: 'form-salmonella',
    loadChildren: () => import('./pages/form-salmonella/form-salmonella.module').then((m) => m.FormSalmonellaPageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [0, 4] }
  },
  {
    path: 'validacion-solicitudes',
    loadChildren: () => import('./pages/validacion-solicitudes/validacion-solicitudes.module').then((m) => m.ValidacionSolicitudesPageModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: [1, 2, 4] }
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
