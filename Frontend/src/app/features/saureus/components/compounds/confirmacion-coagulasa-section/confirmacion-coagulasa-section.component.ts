/**
 * ConfirmacionCoagulasaSection - Componente compuesto para tabla de confirmación y coagulasa
 * 
 * Muestra la tabla de A confirmar, Coag 4 hrs, Coag 24 h por placa A y B
 * 
 * Uso:
 * <app-confirmacion-coagulasa-section
 *   [colConfirmar]="colConfirmar"
 *   [coagulasa4h]="coagulasa4h"
 *   [coagulasa24h]="coagulasa24h"
 *   (colConfirmarChange)="onColConfirmarChange($event)"
 *   (coagulasa4hChange)="onCoagulasa4hChange($event)"
 *   (coagulasa24hChange)="onCoagulasa24hChange($event)">
 * </app-confirmacion-coagulasa-section>
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlacaInputComponent } from '../../atoms/placa-input/placa-input.component';

@Component({
  selector: 'app-confirmacion-coagulasa-section',
  standalone: true,
  imports: [CommonModule, FormsModule, PlacaInputComponent],
  template: `
    <div class="confirmacion-section">
      <h4 class="section-title">
        <span class="section-icon">🧪</span>
        Confirmación y coagulasa
      </h4>
      
      <table class="confirmacion-table">
        <thead>
          <tr>
            <th></th>
            <th>Placa A</th>
            <th>Placa B</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="row-label">A confirmar</td>
            <td>
              <app-placa-input
                [value]="colConfirmar[0]"
                (valueChange)="onColConfirmarAChange($event)"
                [disabled]="disabled"
                [hasError]="colConfirmar[0] !== null && colConfirmar[0]! > 5"
                [errorMessage]="'Máx. 5'">
              </app-placa-input>
            </td>
            <td>
              <app-placa-input
                [value]="colConfirmar[1]"
                (valueChange)="onColConfirmarBChange($event)"
                [disabled]="disabled"
                [hasError]="colConfirmar[1] !== null && colConfirmar[1]! > 5"
                [errorMessage]="'Máx. 5'">
              </app-placa-input>
            </td>
          </tr>
          <tr>
            <td class="row-label">Coag. 4 hrs</td>
            <td>
              <app-placa-input
                [value]="coagulasa4h[0]"
                (valueChange)="onCoagulasa4hAChange($event)"
                [disabled]="disabled"
                [placeholder]="'—'">
              </app-placa-input>
            </td>
            <td>
              <app-placa-input
                [value]="coagulasa4h[1]"
                (valueChange)="onCoagulasa4hBChange($event)"
                [disabled]="disabled"
                [placeholder]="'—'">
              </app-placa-input>
            </td>
          </tr>
          <tr>
            <td class="row-label">Coag. 24 h</td>
            <td>
              <app-placa-input
                [value]="coagulasa24h[0]"
                (valueChange)="onCoagulasa24hAChange($event)"
                [disabled]="disabled || isCoagulasa4hPositive"
                [placeholder]="isCoagulasa4hPositive ? '—' : '—'">
              </app-placa-input>
            </td>
            <td>
              <app-placa-input
                [value]="coagulasa24h[1]"
                (valueChange)="onCoagulasa24hBChange($event)"
                [disabled]="disabled || isCoagulasa4hPositive"
                [placeholder]="isCoagulasa4hPositive ? '—' : '—'">
              </app-placa-input>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="coagulasa-info" *ngIf="coagulasaUsada">
        <span class="info-label">Lectura usada:</span>
        <span class="info-value">{{ coagulasaUsada }}</span>
      </div>
      
      <div class="max-warning" *ngIf="totalConfirmar > 5">
        <span class="warning-icon">⚠</span>
        Total A confirmar: {{ totalConfirmar }} (máx. 5)
      </div>
    </div>
  `,
  styles: [`
    .confirmacion-section {
      padding: 1rem;
      background-color: #f8fafc;
      border-radius: 0.5rem;
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1rem 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e3a8a;
    }
    
    .section-icon {
      font-size: 1rem;
    }
    
    .confirmacion-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    
    .confirmacion-table th,
    .confirmacion-table td {
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      text-align: center;
    }
    
    .confirmacion-table th {
      background-color: #29588c;
      color: white;
      font-weight: 600;
    }
    
    .row-label {
      font-weight: 600;
      color: #475569;
      text-align: left;
    }
    
    .coagulasa-info {
      margin-top: 0.75rem;
      padding: 0.5rem;
      background-color: #e0f2fe;
      border-radius: 0.375rem;
      font-size: 0.75rem;
    }
    
    .info-label {
      color: #0369a1;
      font-weight: 600;
    }
    
    .info-value {
      color: #0c4a6e;
      margin-left: 0.5rem;
    }
    
    .max-warning {
      margin-top: 0.75rem;
      padding: 0.5rem;
      background-color: #fef3c7;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      color: #92400e;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .warning-icon {
      font-size: 1rem;
    }
  `]
})
export class ConfirmacionCoagulasaSectionComponent {
  @Input() colConfirmar: [number | null, number | null] = [null, null];
  @Input() coagulasa4h: [number | null, number | null] = [null, null];
  @Input() coagulasa24h: [number | null, number | null] = [null, null];
  @Input() disabled: boolean = false;
  @Input() coagulasaUsada: string | null = null;
  
  @Output() colConfirmarChange = new EventEmitter<[number | null, number | null]>();
  @Output() coagulasa4hChange = new EventEmitter<[number | null, number | null]>();
  @Output() coagulasa24hChange = new EventEmitter<[number | null, number | null]>();
  
  get totalConfirmar(): number {
    return (this.colConfirmar[0] || 0) + (this.colConfirmar[1] || 0);
  }
  
  get isCoagulasa4hPositive(): boolean {
    return (this.coagulasa4h[0] || 0) > 0 || (this.coagulasa4h[1] || 0) > 0;
  }
  
  onColConfirmarAChange(value: number | null): void {
    this.colConfirmarChange.emit([value, this.colConfirmar[1]]);
  }
  
  onColConfirmarBChange(value: number | null): void {
    this.colConfirmarChange.emit([this.colConfirmar[0], value]);
  }
  
  onCoagulasa4hAChange(value: number | null): void {
    this.coagulasa4hChange.emit([value, this.coagulasa4h[1]]);
  }
  
  onCoagulasa4hBChange(value: number | null): void {
    this.coagulasa4hChange.emit([this.coagulasa4h[0], value]);
  }
  
  onCoagulasa24hAChange(value: number | null): void {
    this.coagulasa24hChange.emit([value, this.coagulasa24h[1]]);
  }
  
  onCoagulasa24hBChange(value: number | null): void {
    this.coagulasa24hChange.emit([this.coagulasa24h[0], value]);
  }
}
