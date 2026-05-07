import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FormColiformesPage } from './form-coliformes.page';

const routes: Routes = [
  {
    path: '',
    component: FormColiformesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormColiformesPageRoutingModule { }
