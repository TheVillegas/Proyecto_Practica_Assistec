/**
 * Etapa5Calculo - Componente contenedor principal para Etapa 5: Cálculo S. Aureus
 * 
 * Contiene: M1-M6 (saureus-muestra-card) + DUP (saureus-duplicado-card)
 * + botón "Calcular TODAS las muestras"
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaureusMuestraCardComponent, MuestraData } from '../saureus-muestra-card/saureus-muestra-card.component';
import { SaureusDuplicadoCardComponent, DuplicadoData } from '../saureus-duplicado-card/saureus-duplicado-card.component';
import { Dilucion } from '../../compounds/recuento-section/recuento-section.component';
import { CalculoService } from '../../../services/calculo.service';

@Component({
  selector: 'app-etapa5-calculo',
  standalone: true,
  imports: [
    CommonModule,
    SaureusMuestraCardComponent,
    SaureusDuplicadoCardComponent
  ],
  template: `
    <div class="etapa5-container">
      <div class="etapa-header">
        <h2 class="etapa-title">
          <span class="etapa-icon">🧮</span>
          5. Cálculo S. Aureus
        </h2>
        <p class="etapa-description">
          Ingrese los datos de recuento, confirmación y coagulasa para cada muestra.
          El sistema calculará automáticamente el resultado según NCh2676 8.2.
        </p>
      </div>
      
      <!-- Muestras M1-M6 -->
      <div class="muestras-grid">
        <app-saureus-muestra-card
          *ngFor="let muestra of muestras; let i = index"
          [muestraId]="muestra.id"
          [numero]="i + 1"
          [esDuplicado]="false"
          [muestraData]="muestra.data"
          [isLoading]="muestra.isLoading"
          (calcular)="onCalcularMuestra($event)"
          (muestraDataChange)="onMuestraDataChange(i, $event)">
        </app-saureus-muestra-card>
      </div>
      
      <!-- Duplicado -->
      <app-saureus-duplicado-card
        [duplicadoData]="duplicado"
        [aliList]="aliList"
        [isLoading]="duplicadoIsLoading"
        (aliChange)="onAliChange($event)"
        (reimportar)="onReimportar($event)"
        (editar)="onEditar()"
        (duplicadoDataChange)="onDuplicadoDataChange($event)">
      </app-saureus-duplicado-card>
      
      <!-- Botón calcular todas -->
      <div class="calcular-todas-container">
        <button
          class="btn-calcular-todas"
          (click)="onCalcularTodas()"
          [disabled]="isCalculatingAll"
        >
          <span class="btn-icon" *ngIf="!isCalculatingAll">🧮</span>
          <span class="btn-spinner" *ngIf="isCalculatingAll">⏳</span>
          {{ isCalculatingAll ? 'Calculando todas...' : 'Calcular TODAS las muestras' }}
        </button>
      </div>
      
      <!-- Resumen de resultados -->
      <div class="resumen-container" *ngIf="hayResultados">
        <h3 class="resumen-title">Resumen de Resultados</h3>
        <div class="resumen-grid">
          <div class="resumen-item" *ngFor="let muestra of muestras">
            <span class="resumen-muestra">{{ muestra.id }}</span>
            <span class="resumen-resultado" [class.sd]="muestra.data?.resultado?.esSd">
              {{ muestra.data?.resultado?.textoReporte || '—' }}
            </span>
          </div>
          <div class="resumen-item duplicado">
            <span class="resumen-muestra">DUP</span>
            <span class="resumen-resultado" [class.sd]="duplicado?.resultado?.esSd">
              {{ duplicado?.resultado?.textoReporte || '—' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .etapa5-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
    }
    
    .etapa-header {
      text-align: center;
      margin-bottom: 1rem;
    }
    
    .etapa-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }
    
    .etapa-icon {
      font-size: 1.5rem;
    }
    
    .etapa-description {
      margin: 0;
      color: #64748b;
      font-size: 0.875rem;
    }
    
    .muestras-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }
    
    .calcular-todas-container {
      display: flex;
      justify-content: center;
      padding: 1rem 0;
    }
    
    .btn-calcular-todas {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #29588c 0%, #1e40af 100%);
      color: white;
      border: none;
      border-radius: 0.75rem;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .btn-calcular-todas:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }
    
    .btn-calcular-todas:disabled {
      background: #94a3b8;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .btn-icon {
      font-size: 1.25rem;
    }
    
    .btn-spinner {
      font-size: 1.25rem;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .resumen-container {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .resumen-title {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      text-align: center;
    }
    
    .resumen-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
    }
    
    .resumen-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 0.5rem;
    }
    
    .resumen-item.duplicado {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
    }
    
    .resumen-muestra {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 0.25rem;
    }
    
    .resumen-resultado {
      font-size: 0.875rem;
      font-weight: 700;
      color: #166534;
    }
    
    .resumen-resultado.sd {
      color: #92400e;
    }
  `]
})
export class Etapa5CalculoComponent implements OnInit {
  muestras: Array<{
    id: string;
    data: MuestraData;
    isLoading: boolean;
  }> = [];
  
  duplicado: DuplicadoData = {
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
  
  aliList: Array<{ id: number; codigo: string; fechaCreacion: Date }> = [];
  isCalculatingAll: boolean = false;
  duplicadoIsLoading: boolean = false;
  
  constructor(private calculoService: CalculoService) {}
  
  ngOnInit(): void {
    this.inicializarMuestras();
    this.cargarAliList();
  }
  
  private inicializarMuestras(): void {
    const ids = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];
    
    this.muestras = ids.map(id => ({
      id,
      data: {
        diluciones: [
          { dil: -2, colonias: [null, null] },
          { dil: -3, colonias: [null, null] }
        ],
        coloniasPosibles: [null, null],
        colConfirmar: [null, null],
        coagulasa4h: [null, null],
        coagulasa24h: [null, null]
      },
      isLoading: false
    }));
  }
  
  private cargarAliList(): void {
    // TODO: Cargar lista de ALIs desde API
    this.aliList = [
      { id: 421, codigo: 'ALI-2025-00421', fechaCreacion: new Date('2025-05-15') },
      { id: 420, codigo: 'ALI-2025-00420', fechaCreacion: new Date('2025-05-14') },
      { id: 419, codigo: 'ALI-2025-00419', fechaCreacion: new Date('2025-05-13') }
    ];
  }
  
  async onCalcularMuestra(muestraId: string): Promise<void> {
    const muestra = this.muestras.find(m => m.id === muestraId);
    if (!muestra) return;
    
    muestra.isLoading = true;
    
    try {
      const resultado = await this.calculoService.calcularMuestra({
        solicitudAnalisisId: 'current-id', // TODO: Obtener del contexto
        muestraId,
        ...muestra.data
      });
      
      muestra.data = {
        ...muestra.data,
        resultado
      };
    } catch (error) {
      console.error('Error al calcular muestra:', error);
    } finally {
      muestra.isLoading = false;
    }
  }
  
  async onCalcularTodas(): Promise<void> {
    this.isCalculatingAll = true;
    
    try {
      // Calcular cada muestra en paralelo
      const promesas = this.muestras.map(muestra => 
        this.onCalcularMuestra(muestra.id)
      );
      
      await Promise.all(promesas);
      
      // Calcular duplicado si tiene ALI seleccionado
      if (this.duplicado.aliReferencia) {
        await this.onReimportar(this.duplicado.aliReferencia);
      }
    } finally {
      this.isCalculatingAll = false;
    }
  }
  
  onMuestraDataChange(index: number, data: MuestraData): void {
    this.muestras[index].data = data;
  }
  
  onAliChange(aliId: number | null): void {
    this.duplicado.aliReferencia = aliId;
    
    if (aliId) {
      this.onReimportar(aliId);
    }
  }
  
  async onReimportar(aliId: number | null): Promise<void> {
    if (!aliId) return;

    this.duplicadoIsLoading = true;

    try {
      const datosImportados = await this.calculoService.importarDuplicado(aliId, 'current-id');

      this.duplicado = {
        ...this.duplicado,
        ...datosImportados,
        advertencia: null
      };

      // Calcular resultado del duplicado
      if (this.duplicado.aliReferencia) {
        const resultado = await this.calculoService.calcularMuestra({
          solicitudAnalisisId: 'current-id',
          muestraId: 'DUP',
          diluciones: this.duplicado.diluciones,
          coloniasPosibles: this.duplicado.coloniasPosibles,
          colConfirmar: this.duplicado.colConfirmar,
          coagulasa4h: this.duplicado.coagulasa4h,
          coagulasa24h: this.duplicado.coagulasa24h
        });

        this.duplicado.resultado = resultado;
      }
    } catch (error) {
      console.error('Error al importar duplicado:', error);
      this.duplicado.advertencia = 'Error al importar datos del ALI origen';
    } finally {
      this.duplicadoIsLoading = false;
    }
  }
  
  onEditar(): void {
    // TODO: Habilitar edición manual del duplicado
    console.log('Editar duplicado manualmente');
  }
  
  onDuplicadoDataChange(data: DuplicadoData): void {
    this.duplicado = data;
  }
  
  get hayResultados(): boolean {
    return this.muestras.some(m => m.data?.resultado) || !!this.duplicado?.resultado;
  }
}
