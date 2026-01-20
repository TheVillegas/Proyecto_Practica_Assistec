export interface Etapa1 {
    horaInicioHomogenizado: string;
    agarPlateCount: string; // Puede ser 'MNPC' por eso string, o number si se valida
    equipoIncubacion: number | null;
    nMuestra10gr: string | null;
    nMuestra50gr: string | null;
    horaTerminoSiembra: string;
    micropipetaUtilizada: string | null;
}

export interface Etapa2 {
    fechaInicioIncubacion: string;
    horaInicioIncubacion: string;
    responsableIncubacion: string | null;
    fechaFinIncubacion: string;
    horaFinIncubacion: string;
    responsableAnalisis: string | null;
}

export interface Etapa3Item {
    id: number;
    codigoALI: string | number | null;
    numeroMuestra: number;
    dil?: string | number; // Input text/number
    dil2?: string | number;
    numeroColonias01?: number;
    numeroColonias02?: number;
    numeroColonias03?: number;
    numeroColonias04?: number;
    resultadoRAM01?: string;
    resultadoRPES01?: string | number;

    // Resultados calculados
    promedio?: number;
    sumaColonias?: number;
    n1?: number;
    n2?: number;
    factorDilucion?: number;

    // Duplicado
    codigoALIDuplicado?: string | number;
    numeroMuestraDuplicado?: number;
    dilDuplicado01?: string | number;
    dilDuplicado02?: string | number;
    numeroColoniasDuplicado01?: number;
    numeroColoniasDuplicado02?: number;
    numeroColoniasDuplicado03?: number;
    numeroColoniasDuplicado04?: number;
    resultadoRAMDuplicado01?: string;
    resultadoRPESDuplicado01?: string | number;

    promedioDuplicado?: number;
    sumaColoniasDuplicado?: number;
    n1Duplicado?: number;
    n2Duplicado?: number;
    factorDilucionDuplicado?: number;
}

export interface Etapa4 {
    controlAmbientalPesado: number | null;
    ufc: number | null;
    horaInicio: string;
    horaFin: string;
    temperatura: number | null;
    controlUfc: number | null; // Note: In page uses 'controlUfc' but initial model had 'controlUFC'. Check usage. Page line 383: [(ngModel)]="etapa4.controlUfc"
    controlSiembraEcoli: number | null;
    blancoUfc: number | null;
}

export interface Etapa5 {
    desfavorable: string | null; // "SI" | "NO"
    tablaPagina: string | null;
    limite: string | null;
    fechaEntrega: string;
    horaEntrega: string;
    mercado: string | null;
    imagenManual: string | null; // Base64
}

export interface Etapa6 {
    duplicadoAli: string;
    analisis: string | null; // ID analysis
    duplicadoEstado: string | null; // "CUMPLE" | "NO CUMPLE"
    controlBlanco: string;
    controlBlancoEstado: string | null;
    controlSiembra: string;
    controlSiembraEstado: string | null;
}

export interface Etapa7 {
    firmaCoordinador: string | null;
    observacionesFinales: string;
    formaCalculoAnalista: any[]; // Array of selected options objects
    formaCalculoCoordinador: any;
}

export interface ReporteRAM {
    codigoALI?: string | number;
    estado: 'Verificado' | 'Borrador' | 'No realizado' | 'NO_REALIZADO';
    ultimaActualizacion?: string;
    responsable?: string;

    etapa1?: Etapa1;
    etapa2?: Etapa2;
    // Frontend structure uses a flat list for UI
    listaRepeticionesEtapa3?: Etapa3Item[]; // Not present in backend response directly, mapped manually
    // Backend structure
    etapa3_repeticiones?: any[];

    etapa4?: Etapa4;
    etapa5?: Etapa5;
    etapa6?: Etapa6;
    etapa7?: Etapa7;
}
