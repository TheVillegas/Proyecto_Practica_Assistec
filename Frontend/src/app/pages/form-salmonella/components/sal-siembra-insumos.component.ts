import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BanoTermico, EquipoIncubacion, MaterialSiembra, Micropipeta } from '../../../interfaces/catalogo.interfaces';
import { MedioCultivo } from '../../../services/medios-cultivos.service';

@Component({
  selector: 'app-sal-siembra-insumos',
  templateUrl: './sal-siembra-insumos.component.html',
  styleUrls: ['./sal-forms-shared.scss'],
  standalone: false,
})
export class SalSiembraInsumosComponent {
  @Input() formGroup!: FormGroup;
  @Input() listaMediosCultivo: MedioCultivo[] = [];
  @Input() listaEquiposIncubacion: EquipoIncubacion[] = [];
  @Input() listaBanos: BanoTermico[] = [];
  @Input() listaMaterialSiembra: MaterialSiembra[] = [];
  @Input() listaPipetas: Micropipeta[] = [];
  @Input() tweenSeleccionados: number[] = [];
  @Input() micropipetasSeleccionadas: number[] = [];
  @Input() rol?: number;
  @Output() tweenSeleccionadosChange = new EventEmitter<number[]>();
  @Output() micropipetasSeleccionadasChange = new EventEmitter<number[]>();

  campoInvalido(nombre: string): boolean {
    const ctrl = this.formGroup.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  toggleTween(idMaterial: number): void {
    const actual = this.tweenSeleccionados.includes(idMaterial)
      ? this.tweenSeleccionados.filter((id) => id !== idMaterial)
      : [...this.tweenSeleccionados, idMaterial];
    this.tweenSeleccionadosChange.emit(actual);
  }

  toggleMicropipeta(idPipeta: number): void {
    const actual = this.micropipetasSeleccionadas.includes(idPipeta)
      ? this.micropipetasSeleccionadas.filter((id) => id !== idPipeta)
      : [...this.micropipetasSeleccionadas, idPipeta];
    this.micropipetasSeleccionadasChange.emit(actual);
  }
}
