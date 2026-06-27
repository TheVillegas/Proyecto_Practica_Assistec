/**
 * Etapa5Calculo - Componente contenedor principal para Etapa 5: Cálculo S. Aureus
 *
 * Rediseñado para usar el patrón visual del formulario S. aureus
 * (form-card, control-card, form-group, form-input) sin ion-accordion.
 */

import { Component, Input, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CalculoService, MuestraData, ResultadoCalculo } from '../../../services/calculo.service';
export { MuestraData, ResultadoCalculo };

export interface Dilucion {
  dil: number;
  colonias: [number | null, number | null];
}

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

export interface AliOption {
  id: number;
  codigo: string;
  fechaCreacion: Date;
}

@Component({
  selector: 'app-etapa5-calculo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  template: `
    <div class="form-card">
      <div class="form-card-header">
        <div class="form-card-title-group">
          <ion-icon name="calculator-outline" class="card-header-icon"></ion-icon>
          <h2 class="form-card-title">5. Cálculo S. Aureus</h2>
        </div>
      </div>
      <div class="form-card-body">

        <!-- Muestras visibles (M1 por defecto, hasta 6) -->
        <div class="control-card mb-6" *ngFor="let muestra of muestrasVisibles; let i = index">
          <p class="control-title text-blue-700 border-b border-slate-200 pb-2">
            Muestra {{ muestra.id }}
          </p>

          <!-- Recuento de Colonias -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div class="form-group">
              <label class="form-label">Placa A</label>
              <input type="number" class="form-input text-center" [(ngModel)]="muestra.data.diluciones[0].colonias[0]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
              <div class="text-[10px] text-slate-400 text-center mt-1">MNPC &gt; 250</div>
            </div>
            <div class="form-group">
              <label class="form-label">Placa B</label>
              <input type="number" class="form-input text-center" [(ngModel)]="muestra.data.diluciones[0].colonias[1]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
              <div class="text-[10px] text-slate-400 text-center mt-1">SD = 0</div>
            </div>
            <div class="form-group">
              <label class="form-label">Dilución</label>
              <input type="number" class="form-input text-center" [(ngModel)]="muestra.data.diluciones[0].dil" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
            </div>
            <div class="form-group">
              <input type="number" class="form-input text-center" [(ngModel)]="muestra.data.diluciones[1].colonias[0]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
            </div>
            <div class="form-group">
              <input type="number" class="form-input text-center" [(ngModel)]="muestra.data.diluciones[1].colonias[1]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
            </div>
            <div class="form-group">
              <input type="number" class="form-input text-center" [(ngModel)]="muestra.data.diluciones[1].dil" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
            </div>
          </div>

          <!-- Confirmación + Coagulasa -->
          <div class="mt-4">
            <div class="grid grid-cols-3 gap-4 mb-2">
              <div class="form-label text-center"></div>
              <div class="form-label text-center">Placa A</div>
              <div class="form-label text-center">Placa B</div>
            </div>
            <div class="grid grid-cols-3 gap-4 items-center mb-2">
              <div class="form-label text-center flex items-center justify-center">A confirmar</div>
              <div class="form-group">
                <input type="number" class="form-input text-center" [(ngModel)]="muestra.data.colConfirmar[0]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
              </div>
              <div class="form-group">
                <input type="number" class="form-input text-center" [(ngModel)]="muestra.data.colConfirmar[1]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4 items-center mb-2">
              <div class="form-label text-center flex items-center justify-center">Coag. 4 hrs</div>
              <div class="form-group">
                <input type="number" class="form-input text-center" [(ngModel)]="muestra.data.coagulasa4h[0]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
              </div>
              <div class="form-group">
                <input type="number" class="form-input text-center" [(ngModel)]="muestra.data.coagulasa4h[1]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4 items-center mb-2">
              <div class="form-label text-center flex items-center justify-center">Coag. 24 h</div>
              <div class="form-group">
                <input type="number" class="form-input text-center" [(ngModel)]="muestra.data.coagulasa24h[0]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
              </div>
              <div class="form-group">
                <input type="number" class="form-input text-center" [(ngModel)]="muestra.data.coagulasa24h[1]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
              </div>
            </div>
          </div>

          <!-- RESULTADOS DEL CÁLCULO -->
          <div class="mt-4 p-4 bg-white rounded-lg border border-slate-200">
            <p class="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">📈 Resultados del Cálculo</p>
            
            <div class="space-y-1 text-sm">
              <div class="flex justify-between py-1">
                <span class="text-slate-600">a (suma placas):</span>
                <span class="font-semibold text-slate-800">{{ muestra.data.resultado?.sumaA ?? '—' }}</span>
              </div>
              <div class="flex justify-between py-1">
                <span class="text-slate-600">Ʃa (total):</span>
                <span class="font-semibold text-slate-800">{{ muestra.data.resultado?.sumaA ?? '—' }}</span>
              </div>
              <div class="flex justify-between py-1">
                <span class="text-slate-600">d (dilución):</span>
                <span class="font-semibold text-slate-800">{{ factorDilucionTexto(muestra.data.resultado) || '—' }}</span>
              </div>
              
              <hr class="border-slate-200 my-2" />
              
              <div class="flex justify-between py-1" *ngIf="muestra.data.resultado?.previas !== null && muestra.data.resultado?.previas !== undefined">
                <span class="text-slate-600">Previas:</span>
                <span class="font-semibold text-slate-800">{{ muestra.data.resultado?.previas }}</span>
              </div>
              <div class="flex justify-between py-1">
                <span class="text-slate-600 font-semibold">N S. Aureus:</span>
                <span class="text-blue-700 font-bold">{{ muestra.data.resultado?.textoReporte || '—' }}</span>
              </div>
              <div class="flex justify-between py-1">
                <span class="text-slate-600">NE S. Aureus:</span>
                <span class="font-semibold text-slate-800">{{ muestra.data.resultado?.textoReporte || '—' }}</span>
              </div>
              
              <hr class="border-slate-200 my-2" />
              
              <div class="flex justify-between py-1">
                <span class="text-slate-600">Lectura usada:</span>
                <span class="font-semibold text-slate-800">{{ muestra.data.resultado?.coagulasaUsada || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Botón calcular -->
          <div class="mt-4 flex justify-center">
            <button type="button" class="btn-primary" (click)="onCalcularMuestra(muestra.id)" [disabled]="formularioBloqueado || muestra.isLoading">
              Calcular {{ muestra.id }}
            </button>
          </div>

          <!-- DUPLICADO (solo M1) -->
          <div *ngIf="i === 0" class="mt-4 p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
            <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Duplicado</p>

            <!-- ALI selector -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div class="form-group">
                <label class="form-label">ALI Duplicado</label>
                <select class="form-select" [(ngModel)]="duplicado.aliReferencia" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" (ngModelChange)="onAliChange($event)">
                  <option [ngValue]="null">Seleccionar ALI...</option>
                  <option *ngFor="let ali of aliList" [ngValue]="ali.id">{{ ali.codigo }} - {{ ali.fechaCreacion | date:'dd/MM/yyyy' }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">N° Muestra Dup.</label>
                <input type="number" class="form-input bg-slate-100" [disabled]="true" value="1" />
              </div>
            </div>

            <!-- Advertencia -->
            <div *ngIf="duplicado.advertencia" class="p-3 bg-amber-50 rounded border border-amber-200 text-amber-800 text-sm mb-3">
              {{ duplicado.advertencia }}
            </div>

            <!-- Recuento duplicado -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <div class="form-group">
                <label class="form-label">Placa A</label>
                <input type="number" class="form-input text-center" [(ngModel)]="duplicado.diluciones[0].colonias[0]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
                <div class="text-[10px] text-slate-400 text-center mt-1">MNPC &gt; 250</div>
              </div>
              <div class="form-group">
                <label class="form-label">Placa B</label>
                <input type="number" class="form-input text-center" [(ngModel)]="duplicado.diluciones[0].colonias[1]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
                <div class="text-[10px] text-slate-400 text-center mt-1">SD = 0</div>
              </div>
              <div class="form-group">
                <label class="form-label">Dilución</label>
                <input type="number" class="form-input text-center" [(ngModel)]="duplicado.diluciones[0].dil" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
              </div>
              <div class="form-group">
                <input type="number" class="form-input text-center" [(ngModel)]="duplicado.diluciones[1].colonias[0]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
              </div>
              <div class="form-group">
                <input type="number" class="form-input text-center" [(ngModel)]="duplicado.diluciones[1].colonias[1]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
              </div>
              <div class="form-group">
                <input type="number" class="form-input text-center" [(ngModel)]="duplicado.diluciones[1].dil" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
              </div>
            </div>

            <!-- Confirmación + Coagulasa duplicado -->
            <div class="mt-4">
              <div class="grid grid-cols-3 gap-4 mb-2">
                <div class="form-label text-center"></div>
                <div class="form-label text-center">Placa A</div>
                <div class="form-label text-center">Placa B</div>
              </div>
              <div class="grid grid-cols-3 gap-4 items-center mb-2">
                <div class="form-label text-center flex items-center justify-center">A confirmar</div>
                <div class="form-group">
                  <input type="number" class="form-input text-center" [(ngModel)]="duplicado.colConfirmar[0]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
                </div>
                <div class="form-group">
                  <input type="number" class="form-input text-center" [(ngModel)]="duplicado.colConfirmar[1]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
                </div>
              </div>
              <div class="grid grid-cols-3 gap-4 items-center mb-2">
                <div class="form-label text-center flex items-center justify-center">Coag. 4 hrs</div>
                <div class="form-group">
                  <input type="number" class="form-input text-center" [(ngModel)]="duplicado.coagulasa4h[0]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
                </div>
                <div class="form-group">
                  <input type="number" class="form-input text-center" [(ngModel)]="duplicado.coagulasa4h[1]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
                </div>
              </div>
              <div class="grid grid-cols-3 gap-4 items-center mb-2">
                <div class="form-label text-center flex items-center justify-center">Coag. 24 h</div>
                <div class="form-group">
                  <input type="number" class="form-input text-center" [(ngModel)]="duplicado.coagulasa24h[0]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
                </div>
                <div class="form-group">
                  <input type="number" class="form-input text-center" [(ngModel)]="duplicado.coagulasa24h[1]" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" />
                </div>
              </div>
            </div>

            <!-- RESULTADOS DEL CÁLCULO -->
            <div class="mt-4 p-4 bg-white rounded-lg border border-slate-200">
              <p class="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">📈 Resultados del Cálculo</p>
              
              <div class="space-y-1 text-sm">
                <div class="flex justify-between py-1">
                  <span class="text-slate-600">a (suma placas):</span>
                  <span class="font-semibold text-slate-800">{{ duplicado.resultado?.sumaA ?? '—' }}</span>
                </div>
                <div class="flex justify-between py-1">
                  <span class="text-slate-600">Ʃa (total):</span>
                  <span class="font-semibold text-slate-800">{{ duplicado.resultado?.sumaA ?? '—' }}</span>
                </div>
                <div class="flex justify-between py-1">
                  <span class="text-slate-600">d (dilución):</span>
                  <span class="font-semibold text-slate-800">{{ factorDilucionTexto(duplicado.resultado) || '—' }}</span>
                </div>
                
                <hr class="border-slate-200 my-2" />
                
                <div class="flex justify-between py-1" *ngIf="duplicado.resultado?.previas !== null && duplicado.resultado?.previas !== undefined">
                  <span class="text-slate-600">Previas:</span>
                  <span class="font-semibold text-slate-800">{{ duplicado.resultado?.previas }}</span>
                </div>
                <div class="flex justify-between py-1">
                  <span class="text-slate-600 font-semibold">N S. Aureus:</span>
                  <span class="text-blue-700 font-bold">{{ duplicado.resultado?.textoReporte || '—' }}</span>
                </div>
                <div class="flex justify-between py-1">
                  <span class="text-slate-600">NE S. Aureus:</span>
                  <span class="font-semibold text-slate-800">{{ duplicado.resultado?.textoReporte || '—' }}</span>
                </div>
                
                <hr class="border-slate-200 my-2" />
                
                <div class="flex justify-between py-1">
                  <span class="text-slate-600">Lectura usada:</span>
                  <span class="font-semibold text-slate-800">{{ duplicado.resultado?.coagulasaUsada || '—' }}</span>
                </div>
              </div>
            </div>

            <!-- Botón calcular duplicado -->
            <div class="mt-4 flex justify-center">
              <button type="button" class="btn-primary" (click)="onCalcularDuplicado()" [disabled]="formularioBloqueado || duplicadoIsLoading">
                Calcular Duplicado
              </button>
            </div>
          </div>
        </div>

        <!-- Agregar otra muestra -->
        <div class="flex justify-center mt-4" *ngIf="muestrasVisibles.length < 6 && !formularioBloqueado">
          <button type="button" class="btn-secondary" (click)="agregarMuestra()">
            + Agregar otra muestra
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ══════════════════════════════════════════════
       Estilos compartidos del formulario S. Aureus
       (mismos valores que form-s-aureus.page.scss)
       ══════════════════════════════════════════════ */

    .form-card {
      background: #fff;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
    }

    .form-card-header {
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #fff;
      background: #29588c;
    }

    .form-card-title-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .card-header-icon {
      font-size: 1.5rem;
      opacity: 0.8;
      color: #fff;
    }

    .form-card-title {
      font-size: 1.125rem;
      font-weight: 600;
      line-height: 1.3;
      margin: 0;
      font-family: 'Inter', sans-serif;
    }

    .form-card-body {
      padding: 1.5rem;
      background: #fff;
    }

    .control-card {
      background: #f8fafc;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .control-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e3a8a;
      margin-bottom: 0.75rem;
      font-family: 'Inter', sans-serif;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      color: #1e3a8a;
      font-weight: 500;
      font-size: 0.875rem;
      line-height: 1.25;
    }

    .form-input,
    .form-select {
      width: 100%;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      outline: none;
      transition: all 0.2s;
      color: #1e293b;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
      background: #fff;
    }

    .form-input:focus,
    .form-select:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 1px #2563eb;
    }

    .form-input.input-error {
      border-color: #ef4444;
      box-shadow: 0 0 0 1px #f87171;
    }

    .form-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      padding-right: 2rem;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #fff;
      background: #006eb6;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary:hover {
      background: #005a94;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      border: 2px solid #29588c;
      color: #29588c;
      background: transparent;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #29588c;
      color: #fff;
    }

    .btn-secondary:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `],
  encapsulation: ViewEncapsulation.None
})
export class Etapa5CalculoComponent implements OnInit {
  @Input() formularioBloqueado: boolean = false;
  @Input() solicitudAnalisisId: string = '';

  muestras: Array<{
    id: string;
    data: MuestraData;
    isLoading: boolean;
  }> = [];

  muestrasVisibles: Array<{
    id: string;
    data: MuestraData;
    isLoading: boolean;
  }> = [];

  duplicado: DuplicadoData = {
    aliReferencia: null,
    diluciones: [
      { dil: 2, colonias: [null, null] },
      { dil: 3, colonias: [null, null] }
    ],
    coloniasPosibles: [null, null],
    colConfirmar: [null, null],
    coagulasa4h: [null, null],
    coagulasa24h: [null, null]
  };

  aliList: AliOption[] = [];
  duplicadoIsLoading: boolean = false;

  private readonly calculoService = inject(CalculoService);

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
          { dil: 2, colonias: [null, null] },
          { dil: 3, colonias: [null, null] }
        ],
        coloniasPosibles: [null, null],
        colConfirmar: [null, null],
        coagulasa4h: [null, null],
        coagulasa24h: [null, null]
      },
      isLoading: false
    }));

    this.muestrasVisibles = [this.muestras[0]];
  }

  agregarMuestra(): void {
    const nextIndex = this.muestrasVisibles.length;
    if (nextIndex < 6) {
      this.muestrasVisibles.push(this.muestras[nextIndex]);
    }
  }

  private cargarAliList(): void {
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
      // Auto-set coloniasPosibles desde la primera fila: Placa A y Placa B (son C en la fórmula NCh2676)
      const coloniasPosibles: [number | null, number | null] = [
        muestra.data.diluciones[0].colonias[0],
        muestra.data.diluciones[0].colonias[1]
      ];

      const resultado = await this.calculoService.calcularMuestra({
        solicitudAnalisisId: this.solicitudAnalisisId,
        muestraId,
        ...muestra.data,
        coloniasPosibles
      });

      muestra.data.resultado = resultado;
    } catch (error) {
      // TODO: mostrar error al usuario vía toast/alert cuando se integre AlertController
      console.warn('Error en cálculo:', error);
    } finally {
      muestra.isLoading = false;
    }
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
      const datosImportados = await this.calculoService.importarDuplicado(aliId, this.solicitudAnalisisId);
      const { muestra1, advertencia } = datosImportados;

      if (muestra1 && !advertencia) {
        this.duplicado = {
          ...this.duplicado,
          aliReferencia: aliId,
          diluciones: muestra1.diluciones,
          coloniasPosibles: muestra1.coloniasPosibles,
          colConfirmar: muestra1.colConfirmar,
          coagulasa4h: muestra1.coagulasa4h,
          coagulasa24h: muestra1.coagulasa24h,
          advertencia: null
        };

        const resultado = await this.calculoService.calcularMuestra({
          solicitudAnalisisId: this.solicitudAnalisisId,
          muestraId: 'DUP',
          diluciones: this.duplicado.diluciones,
          coloniasPosibles: this.duplicado.coloniasPosibles,
          colConfirmar: this.duplicado.colConfirmar,
          coagulasa4h: this.duplicado.coagulasa4h,
          coagulasa24h: this.duplicado.coagulasa24h
        });

        this.duplicado.resultado = resultado;
      } else {
        this.duplicado = {
          ...this.duplicado,
          aliReferencia: aliId,
          diluciones: [
            { dil: 2, colonias: [null, null] },
            { dil: 3, colonias: [null, null] }
          ],
          coloniasPosibles: [null, null],
          colConfirmar: [null, null],
          coagulasa4h: [null, null],
          coagulasa24h: [null, null],
          resultado: undefined,
          advertencia: advertencia || 'No se encontraron datos de S. aureus en el ALI seleccionado'
        };
      }
    } catch (error) {
      this.duplicado.advertencia = 'Error al importar datos del ALI origen';
    } finally {
      this.duplicadoIsLoading = false;
    }
  }

  async onCalcularDuplicado(): Promise<void> {
    this.duplicadoIsLoading = true;

    try {
      // Auto-set coloniasPosibles desde la primera fila: Placa A y Placa B (igual que en muestras)
      const coloniasPosibles: [number | null, number | null] = [
        this.duplicado.diluciones[0].colonias[0],
        this.duplicado.diluciones[0].colonias[1]
      ];

      const resultado = await this.calculoService.calcularMuestra({
        solicitudAnalisisId: this.solicitudAnalisisId,
        muestraId: 'DUP',
        diluciones: this.duplicado.diluciones,
        coloniasPosibles,
        colConfirmar: this.duplicado.colConfirmar,
        coagulasa4h: this.duplicado.coagulasa4h,
        coagulasa24h: this.duplicado.coagulasa24h
      });

      this.duplicado.resultado = resultado;
    } catch (error) {
      // TODO: mostrar error al usuario vía toast/alert cuando se integre AlertController
      console.warn('Error en cálculo:', error);
    } finally {
      this.duplicadoIsLoading = false;
    }
  }

  factorDilucionTexto(resultado?: ResultadoCalculo | null): string {
    if (!resultado?.factorDilucion) return '—';
    const fd = resultado.factorDilucion;
    const exponente = Math.round(Math.log10(fd));
    return `${fd}  (10${exponente})`;
  }
}
