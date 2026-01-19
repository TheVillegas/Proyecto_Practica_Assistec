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
        rut: dbUser.RUT_ANALISTA,
        nombreApellido: dbUser.NOMBRE_APELLIDO_ANALISTA, // Frontend: nombreApellido
        correo: dbUser.CORREO_ANALISTA,
        rol: dbUser.ROL_ANALISTA,
        // No devolvemos contraseña
    };
};

// Mapper específico para Muestra ALI
const mapMuestraALI = (dbRow) => {
    if (!dbRow) return null;
    return {
        ALIMuestra: dbRow.CODIGO_ALI,           // Frontend: ALIMuestra
        CodigoSerna: dbRow.CODIGO_OTROS,        // Frontend: CodigoSerna
        observacionesCliente: dbRow.OBSERVACIONES_CLIENTE,
        observacionesGenerales: dbRow.OBSERVACIONES_GENERALES,

        // Estructura anidada para reportes
        reporteTPA: {
            estado: dbRow.ESTADO_TPA || 'NO_REALIZADO'
        },
        reporteRAM: {
            estado: dbRow.ESTADO_RAM || 'NO_REALIZADO'
        }
    };
};

module.exports = {
    toCamelCase,
    mapGeneric,
    mapAnalista,
    mapMuestraALI
};
