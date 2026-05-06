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
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard-ingreso',
    loadChildren: () => import('./pages/dashboard-ingreso/dashboard-ingreso.module').then((m) => m.DashboardIngresoPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard-jefe',
    loadChildren: () => import('./pages/dashboard-jefe/dashboard-jefe.module').then((m) => m.DashboardJefePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard-coordinadora',
    loadChildren: () => import('./pages/dashboard-coordinadora/dashboard-coordinadora.module').then((m) => m.DashboardCoordinadoraPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard-analista',
    loadChildren: () => import('./pages/dashboard-analista/dashboard-analista.module').then((m) => m.DashboardAnalistaPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'solicitud-ingreso',
    loadChildren: () => import('./pages/solicitud-ingreso/solicitud-ingreso.module').then((m) => m.SolicitudIngresoPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'busqueda-solicitud-ingreso',
    loadChildren: () => import('./pages/busqueda-solicitud-ingreso/busqueda-solicitud-ingreso.module').then((m) => m.BusquedaSolicitudIngresoPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'busqueda-ali',
    loadChildren: () => import('./pages/busqueda-ali/busqueda-ali.module').then((m) => m.BusquedaALIPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'reporte-tpa/:codigoALI',
    loadChildren: () => import('./pages/reporte-tpa/reporte-tpa.module').then((m) => m.ReporteTPAPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'reporte-ram/:codigoALI',
    loadChildren: () => import('./pages/reporte-ram/reporte-ram.module').then((m) => m.ReporteRamPageModule),
    canActivate: [AuthGuard]
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
    loadChildren: () => import('./pages/configuracion-usuario/configuracion-usuario.module').then((m) => m.ConfiguracionUsuarioPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
