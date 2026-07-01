import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { EquipoIncubacion } from '../../../interfaces/catalogo.interfaces';

@Component({
  selector: 'app-sal-etapa2-controles',
  templateUrl: './sal-etapa2-controles.component.html',
  styleUrls: ['./sal-forms-shared.scss'],
  standalone: false,
})
export class SalEtapa2ControlesComponent {
  @Input() formGroupFase2b!: FormGroup;
  @Input() formGroupFase2c!: FormGroup;
  @Input() equiposIncubacion: EquipoIncubacion[] = [];

  campoInvalido(group: FormGroup, nombre: string): boolean {
    const ctrl = group.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }
}
