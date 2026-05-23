import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FormSalmonellaPageRoutingModule } from './form-salmonella-routing.module';

import { FormSalmonellaPage } from './form-salmonella.page';
import { ComponentsModule } from 'src/app/components/components-module/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    FormSalmonellaPageRoutingModule,
    ComponentsModule
  ],
  declarations: [FormSalmonellaPage]
})
export class FormSalmonellaPageModule { }
