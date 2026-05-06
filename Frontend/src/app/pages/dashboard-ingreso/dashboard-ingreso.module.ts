import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardIngresoRoutingModule } from './dashboard-ingreso-routing.module';
import { DashboardIngresoPage } from './dashboard-ingreso.page';
import { ComponentsModule } from 'src/app/components/components-module/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardIngresoRoutingModule,
    ComponentsModule
  ],
  declarations: [DashboardIngresoPage]
})
export class DashboardIngresoPageModule {}
