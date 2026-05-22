import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardJefeRoutingModule } from './dashboard-jefe-routing.module';
import { DashboardJefePage } from './dashboard-jefe.page';
import { ComponentsModule } from 'src/app/components/components-module/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardJefeRoutingModule,
    ComponentsModule
  ],
  declarations: [DashboardJefePage]
})
export class DashboardJefePageModule {}
