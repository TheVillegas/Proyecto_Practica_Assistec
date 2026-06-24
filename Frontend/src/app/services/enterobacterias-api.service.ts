import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  EntEtapaPayload,
  EntFormularioCompleto
} from '../interfaces/enterobacterias.interfaces';

@Injectable({
  providedIn: 'root',
})
export class EnterobacteriasApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/formulario/ent';

  obtenerPorAnalisis(idAnalisis: number): Observable<{ existe: boolean; formulario: EntFormularioCompleto | null }> {
    return this.http
      .get<{ existe: boolean; formulario: EntFormularioCompleto | null }>(
        `${this.apiUrl}/por-analisis/${idAnalisis}`
      )
      .pipe(catchError((err: HttpErrorResponse) => this.handleError(err)));
  }

  obtener(idFormulario: number): Observable<EntFormularioCompleto> {
    return this.http
      .get<EntFormularioCompleto>(`${this.apiUrl}/${idFormulario}`)
      .pipe(catchError((err: HttpErrorResponse) => this.handleError(err)));
  }

  guardarEtapa(
    idFormulario: number,
    etapa: 1 | 2 | 3,
    payload: EntEtapaPayload,
    updatedAt: string
  ): Observable<EntFormularioCompleto> {
    const body = {
      updated_at: updatedAt,
      completada: payload.completada,
      etapa: payload.etapa,
    };

    return this.http
      .put<EntFormularioCompleto>(`${this.apiUrl}/${idFormulario}/etapa/${etapa}`, body)
      .pipe(catchError((err: HttpErrorResponse) => this.handleError(err)));
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    return throwError(() => err);
  }
}
