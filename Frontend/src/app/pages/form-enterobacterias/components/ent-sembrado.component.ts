import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  EquipoIncubacion,
  Micropipeta,
  Responsable,
} from '../../../interfaces/catalogo.interfaces';
import { MedioCultivo } from '../../../services/medios-cultivos.service';

@Component({
  selector: 'app-ent-sembrado',
  templateUrl: './ent-sembrado.component.html',
  styleUrls: ['../components/ent-forms-shared.scss'],
  standalone: false,
})
export class EntSembradoComponent {
  @Input() formGroup!: FormGroup;
  @Input() rol?: number;
  @Input() equiposIncubacion: EquipoIncubacion[] = [];
  @Input() micropipetas: Micropipeta[] = [];
  @Input() mediosCultivos: MedioCultivo[] = [];
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
