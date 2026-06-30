export interface SauFormulario {
  idSauFormulario: string;
  idSolicitudAnalisis: string;
  etapaActual: number;
  estado: string;
  rutAnalista?: string;
  createdAt: string;
  updatedAt: string;
  muestras: SauMuestra[];
  etapa1?: SauEtapa1;
  etapa2?: SauEtapa2;
  etapa3?: SauEtapa3;
  etapa4?: SauEtapa4;
  etapa5Resultado?: SauEtapa5Resultado[];
  etapa6?: SauEtapa6;
}

export interface SauMuestra {
  idSauMuestra: number;
  numeroMuestra: string;
  esDuplicado: boolean;
  pesoMuestraTipo?: string;
  orden: number;
}

export interface SauEtapa1 {
  idSauEtapa1: number;
  fechaInicioIncubacion: string;
  rutAnalistaInicio: string;
  fechaTerminoAnalisis: string;
  rutAnalistaTermino: string;
  tiempoHomoSiembraMin: number | null;
  tiempoHomoValido: boolean | null;
  idMedioAgarBairdParker: number;
  pesoMuestraTipo: string;
  idEstufa: number;
  duplicadoAliRef: string;
  ctrlDuplicadoCumple: string;
  ctrlPositivoBlancoAli: string;
  ctrlPositivoCumple: string;
  ctrlSiembraAli: string;
  ctrlSiembraCumple: string;
  completada: boolean;
  nMuestra10g90ml?: number;
  nMuestra50g450ml?: number;
  idMicropipeta?: number;
  codigoMicropipeta?: string;
  horaHomogeneizado?: string;
  horaSiembra?: string;
}

export interface SauEtapa2 {
  ctrlSiembraSAureusUfc: number;
  ctrlPositivoSAureus: string;
  ctrlNegativoSEpiderUfc: number;
  blancoUfc: number;
  sd: number;
  fechaLectura24h: string;
  rutAnalista24h: string;
  fechaLectura48h: string;
  rutAnalista48h: string;
  completada: boolean;
}

export interface SauEtapa3 {
  fechaHoraTraspaso: string;
  rutAnalistaTraspaso: string;
  idMedioCaldoBhi: number | null;
  idEstufa: number;
  ctrlPositivoSAureus: string;
  ctrlNegativoSEpider: string;
  blanco: string;
  fechaHoraLectura: string;
  rutAnalistaLectura: string;
  observaciones: string;
  completada: boolean;
}

export interface SauEtapa4 {
  fechaHoraPrueba: string;
  rutAnalistaPrueba: string;
  codigoTubosEsteriles: string | null;
  codigoPuntas1ml: string | null;
  idMedioBacident: number | null;
  idMedioAguaEsteril: number | null;
  idMicropipeta: number;
  idEstufa: number;
  fechaLectura46h: string;
  rutAnalista46h: string;
  resultadoCoagulasa46h: string;
  ctrlPositivo46h: string;
  ctrlNegativo46h: string;
  blanco46h: string;
  fechaLectura24h: string;
  rutAnalista24h: string;
  resultadoCoagulasa24h: string;
  ctrlPositivo24h: string;
  ctrlNegativo24h: string;
  blanco24h: string;
  completada: boolean;
}

export interface SauEtapa5Resultado {
  idSauMuestra: string;
  nSAureus: number;
  ufcPorG: number;
  incongruenciaDetectada: boolean;
  observacionIncongruencia: string;
}

export interface SauEtapa6 {
  desfavorable: boolean;
  tablaPaginaReferencia: string;
  limiteNormativo: string;
  ctrlCalidadEtapa1Ok: boolean;
  fechaHoraEntrega: string;
  rutCoordinadorCierre: string;
  cerrado: boolean;
}
