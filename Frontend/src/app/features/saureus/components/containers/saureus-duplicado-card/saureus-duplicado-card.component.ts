/**
 * SaureusDuplicadoCard - Componente contenedor para duplicado (referencia ALI pasado)
 * 
 * Contiene: Selector ALI + datos importados + acciones
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AliSelectorComponent, AliOption } from '../../atoms/ali-selector/ali-selector.component';
import { RecuentoSectionComponent, Dilucion } from '../../compounds/recuento-section/recuento-section.component';
import { ConfirmacionCoagulasaSectionComponent } from '../../compounds/confirmacion-coagulasa-section/confirmacion-coagulasa-section.component';
import { ResultadoCalculoSectionComponent, ResultadoCalculo } from '../../compounds/resultado-calculo-section/resultado-calculo-section.component';

export interface DuplicadoData {
  aliReferencia: number | null;
  diluciones: Dilucion[];
  coloniasPosibles: [number | null, number | null];
  colConfirmar: [number | null, number | null];
  coagulasa4h: [number | null, number | null];
  coagulasa24h: [number | null, number | null];
  resultado?: ResultadoCalculo;
  advertencia?: string | null;
}

@Component({
  selector: 'app-saureus-duplicado-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AliSelectorComponent,
    RecuentoSectionComponent,
    ConfirmacionCoagulasaSectionComponent,
    ResultadoCalculoSectionComponent
  ],
  template: `
    <div class="duplicado-card">
      <div class="card-header">
        <h3 class="card-title">DUPLICADO (Referencia a ALI anterior)</h3>
      </div>
      
      <div class="card-body">
        <!-- Selector de ALI -->
        <div class="ali-section">
          <app-ali-selector
            [selectedAli]="duplicadoData.aliReferencia"
            [aliList]="aliList"
            [label]="'ALI de referencia'"
            [hint]="'Seleccionar ALI para importar Muestra 1'"
            (aliChange)="onAliChange($event)">
          </app-ali-selector>
        </div>
        
        <!-- Advertencia si existe -->
        <div class="advertencia" *ngIf="duplicadoData.advertencia">
          <span class="advertencia-icon">⚠</span>
          {{ duplicadoData.advertencia }}
        </div>
        
        <!-- Datos importados (solo lectura) -->
        <div class="datos-importados" *ngIf="duplicadoData.aliReferencia && !duplicadoData.advertencia">
          <h4 class="datos-title">Datos importados de Muestra 1 del ALI-{{ duplicadoData.aliReferencia }}</h4>
          
          <app-recuento-section
            [diluciones]="duplicadoData.diluciones"
            [coloniasPosibles]="duplicadoData.coloniasPosibles"
            [disabled]="true"
            [showColoniasPosibles]="true">
          </app-recuento-section>
          
          <app-confirmacion-coagulasa-section
            [colConfirmar]="duplicadoData.colConfirmar"
            [coagulasa4h]="duplicadoData.coagulasa4h"
            [coagulasa24h]="duplicadoData.coagulasa24h"
            [coagulasaUsada]="duplicadoData?.resultado?.coagulasaUsada"
            [disabled]="true">
          </app-confirmacion-coagulasa-section>
          
          <app-resultado-calculo-section
            [resultado]="duplicadoData?.resultado || null">
          </app-resultado-calculo-section>
        </div>
      </div>
      
      <div class="card-footer">
        <button
          class="btn-secondary"
          (click)="reimportar.emit(duplicadoData.aliReferencia)"
          [disabled]="!duplicadoData.aliReferencia || isLoading"
        >
          <span class="btn-icon">🔄</span>
          Re-importar
        </button>
        <button
          class="btn-outline"
          (click)="editar.emit()"
          [disabled]="isLoading"
        >
          <span class="btn-icon">✏️</span>
          Editar manualmente
        </button>
      </div>
    </div>
  `,
  styles: [`
    .duplicado-card {
      background: #faf5ff;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      border: 2px solid #a78bfa;
    }
    
    .card-header {
      padding: 1rem 1.5rem;
      background-color: #f3e8ff;
      border-bottom: 1px solid #c4b5fd;
    }
    
    .card-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: #5b21b6;
    }
    
    .card-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .ali-section {
      padding: 1rem;
      background-color: white;
      border-radius: 0.5rem;
      border: 1px solid #e9d5ff;
    }
    
    .advertencia {
      padding: 0.75rem;
      background-color: #fef3c7;
      border-radius: 0.5rem;
      color: #92400e;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }
    
    .datos-importados {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .datos-title {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #6b21a8;
    }
    
    .card-footer {
      padding: 1rem 1.5rem;
      background-color: #f3e8ff;
      border-top: 1px solid #c4b5fd;
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    
    .btn-secondary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background-color: #7c3aed;
      color: white;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      cursor: pointer;
    }
    
    .btn-secondary:hover:not(:disabled) {
      background-color: #6d28d9;
    }
    
    .btn-outline {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background-color: white;
      color: #7c3aed;
      border: 1px solid #7c3aed;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      cursor: pointer;
    }
    
    .btn-outline:hover:not(:disabled) {
      background-color: #f5f3ff;
    }
    
    .btn-icon {
      font-size: 0.875rem;
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class SaureusDuplicadoCardComponent {
  @Input() duplicadoData: DuplicadoData = {
    aliReferencia: null,
    diluciones: [
      { dil: -2, colonias: [null, null] },
      { dil: -3, colonias: [null, null] }
    ],
    coloniasPosibles: [null, null],
    colConfirmar: [null, null],
    coagulasa4h: [null, null],
    coagulasa24h: [null, null]
  };
  @Input() aliList: AliOption[] = [];
  @Input() isLoading: boolean = false;
  
  @Output() aliChange = new EventEmitter<number | null>();
  @Output() reimportar = new EventEmitter<number | null>();
  @Output() editar = new EventEmitter<void>();
  @Output() duplicadoDataChange = new EventEmitter<DuplicadoData>();
  
  onAliChange(aliId: number | null): void {
    this.aliChange.emit(aliId);
  }
}
