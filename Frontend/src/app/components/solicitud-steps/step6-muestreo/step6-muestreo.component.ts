import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { EquipoLaboratorio } from 'src/app/interfaces/catalogo.interfaces';

@Component({
  selector: 'app-step6-muestreo',
  templateUrl: './step6-muestreo.component.html',
  styleUrls: ['./step6-muestreo.component.scss'],
  standalone: false
})
export class Step6MuestreoComponent {
  @Input() parentForm!: FormGroup;
  @Input() reviewMode = false;
  @Input() equiposAlmacenamiento: EquipoLaboratorio[] = [];

  campoInvalido(campo: string): boolean {
    const control = this.parentForm?.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
