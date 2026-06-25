import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { SauFormulario } from '../interfaces/saureus.interfaces';

@Injectable({
  providedIn: 'root',
})
export class SaureusApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/formulario/sau';

  getFormulario(id: number | string): Observable<SauFormulario> {
    return this.http.get<SauFormulario>(`${this.apiUrl}/${id}`).pipe(
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }

  obtenerPorAnalisis(idAnalisis: number | string): Observable<SauFormulario> {
    return this.http
      .get<{ existe: boolean; formulario: SauFormulario }>(
        `${this.apiUrl}/por-analisis/${idAnalisis}`
      )
      .pipe(
        map((resp) => {
          if (!resp.existe) throw new Error('NOT_FOUND');
          return resp.formulario;
        }),
        catchError((err: HttpErrorResponse) => this.handleError(err))
      );
  }

  saveEtapa(
    id: number | string,
    etapa: number,
    payload: Record<string, unknown>
  ): Observable<SauFormulario> {
    return this.http
      .put<SauFormulario>(`${this.apiUrl}/${id}/etapa/${etapa}`, payload)
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
}
