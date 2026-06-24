import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

interface TablaResultados {
  muestraB: string;
  muestraA: string;
  d: string;
  n1: string;
  n2: string;
  m: string;
  sumaA: string;
}

@Component({
  selector: 'app-ent-resultados',
  templateUrl: './ent-resultados.component.html',
  standalone: false,
})
export class EntResultadosComponent {
  @Input() formGroup!: FormGroup;
  @Input() rol?: number;
  @Output() subetapaCompleta = new EventEmitter<void>();

  tablaResultados: TablaResultados = {
    muestraB: '',
    muestraA: '',
    d: '',
    n1: '',
    n2: '',
    m: '',
    sumaA: '',
  };

  erroresTablaResultados: Partial<Record<keyof TablaResultados, string>> = {};
  readonly resultadosKeys: (keyof TablaResultados)[] = ['muestraB', 'muestraA', 'd', 'n1', 'n2', 'm', 'sumaA'];

  onSubetapaCompleta(): void {
    this.subetapaCompleta.emit();
  }

  campoInvalido(nombre: string): boolean {
    const ctrl = this.formGroup.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  validarTablaResultados(): boolean {
    this.erroresTablaResultados = {};
    const campos: (keyof TablaResultados)[] = ['muestraB', 'muestraA', 'd', 'n1', 'n2', 'm', 'sumaA'];
    let valido = true;
    campos.forEach((c) => {
      const val = this.tablaResultados[c];
      if (val !== '' && (isNaN(Number(val)) || Number(val) < 0)) {
        this.erroresTablaResultados[c] = 'Ingrese un valor numérico válido.';
        valido = false;
      }
    });
    return valido;
  }
}
