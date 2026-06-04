import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-step10-tiempos-entrega',
  templateUrl: './step10-tiempos-entrega.component.html',
  styleUrls: ['./step10-tiempos-entrega.component.scss'],
  standalone: false
})
export class Step10TiemposEntregaComponent {
  @Input() parentForm!: FormGroup;
  @Input() reviewMode = false;
  @Input() isReadOnly = false;
  @Input() tiempoEntregaNegativoDias: number | null = null;
  @Input() fechaEstimadaEntregaNegativa: Date | null = null;
  @Input() tiempoEntregaConfirmacionDias: number | null = null;
  @Input() fechaEstimadaEntregaConfirmacion: Date | null = null;
  @Input() fechaEnvioInformePositivo: Date | null = null;
  @Input() fechaEnvioInformeNegativo: Date | null = null;
}
