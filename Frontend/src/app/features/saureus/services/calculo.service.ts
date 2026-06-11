import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ResultadoCalculo {
  aPlacaA?: number;
  aPlacaB?: number;
  sumaA?: number;
  ufc?: number | null;
  textoReporte: string;
  esSd: boolean;
  coagulasaUsada?: string | null;
  factorDilucion?: number;
  previas?: number | null;
  coloniasSeleccionadas?: number;
  coloniasPosiblesTotal?: number;
}

export interface MuestraData {
  diluciones: Array<{ dil: number; colonias: [number | null, number | null] }>;
  coloniasPosibles: [number | null, number | null];
  colConfirmar: [number | null, number | null];
  coagulasa4h: [number | null, number | null];
  coagulasa24h: [number | null, number | null];
  resultado?: ResultadoCalculo;
}

export interface CalcularMuestraRequest {
  solicitudAnalisisId: string;
  muestraId: string;
  diluciones: Array<{ dil: number; colonias: [number | null, number | null] }>;
  coloniasPosibles: [number | null, number | null];
  colConfirmar: [number | null, number | null];
  coagulasa4h: [number | null, number | null];
  coagulasa24h: [number | null, number | null];
}

export interface CalcularTodasRequest {
  solicitudAnalisisId: string;
  muestras: Array<MuestraData & { id: string }>;
}

export interface ImportarDuplicadoResponse {
  aliOrigen: number;
  muestra1: {
    diluciones: Array<{ dil: number; colonias: [number | null, number | null] }>;
    coloniasPosibles: [number | null, number | null];
    colConfirmar: [number | null, number | null];
    coagulasa4h: [number | null, number | null];
    coagulasa24h: [number | null, number | null];
    resultadoTexto: string;
  };
  advertencia: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CalculoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/saureus';

  async calcularMuestra(data: CalcularMuestraRequest): Promise<MuestraData['resultado']> {
    return firstValueFrom(
      this.http.post<MuestraData['resultado']>(`${this.apiUrl}/calcular-muestra`, data)
    );
  }

  async calcularTodas(data: CalcularTodasRequest): Promise<{
    resultados: Record<string, MuestraData['resultado']>;
    resultadoConsolidado: string;
    reglaAplicada: string;
  }> {
    return firstValueFrom(
      this.http.post<{
        resultados: Record<string, MuestraData['resultado']>;
        resultadoConsolidado: string;
        reglaAplicada: string;
      }>(`${this.apiUrl}/calcular-todo`, data)
    );
  }

  async importarDuplicado(
    aliOrigen: number,
    solicitudActualId: string
  ): Promise<ImportarDuplicadoResponse> {
    return firstValueFrom(
      this.http.get<ImportarDuplicadoResponse>(`${this.apiUrl}/importar-duplicado`, {
        params: { aliOrigen: aliOrigen.toString(), solicitudActualId }
      })
    );
  }
}
