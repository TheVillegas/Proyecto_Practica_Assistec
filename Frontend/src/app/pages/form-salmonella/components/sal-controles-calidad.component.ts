import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-sal-controles-calidad',
  templateUrl: './sal-controles-calidad.component.html',
  styleUrls: ['./sal-forms-shared.scss'],
  standalone: false,
})
export class SalControlesCalidadComponent {
  @Input() formGroup!: FormGroup;
  @Input() rol?: number;

  campoInvalido(nombre: string): boolean {
    const ctrl = this.formGroup.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }
}
