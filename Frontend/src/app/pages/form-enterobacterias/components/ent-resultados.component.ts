import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { EntResultadoCalculo } from '../../../interfaces/enterobacterias.interfaces';

@Component({
  selector: 'app-ent-resultados',
  templateUrl: './ent-resultados.component.html',
  styleUrls: ['../components/ent-forms-shared.scss'],
  standalone: false,
})
export class EntResultadosComponent {
  @Input() formGroup!: FormGroup;
  @Input() rol?: number;
  @Input() muestraLabel = '';
  @Input() resultado?: EntResultadoCalculo;

  campoInvalido(nombre: string): boolean {
    const ctrl = this.formGroup.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  formatUfc(): string {
    if (!this.resultado || this.resultado.nEnterobacterias === null) return 'Sin datos';
    const op = this.resultado.operador !== '=' ? `${this.resultado.operador} ` : '';
    return `${op}${this.resultado.nEnterobacterias} UFC/g`;
  }
}
