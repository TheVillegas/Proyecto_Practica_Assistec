import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardIngresoPage } from './dashboard-ingreso.page';

const routes: Routes = [
  {
    path: '',
    component: DashboardIngresoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardIngresoRoutingModule {}
