export interface ColiFormulario {
  idColiFormulario: number;
  faseActual: number;
  estado: string;
  updatedAt: string;
  muestras: ColiMuestra[];
  fase1?: ColiFase1;
  fase2?: ColiFase2;
  fase3?: ColiFase3;
  fase35Controles?: ColiFase35Controles;
  fase4Resultado?: ColiFase4Resultado[];
}

export interface ColiMuestra {
  idColiMuestra: number;
  numeroMuestra: string;
  esDuplicado: boolean;
  pesoMuestraTipo: string;
  orden: number;
}

export interface ColiFase1 {
  // Which analyses are active (at least one must be true)
  ctActivo: boolean;
  cfActivo: boolean;
  ecActivo: boolean;

  // CT incubation (only if ctActivo)
  ct_rutAnalistaInicio?: string;
  ct_fechaInicio?: string;
  ct_horaInicio?: string;
  ct_rutAnalistaTermino?: string;
  ct_fechaTermino?: string;
  ct_horaTermino?: string;

  // CF incubation (only if cfActivo)
  cf_rutAnalistaInicio?: string;
  cf_fechaInicio?: string;
  cf_horaInicio?: string;
  cf_rutAnalistaTermino?: string;
  cf_fechaTermino?: string;
  cf_horaTermino?: string;

  // E.coli incubation (only if ecActivo)
  ec_rutAnalistaInicio?: string;
  ec_fechaInicio?: string;
  ec_horaInicio?: string;
  ec_rutAnalistaTermino?: string;
  ec_fechaTermino?: string;
  ec_horaTermino?: string;

  // Legacy fields kept for backend compatibility
  rutAnalistaInicio?: string;
  rutAnalistaTermino?: string;
  fechaInicioIncubacion?: string;
  fechaTerminoAnalisis?: string;
}

export interface ColiFase2 {
  idMedioCaldoLauril: number;   // FK to medios_cultivos
  idMedioTween80?: number;      // FK to medios_cultivos
  estufas: ColiFase2Estufa[];
  micropipetas: ColiFase2Micropipeta[];
}

export interface ColiFase2Estufa {
  idIncubacion: number;
}

export interface ColiFase2Micropipeta {
  idPipeta: number;
  capacidad: string;
}

export interface ColiFase3 {
  submuestras: ColiFase3Submuestra[];
}

export interface ColiFase3Submuestra {
  idColiMuestra: number;
  tipoLectura: 'totales' | 'fecales' | 'ecoli';
  dilucion: string;
  numeroTubo: number;
  presencia: boolean | null;
}

/** @deprecated Use ColiFase4Controles. Kept for backend API compatibility. */
export interface ColiFase35Controles {
  ctControlKAerogenes: string;
  ctControlSAureus: string;
  ctControlEColi: string;
  ctControlBlanco: string;
  cfControlEColi: string;
  cfControlKAerogenes: string;
  cfControlBlanco: string;
  ecControlEColi: string;
  ecControlKAerogenes: string;
  ecControlBlanco: string;
}

/** Controls section — now logically Etapa 4 in the 5-stage wizard */
export interface ColiFase4Controles {
  ctControlKAerogenes: string;
  ctControlSAureus: string;
  ctControlEColi: string;
  ctControlBlanco: string;
  cfControlEColi: string;
  cfControlKAerogenes: string;
  cfControlBlanco: string;
  ecControlEColi: string;
  ecControlKAerogenes: string;
  ecControlBlanco: string;
}

export interface ColiFase4CalidadManual {
  duplicadoAli: 'ct' | 'cf' | 'ec' | null;
  duplicadoAliCumple: boolean | null;
  controlBlancoAliCumple: boolean | null;
  desfavorable: boolean;
  desfavorableTabla?: string;
  desfavorableLimite?: number;
  desfavorableFechaEntrega?: string;
}

export interface ColiFase4Resultado {
  idColiMuestra: number;
  coliformesTotales: number;
  coliformesFecales: number;
  eColi: number;
}

export interface SaveFase1Payload {
  rutAnalistaInicio: string;
  rutAnalistaTermino: string;
  fechaInicioIncubacion?: string;
  fechaTerminoAnalisis?: string;
  completada: boolean;
}

export interface SaveFase2Payload {
  idMedioCaldoLauril: number;
  idMedioTween80?: number;
  estufas: { idIncubacion: number }[];
  micropipetas: { idPipeta: number; capacidad: string }[];
  completada: boolean;
}

export interface SaveFase3Payload {
  submuestras: ColiFase3Submuestra[];
  completada: boolean;
  fechaLectura24h?: string;
  rutAnalista24h?: string;
  fechaLectura48h?: string;
  rutAnalista48h?: string;
}

export interface SaveFase35Payload {
  controles: ColiFase35Controles;
  completada: boolean;
}

export interface SaveFase4Payload {
  submuestras: ColiFase3Submuestra[];
  completada: boolean;
}

export interface CalcularNmpMuestraPayload {
  idColiMuestra: number;
  lecturas: {
    totales: boolean[][];
    fecales: boolean[][];
    ecoli: boolean[][];
  };
}

export interface CalcularNmpPayload {
  muestras: CalcularNmpMuestraPayload[];
}

export interface CalcularNmpResponse {
  fase4Resultado: ColiFase4Resultado[];
}
