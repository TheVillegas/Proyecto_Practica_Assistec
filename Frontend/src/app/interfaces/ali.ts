import { ReporteRAM } from './reporte-ram.interface';
import { ReporteTPA } from './reporte-tpa.interface';

export interface ImagenObservacion {
    id_imagen?: number;     // ID de la base de datos (si ya está guardada)
    nombre: string;
    tipo: string;
    tamanio: number;
    s3_key: string;         // Referencia S3
    url?: string;           // URL firmada temporal (para visualización)
    fechaAdjunto: string;
}

export interface ALI {
    ALIMuestra: number;
    CodigoSerna: number;
    observacionesCliente: string;
    observacionesGenerales: string;
    imagenesObservaciones?: ImagenObservacion[]; // Array opcional de imágenes adjuntas

    reporteTPA: ReporteTPA;
    reporteRAM: ReporteRAM;

    //Aca irian los demas estados de los reportes proximamentes digitalizados
}
