/**
 * SaureusMuestraCard - Componente contenedor para card de muestra
 * 
 * Contiene las 3 secciones: Recuento, Confirmación/Coagulasa, Resultados
 * + botón "Calcular muestra"
 * 
 * Uso:
 * <app-saureus-muestra-card
 *   [muestraId]="'M1'"
 *   [numero]="1"
 *   [muestraData]="datosMuestra"
 *   (calcular)="onCalcularMuestra($event)">
 * </app-saureus-muestra-card>
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecuentoSectionComponent, Dilucion } from '../../compounds/recuento-section/recuento-section.component';
import { ConfirmacionCoagulasaSectionComponent } from '../../compounds/confirmacion-coagulasa-section/confirmacion-coagulasa-section.component';
import { ResultadoCalculoSectionComponent, ResultadoCalculo } from '../../compounds/resultado-calculo-section/resultado-calculo-section.component';

export interface MuestraData {
  diluciones: Dilucion[];
  coloniasPosibles: [number | null, number | null];
  colConfirmar: [number | null, number | null];
  coagulasa4h: [number | null, number | null];
  coagulasa24h: [number | null, number | null];
  resultado?: ResultadoCalculo;
}

@Component({
  selector: 'app-saureus-muestra-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RecuentoSectionComponent,
    ConfirmacionCoagulasaSectionComponent,
    ResultadoCalculoSectionComponent
  ],
  template: `
    <div class="muestra-card" [class.muestra-duplicado]="esDuplicado">
      <div class="card-header">
        <h3 class="card-title">
          {{ esDuplicado ? 'DUPLICADO' : 'MUESTRA' }} {{ numero }}
        </h3>
        <span class="card-badge" *ngIf="muestraData?.resultado">
          {{ getBadgeText() }}
        </span>
      </div>
      
      <div class="card-body">
        <!-- Sección Recuento -->
        <app-recuento-section
          [diluciones]="muestraData.diluciones"
          [coloniasPosibles]="muestraData.coloniasPosibles"
          [showColoniasPosibles]="true"
          (dilucionesChange)="onDilucionesChange($event)"
          (coloniasPosiblesChange)="onColoniasPosiblesChange($event)">
        </app-recuento-section>
        
        <!-- Sección Confirmación y Coagulasa -->
        <app-confirmacion-coagulasa-section
          [colConfirmar]="muestraData.colConfirmar"
          [coagulasa4h]="muestraData.coagulasa4h"
          [coagulasa24h]="muestraData.coagulasa24h"
          [coagulasaUsada]="muestraData?.resultado?.coagulasaUsada"
          (colConfirmarChange)="onColConfirmarChange($event)"
          (coagulasa4hChange)="onCoagulasa4hChange($event)"
          (coagulasa24hChange)="onCoagulasa24hChange($event)">
        </app-confirmacion-coagulasa-section>
        
        <!-- Sección Resultados -->
        <app-resultado-calculo-section
          [resultado]="muestraData?.resultado || null">
        </app-resultado-calculo-section>
      </div>
      
      <div class="card-footer">
        <button
          class="btn-calcular"
          (click)="calcular.emit(muestraId)"
          [disabled]="isLoading"
        >
          <span class="btn-icon" *ngIf="!isLoading">🧮</span>
          <span class="btn-spinner" *ngIf="isLoading">⏳</span>
          {{ isLoading ? 'Calculando...' : 'Calcular muestra' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .muestra-card {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    
    .muestra-duplicado {
      border-color: #a78bfa;
      background-color: #faf5ff;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background-color: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .muestra-duplicado .card-header {
      background-color: #f3e8ff;
    }
    
    .card-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: #1e293b;
    }
    
    .card-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      background-color: #dcfce7;
      color: #166534;
    }
    
    .card-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .card-footer {
      padding: 1rem 1.5rem;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: center;
    }
    
    .btn-calcular {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background-color: #29588c;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .btn-calcular:hover:not(:disabled) {
      background-color: #1e40af;
    }
    
    .btn-calcular:disabled {
      background-color: #94a3b8;
      cursor: not-allowed;
    }
    
    .btn-icon {
      font-size: 1rem;
    }
    
    .btn-spinner {
      font-size: 1rem;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class SaureusMuestraCardComponent {
  @Input() muestraId: string = '';
  @Input() numero: number = 1;
  @Input() esDuplicado: boolean = false;
  @Input() muestraData: MuestraData = {
    diluciones: [
      { dil: -2, colonias: [null, null] },
      { dil: -3, colonias: [null, null] }
    ],
    coloniasPosibles: [null, null],
    colConfirmar: [null, null],
    coagulasa4h: [null, null],
    coagulasa24h: [null, null]
  };
  @Input() isLoading: boolean = false;
  
  @Output() calcular = new EventEmitter<string>();
  @Output() muestraDataChange = new EventEmitter<MuestraData>();
  
  onDilucionesChange(diluciones: Dilucion[]): void {
    this.muestraDataChange.emit({
      ...this.muestraData,
      diluciones
    });
  }
  
  onColoniasPosiblesChange(coloniasPosibles: [number | null, number | null]): void {
    this.muestraDataChange.emit({
      ...this.muestraData,
      coloniasPosibles
    });
  }
  
  onColConfirmarChange(colConfirmar: [number | null, number | null]): void {
    this.muestraDataChange.emit({
      ...this.muestraData,
      colConfirmar
    });
  }
  
  onCoagulasa4hChange(coagulasa4h: [number | null, number | null]): void {
    this.muestraDataChange.emit({
      ...this.muestraData,
      coagulasa4h
    });
  }
  
  onCoagulasa24hChange(coagulasa24h: [number | null, number | null]): void {
    this.muestraDataChange.emit({
      ...this.muestraData,
      coagulasa24h
    });
  }
  
  getBadgeText(): string {
    if (!this.muestraData?.resultado) return '';
    
    const { resultado } = this.muestraData;
    
    if (resultado.esSd) return 'SD';
    
    if (resultado.ufc && resultado.ufc < 10) return '< 10';
    
    return '✓';
  }
}
