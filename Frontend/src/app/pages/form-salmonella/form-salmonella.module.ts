import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FormSalmonellaPageRoutingModule } from './form-salmonella-routing.module';

import { FormSalmonellaPage } from './form-salmonella.page';
import { ComponentsModule } from 'src/app/components/components-module/components.module';

import { SalInicioHomogeneizacionComponent } from './components/sal-inicio-homogeneizacion.component';
import { SalSiembraInsumosComponent } from './components/sal-siembra-insumos.component';
import { SalControlesCalidadComponent } from './components/sal-controles-calidad.component';
import { SalEnriquecimientoSelectivoComponent } from './components/sal-enriquecimiento-selectivo.component';
import { SalResultadosEnriquecimientoComponent } from './components/sal-resultados-enriquecimiento.component';
import { SalAislamientoAgaresComponent } from './components/sal-aislamiento-agares.component';
import { SalResultadosAislamientoComponent } from './components/sal-resultados-aislamiento.component';
import { SalResultadoFinalComponent } from './components/sal-resultado-final.component';

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
    SalInicioHomogeneizacionComponent,
    SalSiembraInsumosComponent,
    SalControlesCalidadComponent,
    SalEnriquecimientoSelectivoComponent,
    SalResultadosEnriquecimientoComponent,
    SalAislamientoAgaresComponent,
    SalResultadosAislamientoComponent,
    SalResultadoFinalComponent
  ]
})
export class FormSalmonellaPageModule { }
