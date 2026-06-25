import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer, EMPTY } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ColiFormulario,
  SaveFase1Payload,
  SaveFase2Payload,
  SaveFase3Payload,
  SaveFase35Payload,
  SaveFase4Payload,
  ColiFase3Submuestra,
} from '../interfaces/coliformes.interfaces';
import { BloqueTabla } from '../pages/form-coliformes/form-coliformes.page';

@Injectable({
  providedIn: 'root',
})
export class ColiformesApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/coliformes';

  getFormulario(id: number): Observable<ColiFormulario> {
    return this.http.get<ColiFormulario>(`${this.apiUrl}/${id}`).pipe(
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }

  /** Obtener formulario por ID de solicitud de análisis (desde ALI card) */
  obtenerPorAnalisis(idAnalisis: number): Observable<ColiFormulario> {
    return this.http.get<{ existe: boolean; formulario: ColiFormulario }>(`${this.apiUrl}/por-analisis/${idAnalisis}`).pipe(
      map(resp => {
        if (!resp.existe) throw new Error('NOT_FOUND');
        return resp.formulario;
      }),
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }

  saveFase1(id: number, payload: SaveFase1Payload): Observable<ColiFormulario> {
    return this.putFase(id, 1, payload);
  }

  saveFase2(id: number, payload: SaveFase2Payload): Observable<ColiFormulario> {
    return this.putFase(id, 2, payload);
  }

  saveFase3(id: number, payload: SaveFase3Payload): Observable<ColiFormulario> {
    return this.putFase(id, 3, payload);
  }

  saveFase35(id: number, payload: SaveFase35Payload): Observable<ColiFormulario> {
    return this.putFase(id, 35, payload);
  }

  saveFase4(id: number, payload: SaveFase4Payload): Observable<ColiFormulario> {
    return this.putFase(id, 4, payload);
  }

  private putFase(
    id: number,
    fase: number,
    payload: unknown
  ): Observable<ColiFormulario> {
    return this.http
      .put<ColiFormulario>(`${this.apiUrl}/${id}/fase/${fase}`, payload)
      .pipe(
        retry({
          count: 1,
          delay: (err: HttpErrorResponse) => {
            if (err.status === 409) return throwError(() => err);
            return timer(2000);
          },
        }),
        catchError((err: HttpErrorResponse) => this.handleError(err))
      );
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    return throwError(() => err);
  }

  mapPresencia(valor: string): boolean | null {
    if (valor === 'positivo') return true;
    if (valor === 'negativo') return false;
    return null;
  }

  mapSubmuestrasToPayload(
    tabla: BloqueTabla,
    tiempo: number
  ): ColiFase3Submuestra[] {
    const submuestras: ColiFase3Submuestra[] = [];
    const diluciones: Array<'1ml' | '0.1ml' | '0.01ml'> = [
      '1ml',
      '0.1ml',
      '0.01ml',
    ];

    tabla.entradas.forEach((entrada) => {
      const idColiMuestra = Number(entrada.id) || 0;
      diluciones.forEach((dilucion) => {
        entrada.submuestras[dilucion].forEach((valor, idx) => {
          submuestras.push({
            idColiMuestra,
            tipoLectura: this.resolveTipoLectura(entrada.label, tiempo),
            dilucion,
            numeroTubo: idx + 1,
            presencia: this.mapPresencia(valor),
          });
        });
      });
    });

    return submuestras;
  }

  private resolveTipoLectura(
    label: string,
    _tiempo: number
  ): 'totales' | 'fecales' | 'ecoli' {
    const lower = label.toLowerCase();
    if (lower.includes('fecal')) return 'fecales';
    if (lower.includes('coli') || lower.includes('ecoli')) return 'ecoli';
    return 'totales';
  }
}
