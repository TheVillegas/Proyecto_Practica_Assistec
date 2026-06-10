/**
 * RecuentoSection - Componente compuesto para tabla de recuento
 * 
 * Muestra la tabla de diluciones + colonias por placa (A y B)
 * 
 * Uso:
 * <app-recuento-section
 *   [diluciones]="diluciones"
 *   [coloniasPosibles]="coloniasPosibles"
 *   (dilucionesChange)="onDilucionesChange($event)"
 *   (coloniasPosiblesChange)="onColoniasPosiblesChange($event)">
 * </app-recuento-section>
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlacaInputComponent } from '../../atoms/placa-input/placa-input.component';

export interface Dilucion {
  dil: number;
  colonias: [number | null, number | null];
}

@Component({
  selector: 'app-recuento-section',
  standalone: true,
  imports: [CommonModule, FormsModule, PlacaInputComponent],
  template: `
    <div class="recuento-section">
      <h4 class="section-title">
        <span class="section-icon">📊</span>
        Recuento
      </h4>
      
      <table class="recuento-table">
        <thead>
          <tr>
            <th>Dil</th>
            <th>Placa A</th>
            <th>Placa B</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let dilucion of diluciones; let i = index">
            <td class="dil-label">{{ formatDilucion(dilucion.dil) }}</td>
            <td>
              <app-placa-input
                [value]="dilucion.colonias[0]"
                (valueChange)="onPlacaAChange(i, $event)"
                [disabled]="disabled"
                [placeholder]="'—'">
              </app-placa-input>
            </td>
            <td>
              <app-placa-input
                [value]="dilucion.colonias[1]"
                (valueChange)="onPlacaBChange(i, $event)"
                [disabled]="disabled"
                [placeholder]="'—'">
              </app-placa-input>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="colonias-posibles" *ngIf="showColoniasPosibles">
        <label class="colonias-label">Colonias posibles S. aureus:</label>
        <div class="colonias-inputs">
          <div class="colonias-input-group">
            <span class="colonias-placa-label">PA:</span>
            <app-placa-input
              [value]="coloniasPosibles[0]"
              (valueChange)="onColoniasAChange($event)"
              [disabled]="disabled">
            </app-placa-input>
          </div>
          <div class="colonias-input-group">
            <span class="colonias-placa-label">PB:</span>
            <app-placa-input
              [value]="coloniasPosibles[1]"
              (valueChange)="onColoniasBChange($event)"
              [disabled]="disabled">
            </app-placa-input>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .recuento-section {
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
    
    .recuento-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    
    .recuento-table th,
    .recuento-table td {
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      text-align: center;
    }
    
    .recuento-table th {
      background-color: #29588c;
      color: white;
      font-weight: 600;
    }
    
    .dil-label {
      font-weight: 600;
      color: #475569;
    }
    
    .colonias-posibles {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
    
    .colonias-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.5rem;
      display: block;
    }
    
    .colonias-inputs {
      display: flex;
      gap: 1rem;
    }
    
    .colonias-input-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .colonias-placa-label {
      font-size: 0.75rem;
      color: #64748b;
    }
  `]
})
export class RecuentoSectionComponent {
  @Input() diluciones: Dilucion[] = [
    { dil: -2, colonias: [null, null] },
    { dil: -3, colonias: [null, null] }
  ];
  @Input() coloniasPosibles: [number | null, number | null] = [null, null];
  @Input() disabled: boolean = false;
  @Input() showColoniasPosibles: boolean = true;
  
  @Output() dilucionesChange = new EventEmitter<Dilucion[]>();
  @Output() coloniasPosiblesChange = new EventEmitter<[number | null, number | null]>();
  
  formatDilucion(dil: number): string {
    return `10${this.getSuperscript(dil)}`;
  }
  
  private getSuperscript(exponent: number): string {
    const superscripts: Record<string, string> = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };
    
    const absExp = Math.abs(exponent);
    const expStr = absExp.toString().split('').map(d => superscripts[d]).join('');
    const sign = exponent < 0 ? '⁻' : '';
    
    return `${sign}${expStr}`;
  }
  
  onPlacaAChange(index: number, value: number | null): void {
    const newDiluciones = [...this.diluciones];
    newDiluciones[index] = {
      ...newDiluciones[index],
      colonias: [value, newDiluciones[index].colonias[1]]
    };
    this.dilucionesChange.emit(newDiluciones);
  }
  
  onPlacaBChange(index: number, value: number | null): void {
    const newDiluciones = [...this.diluciones];
    newDiluciones[index] = {
      ...newDiluciones[index],
      colonias: [newDiluciones[index].colonias[0], value]
    };
    this.dilucionesChange.emit(newDiluciones);
  }
  
  onColoniasAChange(value: number | null): void {
    this.coloniasPosiblesChange.emit([value, this.coloniasPosibles[1]]);
  }
  
  onColoniasBChange(value: number | null): void {
    this.coloniasPosiblesChange.emit([this.coloniasPosibles[0], value]);
  }
}
