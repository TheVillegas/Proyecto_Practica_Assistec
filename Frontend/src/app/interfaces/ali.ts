export interface ImagenObservacion {
    id_imagen?: number;
    nombre: string;
    tipo: string;
    tamanio: number;
    s3_key: string;
    url?: string;
    fechaAdjunto: string;
}

export interface FormularioAli {
    codigo: string;
    nombre: string;
    estado: string;
    ruta?: string;
    idSolicitudAnalisis?: string[];
}

export interface ALI {
    ALIMuestra: number;
    CodigoSerna: number;
    observacionesCliente: string;
    observacionesGenerales: string;
    imagenesObservaciones?: ImagenObservacion[];
    formularios: FormularioAli[];
}
