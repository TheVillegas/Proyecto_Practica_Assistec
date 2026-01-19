export interface ReporteTPA {
    codigoALI?: string | number;
    estado: 'Verificado' | 'Borrador' | 'No realizado' | 'NO_REALIZADO';
    ultimaActualizacion?: string;
    responsable?: string;

    etapa1?: {
        lugarAlmacenamiento: string;
        observaciones: string;
    };
    etapa2_manipulacion?: any[]; // Identical to page structure
    etapa3_limpieza?: {
        checklist: any[];
    };
    etapa4_retiro?: any[];
    etapa5_siembra?: {
        materiales: any[];
        equipos: any[];
        otrosEquipos: string;
        diluyentes: any[];
    };
    etapa6_cierre?: {
        firma: string | null;
        observaciones: string;
    };

    // For reading from backend (some fields might slightly differ in naming convention if not mapped 1:1, but based on AliService map, it helps)
    // Actually the page builds this object to send. 
    // The backend GET response structure might be slightly different?
    // In `reporteTPAModel.js` (Step 111), `obtenerReporteTPA` returns camelCase object similar to this.
}
