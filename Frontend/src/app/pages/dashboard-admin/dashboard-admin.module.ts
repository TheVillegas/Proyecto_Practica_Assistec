import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components-module/components.module';
import { DashboardAdminRoutingModule } from './dashboard-admin-routing.module';
import { DashboardAdminPage } from './dashboard-admin.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardAdminRoutingModule,
    ComponentsModule
  ],
  declarations: [DashboardAdminPage]
})
export class DashboardAdminPageModule {}
