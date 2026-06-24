import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-ent-analisis-lectura',
  templateUrl: './ent-analisis-lectura.component.html',
  standalone: false,
})
export class EntAnalisisLecturaComponent {
  @Input() formGroup!: FormGroup;
  @Input() rol?: number;
  @Output() subetapaCompleta = new EventEmitter<void>();

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
