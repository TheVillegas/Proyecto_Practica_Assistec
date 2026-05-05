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
    path: 'generar-ali-basico',
    redirectTo: 'solicitud-ingreso',
    pathMatch: 'full'
  },
  {
    path: 'solicitud-ingreso',
    loadChildren: () => import('./pages/solicitud-ingreso/solicitud-ingreso.module').then((m) => m.SolicitudIngresoPageModule),
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
