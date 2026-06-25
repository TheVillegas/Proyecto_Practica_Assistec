import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';
import { Responsable } from '../../../interfaces/catalogo.interfaces';

interface TablaPlacas {
  muestraPlaca1: string;
  muestraPlaca2: string;
  duplicadoPlaca1: string;
  duplicadoPlaca2: string;
}

function reactivoOxidasaValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const patron = /^R69-(\d{2})-(0[12])$/;
  if (!patron.test(control.value)) {
    return {
      reactivoInvalido: 'El formato del Reactivo de Oxidasa debe ser R69-AA-NN donde AA es el año en 2 dígitos y NN es 01 o 02. Ejemplo: R69-25-01.'
    };
  }
  return null;
}

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
  @Output() subetapaCompleta = new EventEmitter<void>();

  tablaPlacas: TablaPlacas = {
    muestraPlaca1: '',
    muestraPlaca2: '',
    duplicadoPlaca1: '',
    duplicadoPlaca2: '',
  };

  erroresTablaPlacas: Partial<Record<keyof TablaPlacas, string>> = {};
  readonly placasKeys: (keyof TablaPlacas)[] = ['muestraPlaca1', 'muestraPlaca2', 'duplicadoPlaca1', 'duplicadoPlaca2'];

  onSubetapaCompleta(): void {
    this.subetapaCompleta.emit();
  }

  campoInvalido(nombre: string): boolean {
    const ctrl = this.formGroup.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  mensajeErrorReactivo(): string {
    const ctrl = this.formGroup.get('reactivoOxidasa');
    if (!ctrl || !ctrl.touched) return '';
    if (ctrl.errors?.['required']) return 'El campo Test Oxidasa / Reactivo de Oxidasa es obligatorio.';
    if (ctrl.errors?.['reactivoInvalido']) return ctrl.errors['reactivoInvalido'];
    return '';
  }

  hoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  validarTablaPlacas(): boolean {
    this.erroresTablaPlacas = {};
    const campos: (keyof TablaPlacas)[] = ['muestraPlaca1', 'muestraPlaca2', 'duplicadoPlaca1', 'duplicadoPlaca2'];
    let valido = true;
    campos.forEach((c) => {
      const val = this.tablaPlacas[c];
      if (val !== '' && (isNaN(Number(val)) || Number(val) < 0)) {
        this.erroresTablaPlacas[c] = 'Ingrese un valor numérico válido.';
        valido = false;
      }
    });
    return valido;
  }
}
