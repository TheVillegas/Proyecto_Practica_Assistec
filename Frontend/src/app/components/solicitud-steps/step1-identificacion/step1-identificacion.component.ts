import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-step1-identificacion',
  templateUrl: './step1-identificacion.component.html',
  styleUrls: ['./step1-identificacion.component.scss'],
  standalone: false
})
export class Step1IdentificacionComponent {
  @Input() parentForm!: FormGroup;
  @Input() reviewMode = false;

  campoInvalido(campo: string): boolean {
    const control = this.parentForm?.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
