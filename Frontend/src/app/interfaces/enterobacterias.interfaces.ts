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
  idLoteAgarVrbgSembrado: string;
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
  nMuestraLectura: number;
  dilucion: number;
  coloniasContadas: number;
  completada: boolean;
  updatedAt: string;
}

export interface EntEtapa3 {
  idEntEtapa3: number;
  idEntFormulario: string;
  fechaTraspaso: string;
  horaTraspaso: string;
  rutAnalistaTraspaso: string;
  idAgarNutritivo: string;
  idEstufaConf: number;
  fechaLectConf: string;
  horaLectConf: string;
  rutAnalistaLectConf: string;
  fechaOxidasa: string;
  horaOxidasa: string;
  rutAnalistaOxidasa: string;
  reactivoOxidasa: string;
  desaireadoAgarGlucosa: string;
  agarGlucosa: string;
  controlPosEcoli: string;
  controlNegPaer: string;
  blanco: string;
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
  etapa: Partial<EntEtapa1> | Partial<EntEtapa2> | Partial<EntEtapa3>;
}
