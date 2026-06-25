import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Responsable } from '../../../interfaces/catalogo.interfaces';

@Component({
  selector: 'app-ent-pesado',
  templateUrl: './ent-pesado.component.html',
  styleUrls: ['../components/ent-forms-shared.scss'],
  standalone: false,
})
export class EntPesadoComponent {
  @Input() formGroup!: FormGroup;
  @Input() rol?: number;
  @Input() responsables: Responsable[] = [];
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
