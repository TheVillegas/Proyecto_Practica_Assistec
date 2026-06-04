import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-step8-analisis-derivados',
  templateUrl: './step8-analisis-derivados.component.html',
  styleUrls: ['./step8-analisis-derivados.component.scss'],
  standalone: false
})
export class Step8AnalisisDerivadosComponent {
  @Input() parentForm!: FormGroup;
  @Input() reviewMode = false;
  @Input() isReadOnly = false;
}
