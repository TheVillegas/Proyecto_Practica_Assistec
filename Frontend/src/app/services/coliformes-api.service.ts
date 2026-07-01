import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  CalcularNmpPayload,
  CalcularNmpResponse,
  ColiFormulario,
  SaveFase1Payload,
  SaveFase2Payload,
  SaveFase3Payload,
  SaveFase35Payload,
  SaveFase4Payload,
} from '../interfaces/coliformes.interfaces';

@Injectable({
  providedIn: 'root',
})
export class ColiformesApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/formulario/coli';

  getFormulario(id: number): Observable<ColiFormulario> {
    return this.http.get<ColiFormulario>(`${this.apiUrl}/${id}`).pipe(
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }

  obtenerPorAnalisis(idAnalisis: number): Observable<{ existe: boolean; formulario: ColiFormulario }> {
    return this.http
      .get<{ existe: boolean; formulario: ColiFormulario }>(`${this.apiUrl}/por-analisis/${idAnalisis}`)
      .pipe(catchError((err: HttpErrorResponse) => this.handleError(err)));
  }

  saveFase1(id: number, payload: SaveFase1Payload, updatedAt: string): Observable<ColiFormulario> {
    return this.putFase(id, 1, {
      updated_at: updatedAt,
      completada: payload.completada,
      fase: {
        rut_analista_inicio: payload.rutAnalistaInicio || undefined,
        fecha_inicio_incubacion: payload.fechaInicioIncubacion || undefined,
        rut_analista_termino: payload.rutAnalistaTermino || undefined,
        fecha_termino_analisis: payload.fechaTerminoAnalisis || undefined,
      },
    });
  }

  saveFase2(id: number, payload: SaveFase2Payload, updatedAt: string): Observable<ColiFormulario> {
    return this.putFase(id, 2, {
      updated_at: updatedAt,
      completada: payload.completada,
      fase: {
        id_medio_caldo_lauril: payload.idMedioCaldoLauril || undefined,
        id_medio_tween_80: payload.idMedioTween80 || undefined,
        fecha_homog: payload.fechaHomog || undefined,
        rut_analista_homog: payload.rutAnalistaHomog || undefined,
        fecha_siembra: payload.fechaSiembra || undefined,
        rut_analista_siembra: payload.rutAnalistaSiembra || undefined,
        n_muestra_10g_90ml: payload.nMuestra10g90ml ?? undefined,
        n_muestra_50g_450ml: payload.nMuestra50g450ml ?? undefined,
      },
      estufas: payload.estufas,
      micropipetas: payload.micropipetas,
    });
  }

  saveFase3(id: number, payload: SaveFase3Payload, updatedAt: string): Observable<ColiFormulario> {
    return this.putFase(id, 3, {
      updated_at: updatedAt,
      completada: payload.completada,
      fase: {
        fecha_lectura_24h: payload.fechaLectura24h || undefined,
        rut_analista_24h: payload.rutAnalista24h || undefined,
        fecha_lectura_48h: payload.fechaLectura48h || undefined,
        rut_analista_48h: payload.rutAnalista48h || undefined,
      },
      submuestras: payload.submuestras,
    });
  }

  saveFase35(id: number, payload: SaveFase35Payload, updatedAt: string): Observable<ColiFormulario> {
    const c = payload.controles;
    return this.putFase(id, '3.5', {
      updated_at: updatedAt,
      completada: payload.completada,
      fase: {
        ctrlTotKAerogenes24h: c.ctControlKAerogenes24h !== 'sin_registrar' ? c.ctControlKAerogenes24h : undefined,
        ctrlTotKAerogenes48h: c.ctControlKAerogenes48h !== 'sin_registrar' ? c.ctControlKAerogenes48h : undefined,
        ctrlTotSAureus24h: c.ctControlSAureus24h !== 'sin_registrar' ? c.ctControlSAureus24h : undefined,
        ctrlTotSAureus48h: c.ctControlSAureus48h !== 'sin_registrar' ? c.ctControlSAureus48h : undefined,
        blancoTotales24h: c.ctControlBlanco24h || undefined,
        blancoTotales48h: c.ctControlBlanco48h || undefined,
        ctrlFecEColi24h: c.cfControlEColi24h !== 'sin_registrar' ? c.cfControlEColi24h : undefined,
        ctrlFecEColi48h: c.cfControlEColi48h !== 'sin_registrar' ? c.cfControlEColi48h : undefined,
        ctrlFecKAerogenes24h: c.cfControlKAerogenes24h !== 'sin_registrar' ? c.cfControlKAerogenes24h : undefined,
        ctrlFecKAerogenes48h: c.cfControlKAerogenes48h !== 'sin_registrar' ? c.cfControlKAerogenes48h : undefined,
        blancoFecales24h: c.cfControlBlanco24h || undefined,
        blancoFecales48h: c.cfControlBlanco48h || undefined,
        ctrlEcoEColi24h: c.ecControlEColi24h !== 'sin_registrar' ? c.ecControlEColi24h : undefined,
        ctrlEcoEColi48h: c.ecControlEColi48h !== 'sin_registrar' ? c.ecControlEColi48h : undefined,
        ctrlEcoKAerogenes24h: c.ecControlKAerogenes24h !== 'sin_registrar' ? c.ecControlKAerogenes24h : undefined,
        ctrlEcoKAerogenes48h: c.ecControlKAerogenes48h !== 'sin_registrar' ? c.ecControlKAerogenes48h : undefined,
        blancoEcoli24h: c.ecControlBlanco24h || undefined,
        blancoEcoli48h: c.ecControlBlanco48h || undefined,
      },
    });
  }

  saveFase4(id: number, payload: SaveFase4Payload, updatedAt: string): Observable<ColiFormulario> {
    return this.putFase(id, 4, {
      updated_at: updatedAt,
      completada: payload.completada,
      fase: {},
      submuestras: payload.submuestras,
    });
  }

  calcularNmp(id: number, payload: CalcularNmpPayload): Observable<CalcularNmpResponse> {
    return this.http
      .post<CalcularNmpResponse>(`${this.apiUrl}/${id}/calcular-nmp`, payload)
      .pipe(catchError((err: HttpErrorResponse) => this.handleError(err)));
  }

  private putFase(
    id: number,
    fase: number | string,
    body: object
  ): Observable<ColiFormulario> {
    return this.http
      .put<ColiFormulario>(`${this.apiUrl}/${id}/fase/${fase}`, body)
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
