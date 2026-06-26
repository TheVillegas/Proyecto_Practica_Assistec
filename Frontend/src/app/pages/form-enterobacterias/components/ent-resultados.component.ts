import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-ent-resultados',
  templateUrl: './ent-resultados.component.html',
  styleUrls: ['../components/ent-forms-shared.scss'],
  standalone: false,
})
export class EntResultadosComponent {
  @Input() formGroup!: FormGroup;
  @Input() rol?: number;

  campoInvalido(nombre: string): boolean {
    const ctrl = this.formGroup.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }
}
