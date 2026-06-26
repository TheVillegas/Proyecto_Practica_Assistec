import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Responsable } from '../../../interfaces/catalogo.interfaces';

@Component({
  selector: 'app-ent-lectura-oxidasa',
  templateUrl: './ent-lectura-oxidasa.component.html',
  styleUrls: ['../components/ent-forms-shared.scss'],
  standalone: false,
})
export class EntLecturaOxidasaComponent {
  @Input() formGroup!: FormGroup;
  @Input() rol?: number;
  @Input() responsables: Responsable[] = [];

  campoInvalido(nombre: string): boolean {
    const ctrl = this.formGroup.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  mensajeErrorReactivo(): string {
    const ctrl = this.formGroup.get('reactivoOxidasa');
    if (!ctrl || !ctrl.touched) return '';
    if (ctrl.errors?.['required']) return 'El campo Reactivo de Oxidasa es obligatorio.';
    if (ctrl.errors?.['reactivoInvalido']) return ctrl.errors['reactivoInvalido'];
    return '';
  }

  hoy(): string {
    return new Date().toISOString().split('T')[0];
  }
}
