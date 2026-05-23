import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FormSAureusPage } from './form-s-aureus.page';

const routes: Routes = [
  {
    path: '',
    component: FormSAureusPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormSAureusPageRoutingModule { }
