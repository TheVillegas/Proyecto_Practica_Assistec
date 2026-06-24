import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-ent-incubacion-prep',
  templateUrl: './ent-incubacion-prep.component.html',
  standalone: false,
})
export class EntIncubacionPrepComponent {
  @Input() formGroup!: FormGroup;
  @Input() rol?: number;
  @Output() subetapaCompleta = new EventEmitter<void>();

  readonly opcionesEstufa = [
    { valor: 'Estufa 73-M (35.0 +/- 0.5 °C)', label: 'Estufa 73-M (35.0 +/- 0.5 °C)' },
    { valor: 'Estufa 2-M (35.5 +/- 0.5 °C)', label: 'Estufa 2-M (35.5 +/- 0.5 °C)' },
  ];

  onSubetapaCompleta(): void {
    this.subetapaCompleta.emit();
  }

  campoInvalido(nombre: string): boolean {
    const ctrl = this.formGroup.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  hoy(): string {
    return new Date().toISOString().split('T')[0];
  }
}
