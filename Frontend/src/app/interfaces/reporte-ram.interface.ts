export interface ReporteRAM {
    codigoALI?: string | number;
    estado: 'Verificado' | 'Borrador' | 'No realizado' | 'NO_REALIZADO';
    ultimaActualizacion?: string;
    responsable?: string;

    etapa1?: any;
    etapa2?: any;
    listaRepeticionesEtapa3?: any[]; // Or etapa3: { repeticiones: [] } depending on backend. Page uses top level list? No, page uses `listaRepeticionesEtapa3`.
    // Backend model `reporteRAMModel.js` handles `etapa3_param` or similar. 
    // Let's assume the backend controller flattens or expects specific keys.
    // Based on `guardarReporteRAM` in general patterns:
    etapa3_calculos?: any[]; // To align with naming if possible, but page uses `listaRepeticionesEtapa3`.

    etapa4?: any;
    etapa5?: any;
    etapa6?: any;
    etapa7?: { // Cierre
        firmaCoordinador: string | null;
        observacionesFinales: string;
        formaCalculoAnalista: any[];
        formaCalculoCoordinador: any;
    };

    // For mapping, we will allow loose typing for stages temporarily or define them if strictness is needed.
    // Given the complexity and "any" usage in page, "any" is acceptable for sub-objects for now to avoid breaking changes in fields I can't see fully.
}
