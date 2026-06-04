import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

interface ResponsableUI {
  rut: string;
  nombre: string;
  rol: number;
}

@Component({
  selector: 'app-step4-observaciones',
  templateUrl: './step4-observaciones.component.html',
  styleUrls: ['./step4-observaciones.component.scss'],
  standalone: false
})
export class Step4ObservacionesComponent {
  @Input() parentForm!: FormGroup;
  @Input() reviewMode = false;
  @Input() analistas: ResponsableUI[] = [];

  campoInvalido(campo: string): boolean {
    const control = this.parentForm?.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
