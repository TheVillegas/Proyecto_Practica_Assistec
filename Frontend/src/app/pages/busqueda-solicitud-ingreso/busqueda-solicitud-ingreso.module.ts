import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BusquedaSolicitudIngresoPageRoutingModule } from './busqueda-solicitud-ingreso-routing.module';
import { BusquedaSolicitudIngresoPage } from './busqueda-solicitud-ingreso.page';
import { ComponentsModule } from '../../components/components-module/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComponentsModule,
    BusquedaSolicitudIngresoPageRoutingModule
  ],
  declarations: [BusquedaSolicitudIngresoPage]
})
export class BusquedaSolicitudIngresoPageModule {}
