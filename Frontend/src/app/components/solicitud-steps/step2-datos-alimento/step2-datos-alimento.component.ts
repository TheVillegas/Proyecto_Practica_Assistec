import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-step2-datos-alimento',
  templateUrl: './step2-datos-alimento.component.html',
  styleUrls: ['./step2-datos-alimento.component.scss'],
  standalone: false
})
export class Step2DatosAlimentoComponent {
  @Input() parentForm!: FormGroup;
  @Input() reviewMode = false;

  campoInvalido(campo: string): boolean {
    const control = this.parentForm?.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
