import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type DashboardFamily = 'editable' | 'resubmittable' | 'under_review' | 'post_validation';

export interface DashboardQueryFilters {
  family?: DashboardFamily;
  actingRole?: number;
  assignedToMe?: boolean;
}

export interface DashboardSummaryResponse {
  summary: Record<DashboardFamily, number>;
}

export interface DashboardQueueItem {
  id_solicitud: string;
  numero_ali: number;
  codigo_externo: string;
  estado: string;
  family: DashboardFamily;
  updated_at: string;
  nombre_cliente?: string;
}

export interface DashboardQueueResponse {
  items: DashboardQueueItem[];
  summary?: Partial<Record<DashboardFamily, number>>;
}

export interface FormularioSeleccionadoPayload {
  id?: string | null;
  codigo: string;
  nombre: string;
  genera_tpa_default: boolean;
  acreditado?: boolean;
  codigo_le?: string | null;
  metodologia_norma?: string | null;
  dias_negativo?: number | null;
  dias_confirmacion?: number | null;
}

export interface AnalisisResolucionResponse {
  id_formulario_analisis: string;
  codigo_formulario: string;
  nombre_formulario: string;
  id_alcance_acreditacion: number | null;
  codigo_le: string | null;
  acreditado: boolean;
  metodologia_norma: string;
  dias_negativo: number | null;
  dias_confirmacion: number | null;
}

export interface PlazoEstimadoResponse {
  dias_negativo: number | null;
  dias_confirmacion: number | null;
  fecha_entrega_neg: string | null;
  fecha_entrega_pos: string | null;
}

export interface ValidacionRevisionState {
  aprobada: boolean;
  rut?: string | null;
  fecha?: string | null;
}

export interface SolicitudIngresoPayload {
  codigoALI: number;
  numeroActa: string;
  categoriaId: string;
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
  idEquipoAlmacenamiento?: number | null;
  muestraCompartida: boolean;
  envasesSuministradosPor: string;
  observacionesLaboratorio: string;
  analisisDerivadosSubcontratados?: string;
  rutJefaArea: string;
  rutCoordinadoraRecepcion: string;
  codigoEquipoManual?: string;
  subcategoriaId?: string;
  noAplicaMuestreo?: boolean;
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
  codigo_equipo_manual?: string;
  id_lugar?: number;
  cantidad_muestras?: number;
  cant_envases?: number;
  responsable_muestreo?: string;
  lugar_muestreo?: string;
  instructivo_muestreo?: string;
  subcategoria_id?: string;
  no_aplica_muestreo?: boolean;
  envases_suministrados_por?: string;
  muestra_compartida_quimica?: boolean;
  notas_cliente?: string;
  nombre_solicitante?: string;
  observaciones_laboratorio?: string;
  analisis_derivados_subcontratados?: string;
  formularios_seleccionados?: FormularioSeleccionadoPayload[];
  rut_jefa_area?: string;
  rut_coordinadora_recepcion?: string;
  validacion_coordinadora?: ValidacionRevisionState | null;
  validacion_jefa?: ValidacionRevisionState | null;
  fecha_envio_informe_positivo?: string;
  fecha_envio_informe_negativo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SolicitudIngresoService {
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/solicitud`;

  listar(): Observable<SolicitudIngresoResponse[]> {
    return this.http.get<SolicitudIngresoResponse[]>(this.apiUrl);
  }

  obtenerResumenDashboard(filters: DashboardQueryFilters = {}): Observable<DashboardSummaryResponse> {
    return this.http.get<DashboardSummaryResponse>(`${this.apiUrl}/summary`, {
      params: this.buildDashboardParams(filters)
    });
  }

  obtenerBandejaDashboard(filters: DashboardQueryFilters = {}): Observable<DashboardQueueResponse> {
    return this.http.get<DashboardQueueResponse>(`${this.apiUrl}/queue`, {
      params: this.buildDashboardParams(filters)
    });
  }

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

  validar(idSolicitud: string, updatedAt: string): Observable<SolicitudIngresoResponse> {
    return this.http.post<SolicitudIngresoResponse>(`${this.apiUrl}/${idSolicitud}/validar`, {
      updated_at: updatedAt
    });
  }

  rechazar(idSolicitud: string, updatedAt: string, motivo?: string): Observable<SolicitudIngresoResponse> {
    return this.http.post<SolicitudIngresoResponse>(`${this.apiUrl}/${idSolicitud}/rechazar`, {
      updated_at: updatedAt,
      motivo: motivo ?? ''
    });
  }

  resolverAnalisis(idCategoriaProducto: string, idFormularioAnalisis: string): Observable<AnalisisResolucionResponse> {
    return this.http.get<AnalisisResolucionResponse>(`${this.apiUrl}/analisis/resolver`, {
      params: {
        id_categoria_producto: idCategoriaProducto,
        id_formulario_analisis: idFormularioAnalisis
      }
    });
  }

  obtenerPlazoEstimado(codigoAli: number | string): Observable<PlazoEstimadoResponse> {
    return this.http.get<PlazoEstimadoResponse>(`${this.apiUrl}/${codigoAli}/plazo-estimado`);
  }

  private buildDashboardParams(filters: DashboardQueryFilters): Record<string, string> {
    const params: Record<string, string> = {};

    if (filters.family) {
      params['family'] = filters.family;
    }

    if (filters.actingRole != null) {
      params['actingRole'] = String(filters.actingRole);
    }

    if (filters.assignedToMe != null) {
      params['assignedToMe'] = String(filters.assignedToMe);
    }

    return params;
  }
}
