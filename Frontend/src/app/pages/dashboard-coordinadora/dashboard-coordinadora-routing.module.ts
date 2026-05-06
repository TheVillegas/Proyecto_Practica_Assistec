import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardCoordinadoraPage } from './dashboard-coordinadora.page';

const routes: Routes = [
  {
    path: '',
    component: DashboardCoordinadoraPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardCoordinadoraRoutingModule {}
