import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MuestraEtapa5 } from '../form-salmonella.page';

@Component({
  selector: 'app-sal-etapa5-resultado',
  templateUrl: './sal-etapa5-resultado.component.html',
  styleUrls: ['./sal-forms-shared.scss'],
  standalone: false,
})
export class SalEtapa5ResultadoComponent {
  @Input() resultados: MuestraEtapa5[] = [];
  @Input() calculado = false;
  @Output() calcular = new EventEmitter<void>();

  onCalcular(): void {
    this.calcular.emit();
  }
}
