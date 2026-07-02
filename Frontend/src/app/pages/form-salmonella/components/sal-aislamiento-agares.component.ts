import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BanoTermico, EquipoIncubacion, Responsable } from '../../../interfaces/catalogo.interfaces';
import { MedioCultivo } from '../../../services/medios-cultivos.service';

@Component({
  selector: 'app-sal-aislamiento-agares',
  templateUrl: './sal-aislamiento-agares.component.html',
  styleUrls: ['./sal-forms-shared.scss'],
  standalone: false,
})
export class SalAislamientoAgaresComponent {
  @Input() formGroup!: FormGroup;
  @Input() listaResponsables: Responsable[] = [];
  @Input() listaMediosCultivo: MedioCultivo[] = [];
  @Input() listaEquiposIncubacion: EquipoIncubacion[] = [];
  @Input() listaBanos: BanoTermico[] = [];
  @Input() rol?: number;

  campoInvalido(nombre: string): boolean {
    const ctrl = this.formGroup.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  hoy(): string {
    return new Date().toISOString().split('T')[0];
  }
}
