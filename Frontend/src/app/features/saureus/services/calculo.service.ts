import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PlacaRow {
  colonias24h: number | null;
  colonias48h: number | null;
  dil: number | null;
  aConfirmar: number | null;
  coag4a6h: number | null;
  coag24h: number | null;
}

export interface ResultadoCalculo {
  ufc?: number | null;
  textoReporte: string;
  esSd: boolean;
  casoAplicado: string;
  sumaA?: number;
  sumaColonias?: number;
  n1?: number;
  n2?: number;
  d?: number;
  factorDilucion?: number;
  advertencias?: string[];
  detalle?: unknown[];
}

export interface MuestraGridData {
  placaA: PlacaRow;
  placaB: PlacaRow;
  resultado?: ResultadoCalculo;
}

export interface CalcularMuestraRequest {
  solicitudAnalisisId: string;
  muestraId: string;
  placas: PlacaRow[];
}

export interface ImportarDuplicadoResponse {
  aliOrigen: number;
  muestra1: {
    placaA: PlacaRow;
    placaB: PlacaRow;
  } | null;
  advertencia: string | null;
}

@Injectable({ providedIn: 'root' })
export class CalculoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/saureus`;

  calcularMuestra(req: CalcularMuestraRequest): Promise<ResultadoCalculo> {
    return firstValueFrom(
      this.http.post<ResultadoCalculo>(`${this.apiUrl}/calcular-muestra`, req)
    );
  }
}
