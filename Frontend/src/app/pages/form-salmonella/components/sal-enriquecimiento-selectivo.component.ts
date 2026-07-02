import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BanoTermico, EquipoIncubacion, MaterialSiembra, Micropipeta, Responsable } from '../../../interfaces/catalogo.interfaces';

@Component({
  selector: 'app-sal-enriquecimiento-selectivo',
  templateUrl: './sal-enriquecimiento-selectivo.component.html',
  styleUrls: ['./sal-forms-shared.scss'],
  standalone: false,
})
export class SalEnriquecimientoSelectivoComponent {
  @Input() formGroupFase3a!: FormGroup;
  @Input() formGroupFase3b!: FormGroup;
  @Input() listaResponsables: Responsable[] = [];
  @Input() listaEquiposIncubacion: EquipoIncubacion[] = [];
  @Input() listaBanos: BanoTermico[] = [];
  @Input() listaMaterialSiembra: MaterialSiembra[] = [];
  @Input() listaPipetas: Micropipeta[] = [];
  @Input() puntasSeleccionadas: number[] = [];
  @Input() pipetasDesechablesSeleccionadas: number[] = [];
  @Input() micropipetasSeleccionadas: number[] = [];
  @Input() rol?: number;
  @Output() puntasSeleccionadasChange = new EventEmitter<number[]>();
  @Output() pipetasDesechablesSeleccionadasChange = new EventEmitter<number[]>();
  @Output() micropipetasSeleccionadasChange = new EventEmitter<number[]>();

  campoInvalido(group: FormGroup, nombre: string): boolean {
    const ctrl = group.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  togglePunta(idMaterial: number): void {
    const actual = this.puntasSeleccionadas.includes(idMaterial)
      ? this.puntasSeleccionadas.filter((id) => id !== idMaterial)
      : [...this.puntasSeleccionadas, idMaterial];
    this.puntasSeleccionadasChange.emit(actual);
  }

  togglePipetaDesechable(idMaterial: number): void {
    const actual = this.pipetasDesechablesSeleccionadas.includes(idMaterial)
      ? this.pipetasDesechablesSeleccionadas.filter((id) => id !== idMaterial)
      : [...this.pipetasDesechablesSeleccionadas, idMaterial];
    this.pipetasDesechablesSeleccionadasChange.emit(actual);
  }

  toggleMicropipeta(idPipeta: number): void {
    const actual = this.micropipetasSeleccionadas.includes(idPipeta)
      ? this.micropipetasSeleccionadas.filter((id) => id !== idPipeta)
      : [...this.micropipetasSeleccionadas, idPipeta];
    this.micropipetasSeleccionadasChange.emit(actual);
  }
}
