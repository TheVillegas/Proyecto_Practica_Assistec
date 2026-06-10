import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FormSAureusPageRoutingModule } from './form-s-aureus-routing.module';
import { FormSAureusPage } from './form-s-aureus.page';
import { ComponentsModule } from 'src/app/components/components-module/components.module';
import { Etapa5CalculoComponent } from '../../features/saureus/components/containers/etapa5-calculo/etapa5-calculo.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    FormSAureusPageRoutingModule,
    ComponentsModule,
    Etapa5CalculoComponent,
  ],
  declarations: [FormSAureusPage]
})
export class FormSAureusPageModule { }
