/**
 * AliSelector - Componente atómico para seleccionar ALI pasado
 * 
 * Uso:
 * <app-ali-selector
 *   [selectedAli]="aliSeleccionado"
 *   [aliList]="listaDeAlis"
 *   (aliChange)="onAliChange($event)">
 * </app-ali-selector>
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface AliOption {
  id: number;
  codigo: string;
  fechaCreacion: Date;
}

@Component({
  selector: 'app-ali-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ali-selector-container">
      <label class="ali-label" *ngIf="label">{{ label }}</label>
      <select
        class="ali-select"
        [ngModel]="selectedAli"
        (ngModelChange)="aliChange.emit($event)"
        [disabled]="disabled"
      >
        <option [value]="null">Seleccionar ALI...</option>
        <option *ngFor="let ali of aliList" [value]="ali.id">
          {{ ali.codigo }} - {{ ali.fechaCreacion | date:'dd/MM/yyyy' }}
        </option>
      </select>
      <span class="ali-hint" *ngIf="hint">{{ hint }}</span>
    </div>
  `,
  styles: [`
    .ali-selector-container {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .ali-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
    }
    
    .ali-select {
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      background-color: white;
    }
    
    .ali-select:disabled {
      background-color: #f1f5f9;
      cursor: not-allowed;
    }
    
    .ali-hint {
      font-size: 0.625rem;
      color: #64748b;
    }
  `]
})
export class AliSelectorComponent {
  @Input() selectedAli: number | null = null;
  @Input() aliList: AliOption[] = [];
  @Input() label: string = 'ALI de referencia';
  @Input() hint: string = '';
  @Input() disabled: boolean = false;
  
  @Output() aliChange = new EventEmitter<number | null>();
}
