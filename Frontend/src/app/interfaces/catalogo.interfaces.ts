export interface GenericCatalogItem {
    id?: number;
    nombre?: string;
}

// 1. Lugares Almacenamiento
export interface LugarAlmacenamiento {
    idLugar: number;
    nombreLugar: string;
    codigoLugar?: string;
}

// 2. Instrumentos
export interface Instrumento {
    idInstrumento: number;
    nombreInstrumento: string;
    codigoInstrumento: string;
}

// 3. Micropipetas
export interface Micropipeta {
    idPipeta: number;
    nombrePipeta: string;
    codigoPipeta: string;
    capacidad: string;
    esTitulo?: boolean;
}

// 4. Equipos de Laboratorio
export interface EquipoLaboratorio {
    idEquipo: number;
    nombreEquipo: string;
    codigoEquipo: string;
}

// 5. Material Siembra
export interface MaterialSiembra {
    idMaterialSiembra: number;
    nombreMaterial: string;
    detalleMedida?: string;
}

// 6. Diluyentes
export interface Diluyente {
    idDiluyente: number;
    nombreDiluyente: string;
    mililitros: number;
}

// 7. Equipos Incubacion
export interface EquipoIncubacion {
    idIncubacion: number;
    nombreEquipo: string;
    temperaturaRef: string;
}

// 8. Maestro Checklist Limpieza
export interface ItemChecklistLimpieza {
    idItem: number;
    nombreItem: string;
    defSeleccionado: number; // 1 | 0
    defBloqueado: number; // 1 | 0
}

// 9. Maestro Tipos Analisis (Control Analisis)
export interface TipoAnalisis {
    idTipoAnalisis: number;
    nombreAnalisis: string;
}

// 10. Maestro Formas Calculo
export interface FormaCalculo {
    idForma: number;
    nombreForma: string;
    defSeleccionado?: number;
    seleccionado?: boolean; // Frontend property interaction
}

// Vista Unificada (Materiales Pesado)
export interface MaterialPesado {
    id?: number; // View might return confusing names, need to check View definition or mapper.
    // Assuming View returns standard mapping
    nombre?: string;
    tipo?: string;
    esTitulo?: boolean;
}

// Usuario / Responsable
// Backend mapAnalista returns: { rut, nombreApellido, correo, rol }
export interface Responsable {
    rut: string;
    nombreApellido: string;
    correo: string;
    rol: number;
}

export interface CategoriaProducto {
    idCategoria: string;
    nombre: string;
}

export interface FormularioAnalisisCatalogo {
    idFormularioAnalisis: string;
    codigo: string;
    nombreAnalisis: string;
    area: string;
    generaTpaDefault: boolean;
}
