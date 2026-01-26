/**
 * Mappers para transformar respuestas de Oracle (UPPER_SNAKE_CASE)
 * a Interfaces de Frontend (camelCase).
 */

// Convierte string "HELLO_WORLD" -> "helloWorld"
const toCamelCase = (str) => {
    return str.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

// Mapea un objeto genérico (para Catálogos)
const mapGeneric = (obj) => {
    if (!obj) return null;
    const newObj = {};
    Object.keys(obj).forEach(key => {
        const newKey = toCamelCase(key);
        newObj[newKey] = obj[key];
    });
    return newObj;
};

// Mapper específico para Analista
const mapAnalista = (dbUser) => {
    if (!dbUser) return null;
    return {
        rut: dbUser.RUT_ANALISTA || dbUser.rut_analista,
        nombreApellido: dbUser.NOMBRE_APELLIDO_ANALISTA || dbUser.nombre_apellido_analista, // Frontend: nombreApellido
        correo: dbUser.CORREO_ANALISTA || dbUser.correo_analista,
        rol: (dbUser.ROL_ANALISTA !== undefined) ? dbUser.ROL_ANALISTA : dbUser.rol_analista,
        urlFoto: dbUser.URL_FOTO || dbUser.url_foto, // Added mapped field
        // No devolvemos contraseña
    };
};

// Mapper específico para Muestra ALI
const mapMuestraALI = (dbRow) => {
    if (!dbRow) return null;
    return {
        ALIMuestra: dbRow.CODIGO_ALI || dbRow.codigo_ali,           // Frontend: ALIMuestra
        CodigoSerna: dbRow.CODIGO_OTROS || dbRow.codigo_otros,        // Frontend: CodigoSerna
        observacionesCliente: dbRow.OBSERVACIONES_CLIENTE || dbRow.observaciones_cliente,
        observacionesGenerales: dbRow.OBSERVACIONES_GENERALES || dbRow.observaciones_generales,

        // Estructura anidada para reportes
        reporteTPA: {
            estado: dbRow.ESTADO_TPA || dbRow.estado_tpa || 'NO_REALIZADO'
        },
        reporteRAM: {
            estado: dbRow.ESTADO_RAM || dbRow.estado_ram || 'NO_REALIZADO'
        }
    };
};

module.exports = {
    toCamelCase,
    mapGeneric,
    mapAnalista,
    mapMuestraALI
};
