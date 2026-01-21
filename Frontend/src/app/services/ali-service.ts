import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ALI } from '../interfaces/ali';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AliService {
  private apiUrl = environment.apiUrl + '/MuestraALI';

  constructor(private http: HttpClient) { }

  getMuestras(): Observable<ALI[]> {
    return this.http.get<any[]>(`${this.apiUrl}/obtenerMuestras`).pipe(
      map(rows => rows.map(row => this.mapRowToALI(row)))
    );
  }

  getMuestraPorID(id: number): Observable<ALI> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(row => this.mapRowToALI(row))
    );
  }

  agregarMuestraALI(aliMuestra: number, codigoSerna: number, observacionesCliente: string): Observable<any> {
    const body = {
      codigo_ali: aliMuestra,
      codigo_serna: codigoSerna, // Asumiendo que el backend podría usar codigo_otros o similar, ajustaremos si es necesario.
      codigo_otros: codigoSerna, // Mapeo tentativo
      observaciones_cliente: observacionesCliente,
      observaciones_generales: ''
    };
    return this.http.post(`${this.apiUrl}/crearMuestra`, body);
  }

  // Métodos auxiliares de TPA/RAM se deben manejar en sus respectivos servicios
  // Helper para mapear respuesta DB (ahora camelCase desde Backend) a Interface ALI
  private mapRowToALI(row: any): ALI {
    // El backend ahora retorna camelCase (ALIMuestra, CodigoSerna, etc.) gracias a los mappers.
    // Sin embargo, mantenemos este método por seguridad para garantizar la estructura
    // y por si algun campo necesita transformación adicional.
    return {
      ALIMuestra: row.ALIMuestra || row.CODIGO_ALI || row.codigo_ali, // Soporte híbrido temporal y PostgreRaw
      CodigoSerna: row.CodigoSerna || row.CODIGO_OTROS || row.codigo_otros,
      observacionesCliente: row.observacionesCliente || row.OBSERVACIONES_CLIENTE || row.observaciones_cliente,
      observacionesGenerales: row.observacionesGenerales || row.OBSERVACIONES_GENERALES || row.observaciones_generales,
      reporteTPA: {
        estado: row.reporteTPA?.estado || row.ESTADO_TPA || row.estado_tpa || 'No realizado'
      },
      reporteRAM: {
        estado: row.reporteRAM?.estado || row.ESTADO_RAM || row.estado_ram || 'No realizado'
      }
    };
  }

  updateObservacionesGenerales(id: number, observacionesGenerales: string): Observable<any> {
    const body = {
      codigo_ali: id,
      observaciones_generales: observacionesGenerales
    };
    return this.http.put(`${this.apiUrl}/observaciones`, body);
  }

  eliminarMuestra(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
