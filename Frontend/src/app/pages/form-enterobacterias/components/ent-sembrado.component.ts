import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  EquipoIncubacion,
  Micropipeta,
  Responsable,
  LoteReactivo
} from '../../../interfaces/catalogo.interfaces';

@Component({
  selector: 'app-ent-sembrado',
  templateUrl: './ent-sembrado.component.html',
  standalone: false,
})
export class EntSembradoComponent {
  @Input() formGroup!: FormGroup;
  @Input() rol?: number;
  @Input() equiposIncubacion: EquipoIncubacion[] = [];
  @Input() micropipetas: Micropipeta[] = [];
  @Input() lotesAgarVRBG: LoteReactivo[] = [];
  @Input() lotesTween80: LoteReactivo[] = [];
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
