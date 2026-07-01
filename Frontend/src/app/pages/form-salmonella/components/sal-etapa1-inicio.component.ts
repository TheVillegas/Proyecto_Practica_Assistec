import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Responsable } from '../../../interfaces/catalogo.interfaces';

@Component({
  selector: 'app-sal-etapa1-inicio',
  templateUrl: './sal-etapa1-inicio.component.html',
  styleUrls: ['./sal-forms-shared.scss'],
  standalone: false,
})
export class SalEtapa1InicioComponent {
  @Input() formGroupFase1!: FormGroup;
  @Input() formGroupFase2a!: FormGroup;
  @Input() responsables: Responsable[] = [];
  @Input() alertaTiempo25min = false;

  campoInvalido(group: FormGroup, nombre: string): boolean {
    const ctrl = group.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  hoy(): string {
    return new Date().toISOString().split('T')[0];
  }
}
