import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MuestraResEnriquecimiento } from '../form-salmonella.page';

type CampoBooleano = 'caldoApt' | 'selenito' | 'rappaport' | 'ctrlPositivoSEnteritidis' | 'ctrlNegativoKPneumoniae' | 'ctrlBlanco';

@Component({
  selector: 'app-sal-resultados-enriquecimiento',
  templateUrl: './sal-resultados-enriquecimiento.component.html',
  styleUrls: ['./sal-forms-shared.scss'],
  standalone: false,
})
export class SalResultadosEnriquecimientoComponent {
  @Input() muestras: MuestraResEnriquecimiento[] = [];
  @Input() rol?: number;
  @Output() muestrasChange = new EventEmitter<MuestraResEnriquecimiento[]>();

  toggleCelda(muestra: MuestraResEnriquecimiento, campo: CampoBooleano): void {
    muestra[campo] = !muestra[campo];
    this.muestrasChange.emit(this.muestras);
  }
}
