import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { EquipoIncubacion } from '../../../interfaces/catalogo.interfaces';
import { MuestraEtapa3 } from '../form-salmonella.page';

@Component({
  selector: 'app-sal-etapa3-traspaso',
  templateUrl: './sal-etapa3-traspaso.component.html',
  styleUrls: ['./sal-forms-shared.scss'],
  standalone: false,
})
export class SalEtapa3TraspasoComponent {
  @Input() formGroupFase3a!: FormGroup;
  @Input() formGroupFase3b!: FormGroup;
  @Input() muestras: MuestraEtapa3[] = [];
  @Output() muestrasChange = new EventEmitter<MuestraEtapa3[]>();
  @Input() equiposIncubacion: EquipoIncubacion[] = [];

  campoInvalido(group: FormGroup, nombre: string): boolean {
    const ctrl = group.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  toggleCelda(
    muestra: MuestraEtapa3,
    campo: 'caldoApt' | 'selenito' | 'rappaport' | 'ctrlPositivoSEnteritidis' | 'ctrlNegativoKPneumoniae' | 'ctrlBlanco'
  ): void {
    muestra[campo] = !muestra[campo];
    this.muestrasChange.emit(this.muestras);
  }
}
