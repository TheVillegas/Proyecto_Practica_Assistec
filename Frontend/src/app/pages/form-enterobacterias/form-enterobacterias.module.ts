import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FormEnterobacteriasPageRoutingModule } from './form-enterobacterias-routing.module';
import { FormEnterobacteriasPage } from './form-enterobacterias.page';
import { ComponentsModule } from 'src/app/components/components-module/components.module';
import { EntPesadoComponent } from './components/ent-pesado.component';
import { EntHomogeneizacionComponent } from './components/ent-homogeneizacion.component';
import { EntSembradoComponent } from './components/ent-sembrado.component';
import { EntIncubacionPrepComponent } from './components/ent-incubacion-prep.component';
import { EntAnalisisLecturaComponent } from './components/ent-analisis-lectura.component';
import { EntIncubacionConfComponent } from './components/ent-incubacion-conf.component';
import { EntLecturaOxidasaComponent } from './components/ent-lectura-oxidasa.component';
import { EntResultadosComponent } from './components/ent-resultados.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    FormEnterobacteriasPageRoutingModule,
    ComponentsModule,
  ],
  declarations: [
    FormEnterobacteriasPage,
    EntPesadoComponent,
    EntHomogeneizacionComponent,
    EntSembradoComponent,
    EntIncubacionPrepComponent,
    EntAnalisisLecturaComponent,
    EntIncubacionConfComponent,
    EntLecturaOxidasaComponent,
    EntResultadosComponent,
  ]
})
export class FormEnterobacteriasPageModule { }
