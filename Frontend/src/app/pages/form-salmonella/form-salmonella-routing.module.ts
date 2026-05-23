import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormSalmonellaPage } from './form-salmonella.page';

const routes: Routes = [
  {
    path: '',
    component: FormSalmonellaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormSalmonellaPageRoutingModule {}
