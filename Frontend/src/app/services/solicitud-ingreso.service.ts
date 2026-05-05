import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FormularioSeleccionadoPayload {
  id?: string | null;
  codigo: string;
  nombre: string;
  genera_tpa_default: boolean;
}

export interface SolicitudIngresoPayload {
  codigoExterno: string;
  categoria: string;
  nombreCliente: string;
  direccion: string;
  nombreSolicitante: string;
  notasCliente: string;
  fechaRecepcion: string;
  temperatura: number;
  idTermometro: number | null;
  fechaInicioMuestreo: string;
  fechaTerminoMuestreo: string;
  numeroMuestras: number;
  numeroEnvases: number;
  analistaResponsable: string;
  lugarMuestreo: string;
  instructivoMuestreo: string;
  formularios: FormularioSeleccionadoPayload[];
  idLugar: number | null;
  muestraCompartida: boolean;
  envasesSuministradosPor: string;
  observacionesLaboratorio: string;
  rutJefaArea: string;
  rutCoordinadoraRecepcion: string;
}

export interface SolicitudIngresoResponse {
  id_solicitud: string;
  numero_ali: number;
  numero_acta: string;
  codigo_externo: string;
  estado: string;
  updated_at: string;
  fecha_envio_validacion?: string;
  fecha_recepcion?: string;
  fecha_inicio_muestreo?: string;
  fecha_termino_muestreo?: string;
  categoria?: { id: string; nombre: string } | null;
  cliente?: { id: number; nombre: string; rut: string } | null;
  direccion?: { id: number; direccion: string; alias: string } | null;
  temperatura?: number;
  id_termometro?: number;
  id_lugar?: number;
  cantidad_muestras?: number;
  cant_envases?: number;
  responsable_muestreo?: string;
  lugar_muestreo?: string;
  instructivo_muestreo?: string;
  envases_suministrados_por?: string;
  muestra_compartida_quimica?: boolean;
  notas_cliente?: string;
  nombre_solicitante?: string;
  observaciones_laboratorio?: string;
  formularios_seleccionados?: FormularioSeleccionadoPayload[];
  rut_jefa_area?: string;
  rut_coordinadora_recepcion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SolicitudIngresoService {
  private readonly apiUrl = `${environment.apiUrl}/solicitud`;

  constructor(private http: HttpClient) {}

  crear(payload: SolicitudIngresoPayload): Observable<SolicitudIngresoResponse> {
    return this.http.post<SolicitudIngresoResponse>(this.apiUrl, payload);
  }

  obtener(idSolicitud: string): Observable<SolicitudIngresoResponse> {
    return this.http.get<SolicitudIngresoResponse>(`${this.apiUrl}/${idSolicitud}`);
  }

  actualizar(idSolicitud: string, payload: SolicitudIngresoPayload, updatedAt: string): Observable<SolicitudIngresoResponse> {
    return this.http.put<SolicitudIngresoResponse>(`${this.apiUrl}/${idSolicitud}`, {
      ...payload,
      updated_at: updatedAt
    });
  }

  enviarValidacion(idSolicitud: string, updatedAt: string): Observable<SolicitudIngresoResponse> {
    return this.http.post<SolicitudIngresoResponse>(`${this.apiUrl}/${idSolicitud}/enviar-validacion`, {
      updated_at: updatedAt
    });
  }
}
