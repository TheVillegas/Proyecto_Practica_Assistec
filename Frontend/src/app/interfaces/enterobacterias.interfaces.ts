export interface EntFormulario {
  idEntFormulario: string;
  idSolicitudAnalisis: string;
  etapaActual: number;
  subetapaActual: number;
  estado: string;
  rutAnalista?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EntMuestra {
  idEntMuestra: number;
  idEntFormulario: string;
  idSolicitudMuestra: string;
  numeroMuestra: string;
  esDuplicado: boolean;
  pesoMuestraTipo?: string;
  orden: number;
}

export interface EntEtapa1 {
  idEntEtapa1: number;
  idEntFormulario: string;
  codigoAli: string;
  nActa: string;
  tipoMuestra: string;
  nMuestra10g90ml?: number;
  nMuestra50g450ml?: number;
  idBalanza?: number;
  fechaInicio: string;
  horaInicio: string;
  rutAnalistaInicio: string;
  fechaHomog: string;
  horaHomog: string;
  rutAnalistaHomog: string;
  idStomacher?: number;
  tiempoHomogenizacion?: number;
  idMedioAgarVrbg: number;
  idMedioTween80?: number;
  idEstufaSembrado: number;
  placasSembrado: number;
  idMicropipeta: number;
  fechaSembrado: string;
  horaSembrado: string;
  rutAnalistaSembrado: string;
  idEstufaIncub: number;
  fechaInicioIncubacion: string;
  fechaFinIncubacion: string;
  rutAnalistaIncub: string;
  completada: boolean;
  updatedAt: string;
}

export interface EntEtapa2 {
  idEntEtapa2: number;
  idEntFormulario: string;
  fechaLectura24h: string;
  horaLectura24h: string;
  rutAnalistaLectura: string;
  idEquipoCuentaColonias: number;
  nMuestraLectura?: number;
  dilucion?: number;
  coloniasContadas?: number;
  muestras?: EntMuestraLectura[];
  controlCalidad?: EntControlCalidadAli;
  duplicadoAli?: ResultadoControlCalidad; // Legacy flat API shape
  controlPositivoBlancoAli?: ResultadoControlCalidad; // Legacy flat API shape
  controlSiembraAli?: ResultadoControlCalidad; // Legacy flat API shape
  desfavorable?: string; // Legacy flat API shape
  tablaPagina?: string; // Legacy flat API shape
  limite?: string; // Legacy flat API shape
  fechaHoraEntrega?: string; // Legacy flat API shape
  completada: boolean;
  updatedAt: string;
}

export type ResultadoControlCalidad = 'Cumple' | 'No Cumple' | '';

export interface EntControlCalidadAli {
  duplicadoAli?: ResultadoControlCalidad;
  controlPositivoBlancoAli?: ResultadoControlCalidad;
  controlSiembraAli?: ResultadoControlCalidad;
  desfavorable?: string;
  tablaPagina?: string;
  limite?: string;
  fechaHoraEntrega?: string;
}

export interface EntControlConfirmacion {
  controlPosEcoli?: string;
  controlNegPaer?: string;
  blanco?: string;
  observaciones?: string;
}

export interface EntEtapa3 {
  idEntEtapa3: number;
  idEntFormulario: string;
  fechaTraspaso?: string;
  horaTraspaso?: string;
  rutAnalistaTraspaso?: string;
  idAgarNutritivo?: number;
  idEstufaConf?: number;
  fechaLectConf?: string;
  horaLectConf?: string;
  rutAnalistaLectConf?: string;
  fechaOxidasa?: string;
  horaOxidasa?: string;
  rutAnalistaOxidasa?: string;
  reactivoOxidasa?: string;
  desaireadoAgarGlucosa?: string;
  agarGlucosa?: string;
  controlPosEcoli?: string;
  controlNegPaer?: string;
  blanco?: string;
  desfavorable?: boolean;
  tablaPagina?: string;
  limite?: string;
  fechaHoraEntrega?: string;
  muestraB?: number;
  muestraA?: number;
  d?: number;
  n1?: number;
  n2?: number;
  m?: number;
  sumaA?: number;
  observaciones?: string;
  completada: boolean;
  updatedAt: string;
}

export interface EntFormularioCompleto extends EntFormulario {
  muestras: EntMuestra[];
  etapa1?: EntEtapa1;
  etapa2?: EntEtapa2;
  etapa3?: EntEtapa3;
}

export interface EntEtapaPayload {
  completada: boolean;
  etapa: EntEtapa1Payload | EntEtapa2Payload | EntEtapa3Payload;
}

export interface EntEtapa1Payload {
  codigo_ali?: string;
  n_acta?: string;
  tipo_muestra?: string;
  n_muestra_10g_90ml?: number;
  n_muestra_50g_450ml?: number;
  fecha_inicio?: string;
  hora_inicio?: string;
  rut_analista_inicio?: string;
  fecha_homog?: string;
  hora_homog?: string;
  rut_analista_homog?: string;
  id_medio_agar_vrbg?: number;
  id_medio_tween_80?: number;
  id_estufa_sembrado?: number;
  placas_sembrado?: number;
  id_micropipeta?: number;
  fecha_sembrado?: string;
  hora_sembrado?: string;
  rut_analista_sembrado?: string;
  id_estufa_incub?: number;
  fecha_inicio_incubacion?: string;
  fecha_fin_incubacion?: string;
  rut_analista_incub?: string;
}

export interface EntEtapa2Payload {
  fecha_lectura_24h?: string;
  hora_lectura_24h?: string;
  rut_analista_lectura?: string;
  id_equipo_cuenta_colonias?: number;
  n_muestra_lectura?: number;
  dilucion?: number;
  colonias_contadas?: number;
  muestras?: EntMuestraLectura[];
  control_calidad?: EntControlCalidadAli;
}

export interface EntEtapa3Payload {
  control_pos_ecoli?: string;
  control_neg_paer?: string;
  blanco?: string;
  desfavorable?: boolean;
  tabla_pagina?: string;
  limite?: string;
  fecha_hora_entrega?: string;
  observaciones?: string;
}

// ── Multi-sample reading model (Lectura 24h) ─────────────────────────────────

export interface EntDilucionLectura {
  exponent: number;           // e.g., -1 → d = 10⁻¹ = 0.1
  coloniasA: number | null;   // C value – Placa 1
  coloniasB: number | null;   // C value – Placa 2
  confirmA: number | null;    // Legacy: A – colonies selected for confirmation, Placa 1
  confirmB: number | null;    // Legacy: A – colonies selected for confirmation, Placa 2
  confirmPosA: number | null; // Legacy: b – confirmed positive colonies, Placa 1
  confirmPosB: number | null; // Legacy: b – confirmed positive colonies, Placa 2
}

export interface EntResultadoCalculo {
  nEnterobacterias: number | null;
  ufcPorG: number | null;
  casoAplicado: string;
  operador: '=' | '<' | '>';
  esEstimado: boolean;
  incongruenciaDetectada: boolean;
  observacionIncongruencia: string | null;
}

export interface EntMuestraLectura {
  label: string;
  diluciones: EntDilucionLectura[];
  resultado?: EntResultadoCalculo;
  isLoading: boolean;
}
