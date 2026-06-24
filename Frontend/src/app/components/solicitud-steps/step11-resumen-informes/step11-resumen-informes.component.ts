import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormularioSeleccionadoPayload } from 'src/app/services/solicitud-ingreso.service';

@Component({
  selector: 'app-step11-resumen-informes',
  templateUrl: './step11-resumen-informes.component.html',
  styleUrls: ['./step11-resumen-informes.component.scss'],
  standalone: false
})
export class Step11ResumenInformesComponent {
  @Input() parentForm!: FormGroup;
  @Input() reviewMode = false;
  @Input() isReadOnly = false;
  @Input() codigoALI!: string;
  @Input() badgeEstado!: any;
  @Input() formulariosConsolidados: FormularioSeleccionadoPayload[] = [];
  @Input() canSendToValidation = false;

  @Output() enviarAValidacion = new EventEmitter<void>();

  onEnviarAValidacion(): void {
    this.enviarAValidacion.emit();
  }
}
