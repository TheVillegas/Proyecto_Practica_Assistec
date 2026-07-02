import { BanoTermico, EquipoIncubacion, MaterialSiembra, Micropipeta } from './catalogo.interfaces';
import { MedioCultivo } from '../services/medios-cultivos.service';

// ============================================================
// LECTURA (read) — formas que devuelve el GET (camelCase, Prisma)
// ============================================================

export interface SalFase3cLectura {
  idSalFase3cLectura?: number;
  idSalMuestra: number;
  resultadoCaldoApt?: boolean;
  resultadoseLenito?: boolean;
  resultadoRappaport?: boolean;
  ctrlPositivoSEnteritidis?: boolean;
  ctrlNegativoKPneumoniae?: boolean;
  ctrlBlanco?: boolean;
}

export interface SalFase4bLectura {
  idSalFase4bLectura?: number;
  idSalMuestra: number;
  idSalFase4a: number;
  resXld24hSelenito?: string;
  resSs24hSelenito?: string;
  resXld48hSelenito?: string;
  resSs48hSelenito?: string;
  resXld24hRappaport?: string;
  resSs24hRappaport?: string;
  resXld48hRappaport?: string;
  resSs48hRappaport?: string;
  ctrlPositivoSEnteritidis?: string;
  ctrlNegativoKPneumoniae?: string;
  ctrlBlanco?: string;
}

export interface SalMuestra {
  idSalMuestra: number;
  idSalFormulario: number;
  idSolicitudMuestra: number;
  numeroMuestra: string;
  esDuplicado: boolean;
  orden: number;
  fase3cLecturas?: SalFase3cLectura[];
  fase4bLecturas?: SalFase4bLectura[];
}

export interface SalFase1 {
  idSalFase1?: number;
  fechaHoraInicioIncubacion: string;
  tipoMatriz: 'Normal' | 'Polvo' | 'Chocolate';
  pesoMuestra: string;
  idMedioCaldoHomogeneizacion: number;
  medioCaldoHomogeneizacion?: MedioCultivo;
  caldoAsignadoAuto?: number;
  horaInicioHidratacion?: string;
  horaTerminoHidratacion?: string;
  hidratacionValida?: boolean;
  completada: boolean;
  updatedAt?: string;
}

export interface SalFase2a {
  fechaSiembra: string;
  horaInicioHomo: string;
  horaTerminoHomo: string;
  horaIngresoEstufa: string;
  minutosHomoAEstufa?: number;
  alertaTiempo25min?: boolean;
  rutAnalistaResponsable: string;
  fechaTerminoAnalisis?: string;
  completada: boolean;
  updatedAt?: string;
}

export interface SalFase2bTweenPipeta {
  idMaterial: number;
  material?: MaterialSiembra;
}

export interface SalFase2bMicropipeta {
  idPipeta: number;
  micropipeta?: Micropipeta;
}

export interface SalFase2b {
  idMedioCaldo: number;
  volumenCaldo?: string;
  idEstufa: number;
  idBano?: number;
  medioCaldo?: MedioCultivo;
  estufa?: EquipoIncubacion;
  bano?: BanoTermico;
  tweenPipetas?: SalFase2bTweenPipeta[];
  micropipetas?: SalFase2bMicropipeta[];
  completada: boolean;
  updatedAt?: string;
}

export interface SalFase2c {
  descripcionCtrlAnalisis?: string;
  resultadoCtrlAnalisis?: boolean;
  ctrlPositivoBlancoAli?: string;
  resultadoCtrlPositivo?: boolean;
  ctrlSiembraAli?: string;
  resultadoCtrlSiembra?: boolean;
  desfavorable?: boolean;
  tablaPagina?: string;
  limite?: string;
  fechaHoraEntrega?: string;
  completada: boolean;
  updatedAt?: string;
}

export interface SalFase3a {
  fechaTraspaso: string;
  horaLecturaCaldoApt: string;
  rutAnalistaCaldoApt: string;
  horaLecturaCaldosFinales?: string;
  rutAnalistaCaldosFinales?: string;
  completada: boolean;
  updatedAt?: string;
}

export interface SalFase3bPipeta {
  idMaterial: number;
  tipoMaterial: string;
  material?: MaterialSiembra;
}

export interface SalFase3bMicropipeta {
  idPipeta: number;
  micropipeta?: Micropipeta;
}

export interface SalFase3b {
  idEstufaSelenito?: number;
  idBanoSelenito?: number;
  idEstufaRappaport?: number;
  idBanoRappaport?: number;
  estufaSelenito?: EquipoIncubacion;
  banoSelenito?: BanoTermico;
  estufaRappaport?: EquipoIncubacion;
  banoRappaport?: BanoTermico;
  pipetas?: SalFase3bPipeta[];
  micropipetas?: SalFase3bMicropipeta[];
  completada: boolean;
  updatedAt?: string;
}

export interface SalFase4a {
  fechaHoraTraspasoAgares: string;
  rutAnalistaTraspaso: string;
  idMedioAgarXld: number;
  idMedioAgarSs: number;
  idEstufaAgares: number;
  idBanoAgares?: number;
  medioAgarXld?: MedioCultivo;
  medioAgarSs?: MedioCultivo;
  estufaAgares?: EquipoIncubacion;
  banoAgares?: BanoTermico;
  fechaHoraLectura24h?: string;
  rutAnalistaLectura24h?: string;
  fechaHoraLectura48h?: string;
  rutAnalistaLectura48h?: string;
  completada: boolean;
  updatedAt?: string;
}

export interface SalFormulario {
  idSalFormulario: number;
  idSolicitudAnalisis: number;
  faseActual: number;
  estado: string;
  rutAnalista?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalFormularioCompleto extends SalFormulario {
  muestras: SalMuestra[];
  fase1?: SalFase1;
  fase2a?: SalFase2a;
  fase2b?: SalFase2b;
  fase2c?: SalFase2c;
  fase3a?: SalFase3a;
  fase3b?: SalFase3b;
  fase4a?: SalFase4a;
  fase5Resultado?: Array<{ idSalMuestra: string; resultadoFinal: string }>;
}

// ============================================================
// ESCRITURA (write) — payloads del PUT /formulario/sal/:id/fase/:fase
// Los nombres de campo van en snake_case porque los valida Zod
// directamente contra `req.body` (sin capa de conversion camelCase
// -> snake_case en el backend). Ver AssisTec API/src/validators/sal.schema.js
// y src/middleware/validateForm.js (hace `req.body = result.data`).
// ============================================================

export interface SalFase1Payload {
  fecha_hora_inicio_incubacion: string;
  tipo_matriz: 'Normal' | 'Polvo' | 'Chocolate';
  peso_muestra: string;
  id_medio_caldo_homogeneizacion: number;
  caldo_asignado_auto?: number;
  hora_inicio_hidratacion?: string;
  hora_termino_hidratacion?: string;
  hidratacion_valida?: boolean;
  completada: boolean;
}

export interface SalFase2aPayload {
  fecha_siembra: string;
  hora_inicio_homo: string;
  hora_termino_homo: string;
  hora_ingreso_estufa: string;
  minutos_homo_a_estufa?: number;
  alerta_tiempo_25min?: boolean;
  rut_analista_responsable: string;
  fecha_termino_analisis?: string;
  completada: boolean;
}

export interface SalTweenPipetaPayload {
  id_material: number;
}

export interface SalMicropipetaPayload {
  id_pipeta: number;
}

export interface SalFase2bPayload {
  id_medio_caldo: number;
  volumen_caldo?: string;
  id_estufa: number;
  id_bano?: number;
  completada: boolean;
}

export interface SalFase2cPayload {
  descripcion_ctrl_analisis?: string;
  resultado_ctrl_analisis?: boolean;
  ctrl_positivo_blanco_ali?: string;
  resultado_ctrl_positivo?: boolean;
  ctrl_siembra_ali?: string;
  resultado_ctrl_siembra?: boolean;
  desfavorable?: boolean;
  tabla_pagina?: string;
  limite?: string;
  fecha_hora_entrega?: string;
  completada: boolean;
}

export interface SalFase3aPayload {
  fecha_traspaso: string;
  hora_lectura_caldo_apt: string;
  rut_analista_caldo_apt: string;
  hora_lectura_caldos_finales?: string;
  rut_analista_caldos_finales?: string;
  completada: boolean;
}

export interface SalPipetaPayload {
  id_material: number;
  tipo_material: string;
}

export interface SalFase3bPayload {
  id_estufa_selenito?: number;
  id_bano_selenito?: number;
  id_estufa_rappaport?: number;
  id_bano_rappaport?: number;
  completada: boolean;
}

export interface SalLecturaFase3cPayload {
  id_sal_muestra: number;
  resultado_caldo_apt?: boolean;
  resultado_selenito?: boolean;
  resultado_rappaport?: boolean;
  ctrl_positivo_s_enteritidis?: boolean;
  ctrl_negativo_k_pneumoniae?: boolean;
  ctrl_blanco?: boolean;
}

export interface SalFase3cPayload {
  lecturas: SalLecturaFase3cPayload[];
  completada: boolean;
}

export interface SalFase4aPayload {
  fecha_hora_traspaso_agares: string;
  rut_analista_traspaso: string;
  id_medio_agar_xld: number;
  id_medio_agar_ss: number;
  id_estufa_agares: number;
  id_bano_agares?: number;
  fecha_hora_lectura_24h?: string;
  rut_analista_lectura_24h?: string;
  fecha_hora_lectura_48h?: string;
  rut_analista_lectura_48h?: string;
  completada: boolean;
}

export interface SalLecturaFase4bPayload {
  id_sal_muestra: number;
  id_sal_fase4a: number;
  res_xld_24h_selenito?: string;
  res_ss_24h_selenito?: string;
  res_xld_48h_selenito?: string;
  res_ss_48h_selenito?: string;
  res_xld_24h_rappaport?: string;
  res_ss_24h_rappaport?: string;
  res_xld_48h_rappaport?: string;
  res_ss_48h_rappaport?: string;
  ctrl_positivo_s_enteritidis?: boolean;
  ctrl_negativo_k_pneumoniae?: boolean;
  ctrl_blanco?: boolean;
}

export interface SalFase4bPayload {
  lecturas: SalLecturaFase4bPayload[];
  completada: boolean;
}

export interface SalFase5Payload {
  completada: boolean;
}

export type SalFasePayload =
  | SalFase1Payload
  | SalFase2aPayload
  | SalFase2bPayload
  | SalFase2cPayload
  | SalFase3aPayload
  | SalFase3bPayload
  | SalFase3cPayload
  | SalFase4aPayload
  | SalFase4bPayload
  | SalFase5Payload;
