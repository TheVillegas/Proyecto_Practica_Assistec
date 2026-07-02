import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Responsable } from '../../../interfaces/catalogo.interfaces';
import { MedioCultivo } from '../../../services/medios-cultivos.service';

@Component({
  selector: 'app-sal-inicio-homogeneizacion',
  templateUrl: './sal-inicio-homogeneizacion.component.html',
  styleUrls: ['./sal-forms-shared.scss'],
  standalone: false,
})
export class SalInicioHomogeneizacionComponent {
  @Input() formGroupFase1!: FormGroup;
  @Input() formGroupFase2a!: FormGroup;
  @Input() listaResponsables: Responsable[] = [];
  @Input() listaMediosCultivo: MedioCultivo[] = [];
  @Input() rol?: number;
  @Input() alertaTiempo25min = false;

  campoInvalido(group: FormGroup, nombre: string): boolean {
    const ctrl = group.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  hoy(): string {
    return new Date().toISOString().split('T')[0];
  }
}
