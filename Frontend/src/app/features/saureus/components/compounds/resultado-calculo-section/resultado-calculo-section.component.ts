/**
 * ResultadoCalculoSection - Componente compuesto para panel de resultados calculados
 * 
 * Muestra: a (suma placas), Σa, d, previas, N S. Aureus, NE, lectura usada
 * 
 * Uso:
 * <app-resultado-calculo-section
 *   [resultado]="resultadoCalculo">
 * </app-resultado-calculo-section>
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResultadoBadgeComponent } from '../../atoms/resultado-badge/resultado-badge.component';

export interface ResultadoCalculo {
  aPlacaA?: number;
  aPlacaB?: number;
  sumaA?: number;
  ufc?: number | null;
  textoReporte: string;
  esSd: boolean;
  coagulasaUsada?: string | null;
  factorDilucion?: number;
  coloniasSeleccionadas?: number;
  coloniasPosiblesTotal?: number;
}

@Component({
  selector: 'app-resultado-calculo-section',
  standalone: true,
  imports: [CommonModule, ResultadoBadgeComponent],
  template: `
    <div class="resultado-section">
      <h4 class="section-title">
        <span class="section-icon">📈</span>
        Resultados del cálculo
      </h4>
      
      <div class="resultado-content" *ngIf="resultado; else sinResultado">
        <!-- Cálculo por placa -->
        <div class="calc-row">
          <span class="calc-label">Placa A: a =</span>
          <span class="calc-value">{{ resultado.aPlacaA ?? '—' }}</span>
        </div>
        <div class="calc-row">
          <span class="calc-label">Placa B: a =</span>
          <span class="calc-value">{{ resultado.aPlacaB ?? '—' }}</span>
        </div>
        
        <div class="calc-divider"></div>
        
        <!-- Suma y dilución -->
        <div class="calc-row">
          <span class="calc-label">a (suma placas):</span>
          <span class="calc-value font-bold">{{ resultado.sumaA ?? '—' }}</span>
        </div>
        <div class="calc-row">
          <span class="calc-label">Ʃa (total):</span>
          <span class="calc-value font-bold">{{ resultado.sumaA ?? '—' }}</span>
        </div>
        <div class="calc-row">
          <span class="calc-label">d (dilución):</span>
          <span class="calc-value">{{ formatDilucion(resultado.factorDilucion) }}</span>
        </div>
        
        <div class="calc-divider"></div>
        
        <!-- Previas (si aplica) -->
        <div class="calc-row" *ngIf="resultado.coloniasSeleccionadas && resultado.coloniasPosiblesTotal">
          <span class="calc-label">Previas:</span>
          <span class="calc-value">
            ({{ resultado.coloniasSeleccionadas }} ÷ {{ resultado.coloniasPosiblesTotal }}) × {{ resultado.sumaA }} = {{ calcularPrevias() }}
          </span>
        </div>
        
        <!-- Resultado final -->
        <div class="calc-row resultado-final">
          <span class="calc-label">N S. Aureus:</span>
          <app-resultado-badge
            [status]="getBadgeStatus()"
            [text]="resultado.textoReporte">
          </app-resultado-badge>
        </div>
        
        <!-- NE -->
        <div class="calc-row">
          <span class="calc-label">NE S. Aureus:</span>
          <span class="calc-value">{{ resultado.textoReporte }}</span>
        </div>
        
        <div class="calc-divider"></div>
        
        <!-- Lectura usada -->
        <div class="calc-row">
          <span class="calc-label">Lectura usada:</span>
          <span class="calc-value">{{ resultado.coagulasaUsada ?? 'SD' }}</span>
        </div>
      </div>
      
      <ng-template #sinResultado>
        <div class="sin-resultado">
          <span class="sin-resultado-texto">Sin calcular</span>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .resultado-section {
      padding: 1rem;
      background-color: #f0fdf4;
      border-radius: 0.5rem;
      border: 1px solid #bbf7d0;
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1rem 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #166534;
    }
    
    .section-icon {
      font-size: 1rem;
    }
    
    .resultado-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .calc-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }
    
    .calc-label {
      color: #475569;
    }
    
    .calc-value {
      color: #1e293b;
      font-family: monospace;
    }
    
    .font-bold {
      font-weight: 700;
    }
    
    .calc-divider {
      height: 1px;
      background-color: #d1fae5;
      margin: 0.5rem 0;
    }
    
    .resultado-final {
      padding: 0.5rem;
      background-color: white;
      border-radius: 0.375rem;
      border: 1px solid #bbf7d0;
    }
    
    .sin-resultado {
      padding: 2rem;
      text-align: center;
      color: #94a3b8;
      font-style: italic;
    }
  `]
})
export class ResultadoCalculoSectionComponent {
  @Input() resultado: ResultadoCalculo | null = null;
  
  formatDilucion(factor: number | undefined): string {
    if (!factor) return '—';
    
    const exponent = Math.log10(factor);
    const superscripts: Record<string, string> = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };
    
    const absExp = Math.abs(exponent);
    const expStr = absExp.toString().split('').map(d => superscripts[d]).join('');
    const sign = exponent < 0 ? '⁻' : '';
    
    return `10${sign}${expStr} (${factor})`;
  }
  
  calcularPrevias(): number | null {
    if (!this.resultado) return null;
    
    const { coloniasSeleccionadas, coloniasPosiblesTotal, sumaA } = this.resultado;
    
    if (!coloniasSeleccionadas || !coloniasPosiblesTotal || !sumaA) return null;
    
    return (coloniasSeleccionadas / coloniasPosiblesTotal) * sumaA;
  }
  
  getBadgeStatus(): 'pending' | 'calculated' | 'sd' | 'warning' {
    if (!this.resultado) return 'pending';
    
    if (this.resultado.esSd) return 'sd';
    
    if (this.resultado.ufc && this.resultado.ufc < 10) return 'warning';
    
    return 'calculated';
  }
}
