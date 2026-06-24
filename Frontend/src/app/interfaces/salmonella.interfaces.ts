export interface SalMuestra {
  idSalMuestra: number;
  idSalFormulario: number;
  idSolicitudMuestra: number;
  numeroMuestra: string;
  esDuplicado: boolean;
  orden: number;
}

export interface SalLecturaFase3c {
  idSalMuestra: number;
  resultadoCaldoApt?: boolean;
  resultadoseLenito?: boolean;
  resultadoRappaport?: boolean;
  ctrlPositivoSEnteritidis?: boolean;
  ctrlNegativoKPneumoniae?: boolean;
  ctrlBlanco?: boolean;
}

export interface SalLecturaFase4b {
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
  ctrlPositivoSEnteritidis?: boolean;
  ctrlNegativoKPneumoniae?: boolean;
  ctrlBlanco?: boolean;
}

export interface SalFase1Payload {
  fechaHoraInicioIncubacion: string;
  tipoMatriz: 'Normal' | 'Polvo' | 'Chocolate';
  pesoMuestra: string;
  caldoHomogeneizacion: string;
  caldoAsignadoAuto?: string;
  horaInicioHidratacion?: string;
  horaTerminoHidratacion?: string;
  hidratacionValida?: boolean;
  completada: boolean;
}

export interface SalFase2aPayload {
  fechaSiembra: string;
  horaInicioHomo: string;
  horaTerminoHomo: string;
  horaIngresoEstufa: string;
  minutosHomoAEstufa?: number;
  alertaTiempo25min?: boolean;
  rutAnalistaResponsable: string;
  fechaTerminoAnalisis?: string;
  completada: boolean;
}

export interface SalFase2bPayload {
  codigoCaldoAptLeche: string;
  idEstufa: number;
  completada: boolean;
}

export interface SalFase2cPayload {
  descripcionCtrlAnalisis?: string;
  resultadoCtrlAnalisis?: boolean;
  ctrlPositivoBlancoAli?: string;
  resultadoCtrlPositivo?: boolean;
  ctrlSiembraAli?: string;
  resultadoCtrlSiembra?: boolean;
  completada: boolean;
}

export interface SalFase3aPayload {
  fechaTraspaso: string;
  horaLecturaCaldoApt: string;
  rutAnalistaCaldoApt: string;
  horaLecturaCaldosFinales?: string;
  rutAnalistaCaldosFinales?: string;
  completada: boolean;
}

export interface SalFase3bPayload {
  idEstufaSelenito: number;
  completada: boolean;
}

export interface SalFase3cPayload {
  lecturas: SalLecturaFase3c[];
  completada: boolean;
}

export interface SalFase4aPayload {
  fechaHoraTraspasoAgares: string;
  rutAnalistaTraspaso: string;
  codigoAgarXld: string;
  codigoAgarSs: string;
  idEstufaAgares: number;
  fechaHoraLectura24h?: string;
  rutAnalistaLectura24h?: string;
  fechaHoraLectura48h?: string;
  rutAnalistaLectura48h?: string;
  completada: boolean;
}

export interface SalFase4bPayload {
  lecturas: SalLecturaFase4b[];
  completada: boolean;
}

export interface SalFase5Payload {
  completada: boolean;
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
  fase1?: SalFase1Payload;
  fase2a?: SalFase2aPayload;
  fase2b?: SalFase2bPayload;
  fase2c?: SalFase2cPayload;
  fase3a?: SalFase3aPayload;
  fase3b?: SalFase3bPayload;
  fase3c?: SalFase3cPayload;
  fase4a?: SalFase4aPayload;
  fase4b?: SalFase4bPayload;
  fase5Resultado?: Array<{ idSalMuestra: string; resultadoFinal: string }>;
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
