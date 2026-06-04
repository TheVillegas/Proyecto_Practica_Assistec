import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ValidacionSolicitudesPage } from './validacion-solicitudes.page';

const routes: Routes = [
  {
    path: '',
    component: ValidacionSolicitudesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ValidacionSolicitudesPageRoutingModule {}
