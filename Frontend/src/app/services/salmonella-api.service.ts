import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  SalFormularioCompleto,
  SalFasePayload,
  SalFase3cPayload,
  SalFase4bPayload
} from '../interfaces/salmonella.interfaces';

@Injectable({
  providedIn: 'root',
})
export class SalmonellaApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/formulario/sal';

  obtenerPorAnalisis(idAnalisis: number): Observable<{ existe: boolean; formulario: SalFormularioCompleto | null }> {
    return this.http
      .get<{ existe: boolean; formulario: SalFormularioCompleto | null }>(
        `${this.apiUrl}/por-analisis/${idAnalisis}`
      )
      .pipe(catchError((err: HttpErrorResponse) => this.handleError(err)));
  }

  obtener(idFormulario: number): Observable<SalFormularioCompleto> {
    return this.http
      .get<SalFormularioCompleto>(`${this.apiUrl}/${idFormulario}`)
      .pipe(catchError((err: HttpErrorResponse) => this.handleError(err)));
  }

  guardarFase(
    idFormulario: number,
    fase: number,
    payload: SalFasePayload,
    updatedAt: string,
    extra?: Record<string, unknown>
  ): Observable<SalFormularioCompleto> {
    const body: Record<string, unknown> = {
      updated_at: updatedAt,
      completada: payload.completada,
    };

    if (fase === 2) {
      body['fase2a'] = payload;
    } else if (fase === 7 || fase === 9) {
      body['lecturas'] = (payload as SalFase3cPayload | SalFase4bPayload).lecturas;
    } else {
      body['fase'] = payload;
    }

    // Fase 3 (tween_pipetas/micropipetas) y fase 6 (pipetas/micropipetas)
    // llevan arreglos adicionales fuera del objeto `fase`.
    if (extra) {
      Object.assign(body, extra);
    }

    return this.http
      .put<SalFormularioCompleto>(`${this.apiUrl}/${idFormulario}/fase/${fase}`, body)
      .pipe(catchError((err: HttpErrorResponse) => this.handleError(err)));
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    return throwError(() => err);
  }
}
