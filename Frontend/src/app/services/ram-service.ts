import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReporteRAM } from '../interfaces/reporte-ram.interface';

@Injectable({
  providedIn: 'root',
})
export class RamService {
  private apiUrl = environment.apiUrl + '/ReporteRAM';

  constructor(private http: HttpClient) { }

  obtenerReporte(codigoAli: number): Observable<ReporteRAM> {
    return this.http.get<ReporteRAM>(`${this.apiUrl}/${codigoAli}`);
  }

  obtenerEstado(codigoAli: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${codigoAli}/estado`);
  }

  guardarReporte(reporte: ReporteRAM): Observable<any> {
    return this.http.post(`${this.apiUrl}/generarReporte`, reporte);
  }

  // Endpoint específico para cálculo si se usa
  calcularPreview(datosCalculo: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/calcular`, datosCalculo);
  }

  exportarExcel(codigoAli: number): Observable<Blob> {
    const url = `${environment.apiUrl}/exportar/ram`;
    return this.http.post(url, { codigoALI: codigoAli }, { responseType: 'blob' });
  }
}
