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
  rutAnalistaInicio: string;
  rutAnalistaTermino: string;
  fechaInicioIncubacion?: string;
  fechaTerminoAnalisis?: string;
}

export interface ColiFase2 {
  codigoCaldoLauril: string;
  codigoTween80?: string;
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
  codigoCaldoLauril: string;
  codigoTween80?: string;
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
  tubosPositivos24h: [number, number, number];
  tubosPositivos48h: [number, number, number];
}

export interface CalcularNmpPayload {
  muestras: CalcularNmpMuestraPayload[];
}

export interface CalcularNmpResponse {
  fase4Resultado: ColiFase4Resultado[];
}
