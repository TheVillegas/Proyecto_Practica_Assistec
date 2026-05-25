import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FormEnterobacteriasPageRoutingModule } from './form-enterobacterias-routing.module';
import { FormEnterobacteriasPage } from './form-enterobacterias.page';
import { ComponentsModule } from 'src/app/components/components-module/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    FormEnterobacteriasPageRoutingModule,
    ComponentsModule,
  ],
  declarations: [FormEnterobacteriasPage]
})
export class FormEnterobacteriasPageModule { }
