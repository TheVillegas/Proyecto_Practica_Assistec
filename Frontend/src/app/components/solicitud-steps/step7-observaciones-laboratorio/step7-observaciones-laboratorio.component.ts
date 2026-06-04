import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-step7-observaciones-laboratorio',
  templateUrl: './step7-observaciones-laboratorio.component.html',
  styleUrls: ['./step7-observaciones-laboratorio.component.scss'],
  standalone: false
})
export class Step7ObservacionesLaboratorioComponent {
  @Input() parentForm!: FormGroup;
  @Input() reviewMode = false;
  @Input() isReadOnly = false;
}
