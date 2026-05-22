import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardCoordinadoraRoutingModule } from './dashboard-coordinadora-routing.module';
import { DashboardCoordinadoraPage } from './dashboard-coordinadora.page';
import { ComponentsModule } from 'src/app/components/components-module/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardCoordinadoraRoutingModule,
    ComponentsModule
  ],
  declarations: [DashboardCoordinadoraPage]
})
export class DashboardCoordinadoraPageModule {}
