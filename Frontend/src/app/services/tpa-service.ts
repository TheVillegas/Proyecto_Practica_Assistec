import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReporteTPA } from '../interfaces/reporte-tpa.interface';

@Injectable({
    providedIn: 'root'
})
export class TpaService {
    private apiUrl = environment.apiUrl + '/ReporteTPA';

    constructor(private http: HttpClient) { }

    obtenerReporte(codigoAli: number): Observable<ReporteTPA> {
        return this.http.get<ReporteTPA>(`${this.apiUrl}/${codigoAli}`);
    }

    obtenerEstado(codigoAli: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${codigoAli}/estado`);
    }

    guardarReporte(reporte: ReporteTPA): Observable<any> {
        return this.http.post(`${this.apiUrl}/generarReporte`, reporte);
    }

    verificarReporte(codigoAli: number, datosVerificacion: { rutUsuario: number, observacionesFinales: string, firma: string }): Observable<any> {
        return this.http.put(`${this.apiUrl}/${codigoAli}/verificar`, datosVerificacion);
    }
}
