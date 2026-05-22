import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardAnalistaPage } from './dashboard-analista.page';

const routes: Routes = [
  {
    path: '',
    component: DashboardAnalistaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardAnalistaRoutingModule {}
