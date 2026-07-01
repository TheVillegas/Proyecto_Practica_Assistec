import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { EquipoIncubacion } from '../../../interfaces/catalogo.interfaces';
import { MuestraEtapa4 } from '../form-salmonella.page';

type CampoResultadoAgar = 'xld24hSel' | 'ss24hSel' | 'xld48hSel' | 'ss48hSel'
  | 'xld24hRap' | 'ss24hRap' | 'xld48hRap' | 'ss48hRap';

@Component({
  selector: 'app-sal-etapa4-aislamiento',
  templateUrl: './sal-etapa4-aislamiento.component.html',
  styleUrls: ['./sal-forms-shared.scss'],
  standalone: false,
})
export class SalEtapa4AislamientoComponent {
  @Input() formGroupFase4a!: FormGroup;
  @Input() muestras: MuestraEtapa4[] = [];
  @Output() muestrasChange = new EventEmitter<MuestraEtapa4[]>();
  @Input() equiposIncubacion: EquipoIncubacion[] = [];

  campoInvalido(group: FormGroup, nombre: string): boolean {
    const ctrl = group.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  setCelda(muestra: MuestraEtapa4, campo: CampoResultadoAgar, valor: string): void {
    muestra[campo] = valor;
    this.muestrasChange.emit(this.muestras);
  }

  toggleControl(
    muestra: MuestraEtapa4,
    campo: 'ctrlPositivoSEnteritidis' | 'ctrlNegativoKPneumoniae' | 'ctrlBlanco'
  ): void {
    muestra[campo] = !muestra[campo];
    this.muestrasChange.emit(this.muestras);
  }
}
