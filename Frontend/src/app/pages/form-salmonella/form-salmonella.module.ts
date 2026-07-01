import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FormSalmonellaPageRoutingModule } from './form-salmonella-routing.module';

import { FormSalmonellaPage } from './form-salmonella.page';
import { ComponentsModule } from 'src/app/components/components-module/components.module';

import { SalEtapa1InicioComponent } from './components/sal-etapa1-inicio.component';
import { SalEtapa2ControlesComponent } from './components/sal-etapa2-controles.component';
import { SalEtapa3TraspasoComponent } from './components/sal-etapa3-traspaso.component';
import { SalEtapa4AislamientoComponent } from './components/sal-etapa4-aislamiento.component';
import { SalEtapa5ResultadoComponent } from './components/sal-etapa5-resultado.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    FormSalmonellaPageRoutingModule,
    ComponentsModule
  ],
  declarations: [
    FormSalmonellaPage,
    SalEtapa1InicioComponent,
    SalEtapa2ControlesComponent,
    SalEtapa3TraspasoComponent,
    SalEtapa4AislamientoComponent,
    SalEtapa5ResultadoComponent
  ]
})
export class FormSalmonellaPageModule { }
