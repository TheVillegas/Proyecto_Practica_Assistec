import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MuestraResultadoFinal } from '../form-salmonella.page';

@Component({
  selector: 'app-sal-resultado-final',
  templateUrl: './sal-resultado-final.component.html',
  styleUrls: ['./sal-forms-shared.scss'],
  standalone: false,
})
export class SalResultadoFinalComponent {
  @Input() formGroup!: FormGroup;
  @Input() resultados: MuestraResultadoFinal[] = [];
  @Input() calculado = false;
  @Input() rol?: number;
  @Output() calcular = new EventEmitter<void>();

  onCalcular(): void {
    this.calcular.emit();
  }
}
