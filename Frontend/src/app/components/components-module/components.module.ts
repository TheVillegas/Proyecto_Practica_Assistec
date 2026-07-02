import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { ALIItemAccordeonComponent } from '../ali-item-accordeon/ali-item-accordeon.component';
import { TitulosReportesComponent } from '../titulos-reportes/titulos-reportes.component';
import { FooterAccionesComponent } from '../footer-acciones/footer-acciones.component';
import { Step1IdentificacionComponent } from '../solicitud-steps/step1-identificacion/step1-identificacion.component';
import { Step2DatosAlimentoComponent } from '../solicitud-steps/step2-datos-alimento/step2-datos-alimento.component';
import { Step3AnalisisSolicitadoComponent } from '../solicitud-steps/step3-analisis-solicitado/step3-analisis-solicitado.component';
import { Step4ObservacionesComponent } from '../solicitud-steps/step4-observaciones/step4-observaciones.component';
import { Step5ResolucionComponent } from '../solicitud-steps/step5-resolucion/step5-resolucion.component';
import { Step6MuestreoComponent } from '../solicitud-steps/step6-muestreo/step6-muestreo.component';
import { Step7ObservacionesLaboratorioComponent } from '../solicitud-steps/step7-observaciones-laboratorio/step7-observaciones-laboratorio.component';
import { Step8AnalisisDerivadosComponent } from '../solicitud-steps/step8-analisis-derivados/step8-analisis-derivados.component';
import { Step9FlujoValidacionComponent } from '../solicitud-steps/step9-flujo-validacion/step9-flujo-validacion.component';
import { Step10TiemposEntregaComponent } from '../solicitud-steps/step10-tiempos-entrega/step10-tiempos-entrega.component';
import { Step11ResumenInformesComponent } from '../solicitud-steps/step11-resumen-informes/step11-resumen-informes.component';
import { ModoLecturaPipe } from '../../pipes/modo-lectura.pipe';

@NgModule({
    declarations: [
        HeaderComponent,
        ModoLecturaPipe,
        ALIItemAccordeonComponent,
        TitulosReportesComponent,
        FooterAccionesComponent,
        Step1IdentificacionComponent,
        Step2DatosAlimentoComponent,
        Step3AnalisisSolicitadoComponent,
        Step4ObservacionesComponent,
        Step5ResolucionComponent,
        Step6MuestreoComponent,
        Step7ObservacionesLaboratorioComponent,
        Step8AnalisisDerivadosComponent,
        Step9FlujoValidacionComponent,
        Step10TiemposEntregaComponent,
        Step11ResumenInformesComponent
    ],
    imports: [
        CommonModule,
        IonicModule,
        FormsModule,
        ReactiveFormsModule
    ],
    exports: [
        HeaderComponent,
        ModoLecturaPipe,
        ALIItemAccordeonComponent,
        TitulosReportesComponent,
        FooterAccionesComponent,
        Step1IdentificacionComponent,
        Step2DatosAlimentoComponent,
        Step3AnalisisSolicitadoComponent,
        Step4ObservacionesComponent,
        Step5ResolucionComponent,
        Step6MuestreoComponent,
        Step7ObservacionesLaboratorioComponent,
        Step8AnalisisDerivadosComponent,
        Step9FlujoValidacionComponent,
        Step10TiemposEntregaComponent,
        Step11ResumenInformesComponent
    ]
})
export class ComponentsModule { }
