import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { EquipoLaboratorio } from 'src/app/interfaces/catalogo.interfaces';

@Component({
  selector: 'app-step3-analisis-solicitado',
  templateUrl: './step3-analisis-solicitado.component.html',
  styleUrls: ['./step3-analisis-solicitado.component.scss'],
  standalone: false
})
export class Step3AnalisisSolicitadoComponent {
  @Input() parentForm!: FormGroup;
  @Input() reviewMode = false;
  @Input() equiposLaboratorio: EquipoLaboratorio[] = [];

  campoInvalido(campo: string): boolean {
    const control = this.parentForm?.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
