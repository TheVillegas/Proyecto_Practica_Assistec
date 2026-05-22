import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FormEnterobacteriasPage } from './form-enterobacterias.page';

const routes: Routes = [
  {
    path: '',
    component: FormEnterobacteriasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormEnterobacteriasPageRoutingModule { }
