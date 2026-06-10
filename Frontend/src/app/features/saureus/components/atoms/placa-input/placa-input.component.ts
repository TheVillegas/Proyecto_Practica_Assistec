/**
 * PlacaInput - Componente atómico para input de placa A o B
 * 
 * Uso:
 * <app-placa-input
 *   [value]="valor"
 *   (valueChange)="onValorChange($event)"
 *   label="Placa A"
 *   [disabled]="false">
 * </app-placa-input>
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-placa-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="placa-input-container">
      <label class="placa-label" *ngIf="label">{{ label }}</label>
      <input
        type="number"
        class="placa-input"
        [ngModel]="value"
        (ngModelChange)="valueChange.emit($event)"
        [disabled]="disabled"
        [placeholder]="placeholder"
        [class.input-error]="hasError"
        [min]="0"
      />
      <span class="placa-error" *ngIf="errorMessage">{{ errorMessage }}</span>
    </div>
  `,
  styles: [`
    .placa-input-container {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .placa-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
    }
    
    .placa-input {
      width: 80px;
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      text-align: center;
      font-size: 0.875rem;
    }
    
    .placa-input:disabled {
      background-color: #f1f5f9;
      cursor: not-allowed;
    }
    
    .input-error {
      border-color: #ef4444;
    }
    
    .placa-error {
      font-size: 0.625rem;
      color: #ef4444;
    }
  `]
})
export class PlacaInputComponent {
  @Input() value: number | null = null;
  @Input() label: string = '';
  @Input() placeholder: string = '—';
  @Input() disabled: boolean = false;
  @Input() hasError: boolean = false;
  @Input() errorMessage: string = '';
  
  @Output() valueChange = new EventEmitter<number | null>();
}
