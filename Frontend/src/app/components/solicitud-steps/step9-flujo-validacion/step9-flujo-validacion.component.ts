import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

interface ResponsableUI {
  rut: string;
  nombre: string;
  rol: number;
}

@Component({
  selector: 'app-step9-flujo-validacion',
  templateUrl: './step9-flujo-validacion.component.html',
  styleUrls: ['./step9-flujo-validacion.component.scss'],
  standalone: false
})
export class Step9FlujoValidacionComponent {
  @Input() parentForm!: FormGroup;
  @Input() reviewMode = false;
  @Input() isReadOnly = false;
  @Input() coordinadoras: ResponsableUI[] = [];
  @Input() jefaturas: ResponsableUI[] = [];
  @Input() badgeEstado!: any;
  @Input() fechaEnvioValidacion: string | null = null;

  campoInvalido(campo: string): boolean {
    const control = this.parentForm?.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
