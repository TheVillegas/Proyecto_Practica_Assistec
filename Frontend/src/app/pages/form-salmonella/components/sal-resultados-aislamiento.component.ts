import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MuestraResAislamiento } from '../form-salmonella.page';

type CampoAgar = 'xld24hSel' | 'ss24hSel' | 'xld48hSel' | 'ss48hSel'
  | 'xld24hRap' | 'ss24hRap' | 'xld48hRap' | 'ss48hRap';

type CampoControl = 'ctrlPositivoSEnteritidis' | 'ctrlNegativoKPneumoniae' | 'ctrlBlanco';

@Component({
  selector: 'app-sal-resultados-aislamiento',
  templateUrl: './sal-resultados-aislamiento.component.html',
  styleUrls: ['./sal-forms-shared.scss'],
  standalone: false,
})
export class SalResultadosAislamientoComponent {
  @Input() muestras: MuestraResAislamiento[] = [];
  @Input() rol?: number;
  @Output() muestrasChange = new EventEmitter<MuestraResAislamiento[]>();

  toggleAgar(muestra: MuestraResAislamiento, campo: CampoAgar): void {
    muestra[campo] = muestra[campo] === '+' ? '-' : '+';
    this.muestrasChange.emit(this.muestras);
  }

  toggleControl(muestra: MuestraResAislamiento, campo: CampoControl): void {
    muestra[campo] = !muestra[campo];
    this.muestrasChange.emit(this.muestras);
  }
}
