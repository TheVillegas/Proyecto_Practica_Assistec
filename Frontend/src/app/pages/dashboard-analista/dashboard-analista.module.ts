import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardAnalistaRoutingModule } from './dashboard-analista-routing.module';
import { DashboardAnalistaPage } from './dashboard-analista.page';
import { ComponentsModule } from 'src/app/components/components-module/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardAnalistaRoutingModule,
    ComponentsModule
  ],
  declarations: [DashboardAnalistaPage]
})
export class DashboardAnalistaPageModule {}
