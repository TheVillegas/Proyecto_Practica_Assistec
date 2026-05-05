import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BusquedaSolicitudIngresoPage } from './busqueda-solicitud-ingreso.page';

const routes: Routes = [
  {
    path: '',
    component: BusquedaSolicitudIngresoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BusquedaSolicitudIngresoPageRoutingModule {}
