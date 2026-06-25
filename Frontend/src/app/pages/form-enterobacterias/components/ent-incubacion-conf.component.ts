import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { EquipoIncubacion, Responsable } from '../../../interfaces/catalogo.interfaces';

@Component({
  selector: 'app-ent-incubacion-conf',
  templateUrl: './ent-incubacion-conf.component.html',
  styleUrls: ['../components/ent-forms-shared.scss'],
  standalone: false,
})
export class EntIncubacionConfComponent {
  @Input() formGroup!: FormGroup;
  @Input() rol?: number;
  @Input() equiposIncubacion: EquipoIncubacion[] = [];
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
