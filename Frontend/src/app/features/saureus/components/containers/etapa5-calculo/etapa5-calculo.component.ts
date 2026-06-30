import { Component, Input, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import {
  CalculoService,
  MuestraGridData,
  PlacaRow,
  ResultadoCalculo,
} from '../../../services/calculo.service';

export { MuestraGridData, PlacaRow, ResultadoCalculo };

function emptyPlaca(): PlacaRow {
  return { colonias24h: null, colonias48h: null, dil: null, aConfirmar: null, coag4a6h: null, coag24h: null };
}

function emptyMuestra(): MuestraGridData & { isLoading: boolean } {
  return { placaA: emptyPlaca(), placaB: emptyPlaca(), isLoading: false };
}

@Component({
  selector: 'app-etapa5-calculo',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <div class="form-card">
      <div class="form-card-header">
        <div class="form-card-title-group">
          <ion-icon name="calculator-outline" class="card-header-icon"></ion-icon>
          <h2 class="form-card-title">5. Cálculo S. Aureus (NCh 2671)</h2>
        </div>
      </div>
      <div class="form-card-body">

        <div class="control-card mb-6" *ngFor="let muestra of muestrasVisibles; let i = index">
          <p class="control-title">Muestra {{ muestra.id }}</p>

          <!-- Input grid -->
          <div class="muestra-grid-wrapper">
            <table class="muestra-grid">
              <thead>
                <tr>
                  <th class="row-label-cell"></th>
                  <th>C 24h</th>
                  <th>C 48h</th>
                  <th>D</th>
                  <th>A confirmar</th>
                  <th>Coag. 4-6h</th>
                  <th>Coag. 24h</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="row-label-cell">Placa A</td>
                  <td><input type="number" class="grid-input" [(ngModel)]="muestra.data.placaA.colonias24h" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                  <td><input type="number" class="grid-input" [(ngModel)]="muestra.data.placaA.colonias48h" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                  <td><input type="number" class="grid-input" [(ngModel)]="muestra.data.placaA.dil" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                  <td><input type="number" class="grid-input" [(ngModel)]="muestra.data.placaA.aConfirmar" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                  <td><input type="number" class="grid-input" [(ngModel)]="muestra.data.placaA.coag4a6h" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                  <td><input type="number" class="grid-input" [(ngModel)]="muestra.data.placaA.coag24h" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                </tr>
                <tr>
                  <td class="row-label-cell">Placa B</td>
                  <td><input type="number" class="grid-input" [(ngModel)]="muestra.data.placaB.colonias24h" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                  <td><input type="number" class="grid-input" [(ngModel)]="muestra.data.placaB.colonias48h" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                  <td><input type="number" class="grid-input" [(ngModel)]="muestra.data.placaB.dil" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                  <td><input type="number" class="grid-input" [(ngModel)]="muestra.data.placaB.aConfirmar" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                  <td><input type="number" class="grid-input" [(ngModel)]="muestra.data.placaB.coag4a6h" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                  <td><input type="number" class="grid-input" [(ngModel)]="muestra.data.placaB.coag24h" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Calculate button -->
          <div class="mt-4 flex justify-center">
            <button type="button" class="btn-primary" (click)="onCalcular(muestra)" [disabled]="formularioBloqueado || muestra.isLoading">
              <ion-spinner name="crescent" *ngIf="muestra.isLoading" style="width:14px;height:14px;margin-right:6px;"></ion-spinner>
              Calcular {{ muestra.id }}
            </button>
          </div>

          <!-- Results -->
          <div *ngIf="muestra.data.resultado" class="resultado-card mt-4">
            <div class="resultado-principal">
              <span class="resultado-label">N S. aureus</span>
              <span class="resultado-valor" [class.resultado-sd]="muestra.data.resultado.esSd">
                {{ muestra.data.resultado.textoReporte }}
              </span>
            </div>

            <div class="resultado-meta" *ngIf="muestra.data.resultado.sumaA !== undefined">
              <span>Σa = {{ muestra.data.resultado.sumaA }}</span>
              <span *ngIf="muestra.data.resultado.n1 !== undefined">n1 = {{ muestra.data.resultado.n1 }}</span>
              <span *ngIf="muestra.data.resultado.n2 !== undefined">n2 = {{ muestra.data.resultado.n2 }}</span>
              <span *ngIf="muestra.data.resultado.d !== undefined">d = {{ muestra.data.resultado.d }}</span>
            </div>

            <div class="resultado-caso" *ngIf="muestra.data.resultado.casoAplicado && muestra.data.resultado.casoAplicado !== 'NCh2671_porPlaca'">
              <ion-chip color="warning" style="font-size:0.75rem;">
                {{ muestra.data.resultado.casoAplicado }}
              </ion-chip>
            </div>

            <div class="resultado-advertencias" *ngIf="muestra.data.resultado.advertencias?.length">
              <div class="advertencia-item" *ngFor="let adv of muestra.data.resultado.advertencias">
                <ion-icon name="warning-outline"></ion-icon>
                <span>{{ adv }}</span>
              </div>
            </div>
          </div>

          <!-- Duplicado section (only M1) -->
          <div *ngIf="i === 0" class="duplicado-wrapper mt-6">
            <p class="duplicado-title">Duplicado (M1)</p>

            <div class="muestra-grid-wrapper">
              <table class="muestra-grid">
                <thead>
                  <tr>
                    <th class="row-label-cell"></th>
                    <th>C 24h</th>
                    <th>C 48h</th>
                    <th>D</th>
                    <th>A confirmar</th>
                    <th>Coag. 4-6h</th>
                    <th>Coag. 24h</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="row-label-cell">Placa A</td>
                    <td><input type="number" class="grid-input" [(ngModel)]="duplicado.data.placaA.colonias24h" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                    <td><input type="number" class="grid-input" [(ngModel)]="duplicado.data.placaA.colonias48h" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                    <td><input type="number" class="grid-input" [(ngModel)]="duplicado.data.placaA.dil" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                    <td><input type="number" class="grid-input" [(ngModel)]="duplicado.data.placaA.aConfirmar" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                    <td><input type="number" class="grid-input" [(ngModel)]="duplicado.data.placaA.coag4a6h" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                    <td><input type="number" class="grid-input" [(ngModel)]="duplicado.data.placaA.coag24h" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                  </tr>
                  <tr>
                    <td class="row-label-cell">Placa B</td>
                    <td><input type="number" class="grid-input" [(ngModel)]="duplicado.data.placaB.colonias24h" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                    <td><input type="number" class="grid-input" [(ngModel)]="duplicado.data.placaB.colonias48h" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                    <td><input type="number" class="grid-input" [(ngModel)]="duplicado.data.placaB.dil" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                    <td><input type="number" class="grid-input" [(ngModel)]="duplicado.data.placaB.aConfirmar" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                    <td><input type="number" class="grid-input" [(ngModel)]="duplicado.data.placaB.coag4a6h" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                    <td><input type="number" class="grid-input" [(ngModel)]="duplicado.data.placaB.coag24h" [ngModelOptions]="{standalone: true}" [disabled]="formularioBloqueado" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-4 flex justify-center">
              <button type="button" class="btn-primary" (click)="onCalcularDuplicado()" [disabled]="formularioBloqueado || duplicado.isLoading">
                <ion-spinner name="crescent" *ngIf="duplicado.isLoading" style="width:14px;height:14px;margin-right:6px;"></ion-spinner>
                Calcular Duplicado
              </button>
            </div>

            <div *ngIf="duplicado.data.resultado" class="resultado-card mt-4">
              <div class="resultado-principal">
                <span class="resultado-label">N S. aureus (Dup.)</span>
                <span class="resultado-valor" [class.resultado-sd]="duplicado.data.resultado.esSd">
                  {{ duplicado.data.resultado.textoReporte }}
                </span>
              </div>
              <div class="resultado-advertencias" *ngIf="duplicado.data.resultado.advertencias?.length">
                <div class="advertencia-item" *ngFor="let adv of duplicado.data.resultado.advertencias">
                  <ion-icon name="warning-outline"></ion-icon>
                  <span>{{ adv }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Add muestra -->
        <div class="flex justify-center mt-2" *ngIf="muestrasVisibles.length < 6 && !formularioBloqueado">
          <button type="button" class="btn-secondary" (click)="agregarMuestra()">
            + Agregar muestra
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
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
      color: #fff;
      background: #29588c;
    }
    .form-card-title-group { display: flex; align-items: center; gap: 0.75rem; }
    .card-header-icon { font-size: 1.5rem; opacity: 0.8; color: #fff; }
    .form-card-title { font-size: 1.125rem; font-weight: 600; margin: 0; font-family: 'Inter', sans-serif; }
    .form-card-body { padding: 1.5rem; background: #fff; }

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
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.5rem;
    }

    .muestra-grid-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .muestra-grid {
      width: 100%;
      min-width: 580px;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .muestra-grid th {
      padding: 0.375rem 0.5rem;
      text-align: center;
      font-weight: 600;
      color: #1e3a8a;
      background: #eff6ff;
      border: 1px solid #dbeafe;
      font-size: 0.75rem;
      white-space: nowrap;
    }
    .muestra-grid td {
      padding: 0.375rem 0.375rem;
      border: 1px solid #e2e8f0;
      background: #fff;
    }
    .row-label-cell {
      font-weight: 600;
      color: #475569;
      white-space: nowrap;
      padding: 0.375rem 0.625rem !important;
      background: #f1f5f9 !important;
      text-align: right;
      min-width: 64px;
    }
    .grid-input {
      width: 100%;
      min-width: 52px;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      padding: 0.375rem 0.375rem;
      font-size: 0.8125rem;
      text-align: center;
      outline: none;
      color: #1e293b;
      background: #fff;
      transition: border-color 0.15s;
    }
    .grid-input:focus { border-color: #2563eb; box-shadow: 0 0 0 1px #2563eb; }
    .grid-input:disabled { background: #f1f5f9; color: #94a3b8; }

    .resultado-card {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 0.625rem;
      padding: 0.875rem 1rem;
    }
    .resultado-principal {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .resultado-label { font-size: 0.8125rem; color: #0369a1; font-weight: 600; }
    .resultado-valor { font-size: 1rem; font-weight: 700; color: #0c4a6e; }
    .resultado-sd { color: #b45309; }
    .resultado-meta {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #64748b;
      flex-wrap: wrap;
    }
    .resultado-caso { margin-top: 0.5rem; }
    .resultado-advertencias { margin-top: 0.625rem; display: flex; flex-direction: column; gap: 0.25rem; }
    .advertencia-item {
      display: flex;
      align-items: flex-start;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: #92400e;
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 0.375rem;
      padding: 0.25rem 0.5rem;
    }
    .advertencia-item ion-icon { font-size: 0.875rem; flex-shrink: 0; margin-top: 1px; }

    .duplicado-wrapper {
      border-top: 2px dashed #cbd5e1;
      padding-top: 1rem;
    }
    .duplicado-title {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.625rem 1.25rem; border-radius: 0.5rem;
      font-size: 0.875rem; font-weight: 600; color: #fff;
      background: #006eb6; border: none; cursor: pointer; transition: all 0.2s;
    }
    .btn-primary:hover { background: #005a94; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-secondary {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.625rem 1.25rem; border-radius: 0.5rem;
      font-size: 0.875rem; font-weight: 600;
      border: 2px solid #29588c; color: #29588c;
      background: transparent; cursor: pointer; transition: all 0.2s;
    }
    .btn-secondary:hover { background: #29588c; color: #fff; }
  `],
  encapsulation: ViewEncapsulation.None
})
export class Etapa5CalculoComponent implements OnInit {
  @Input() formularioBloqueado = false;
  @Input() solicitudAnalisisId = '';

  private readonly ALL_IDS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

  muestras: Array<{ id: string; data: MuestraGridData; isLoading: boolean }> = [];
  muestrasVisibles: typeof this.muestras = [];

  duplicado: { data: MuestraGridData; isLoading: boolean } = {
    data: emptyMuestra(),
    isLoading: false,
  };

  private readonly calculoService = inject(CalculoService);

  ngOnInit(): void {
    this.muestras = this.ALL_IDS.map(id => ({ id, data: emptyMuestra(), isLoading: false }));
    this.muestrasVisibles = [this.muestras[0]];
  }

  agregarMuestra(): void {
    const next = this.muestrasVisibles.length;
    if (next < 6) this.muestrasVisibles.push(this.muestras[next]);
  }

  async onCalcular(muestra: typeof this.muestras[0]): Promise<void> {
    muestra.isLoading = true;
    try {
      muestra.data.resultado = await this.calculoService.calcularMuestra({
        solicitudAnalisisId: this.solicitudAnalisisId,
        muestraId: muestra.id,
        placas: [muestra.data.placaA, muestra.data.placaB],
      });
    } catch {
      // toast integration deferred
    } finally {
      muestra.isLoading = false;
    }
  }

  async onCalcularDuplicado(): Promise<void> {
    this.duplicado.isLoading = true;
    try {
      this.duplicado.data.resultado = await this.calculoService.calcularMuestra({
        solicitudAnalisisId: this.solicitudAnalisisId,
        muestraId: 'DUP',
        placas: [this.duplicado.data.placaA, this.duplicado.data.placaB],
      });
    } catch {
      // toast integration deferred
    } finally {
      this.duplicado.isLoading = false;
    }
  }
}
