import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from '../../components/components-module/components.module';

import { ConfiguracionUsuarioPageRoutingModule } from './configuracion-usuario-routing.module';

import { ConfiguracionUsuarioPage } from './configuracion-usuario.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConfiguracionUsuarioPageRoutingModule,
    ComponentsModule
  ],
  declarations: [ConfiguracionUsuarioPage]
})
export class ConfiguracionUsuarioPageModule { }
