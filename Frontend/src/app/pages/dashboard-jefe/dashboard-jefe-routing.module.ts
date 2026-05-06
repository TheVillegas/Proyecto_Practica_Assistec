import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardJefePage } from './dashboard-jefe.page';

const routes: Routes = [
  {
    path: '',
    component: DashboardJefePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardJefeRoutingModule {}
