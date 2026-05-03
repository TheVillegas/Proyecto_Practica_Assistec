import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SolicitudIngresoPage } from './solicitud-ingreso.page';

const routes: Routes = [
  {
    path: '',
    component: SolicitudIngresoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SolicitudIngresoPageRoutingModule { }
