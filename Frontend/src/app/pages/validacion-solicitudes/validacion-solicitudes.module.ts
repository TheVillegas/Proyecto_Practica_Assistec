import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ValidacionSolicitudesPageRoutingModule } from './validacion-solicitudes-routing.module';
import { ValidacionSolicitudesPage } from './validacion-solicitudes.page';
import { ComponentsModule } from 'src/app/components/components-module/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ValidacionSolicitudesPageRoutingModule,
    ComponentsModule,
  ],
  declarations: [ValidacionSolicitudesPage]
})
export class ValidacionSolicitudesPageModule {}
