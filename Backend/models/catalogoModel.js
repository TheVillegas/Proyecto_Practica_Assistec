const db = require('../config/DB.js');

const Catalogo = {};

// --- 1. LUGARES ALMACENAMIENTO ---
Catalogo.obtenerLugaresAlmacenamiento = async () => {
    const sql = 'SELECT * FROM LUGARES_ALMACENAMIENTO';
    return await db.execute(sql);
};

Catalogo.obtenerLugarAlmacenamiento_porID = async (id) => {
    const sql = 'SELECT * FROM LUGARES_ALMACENAMIENTO WHERE id_lugar = $1';
    return await db.execute(sql, [id]);
};

// --- 2. INSTRUMENTOS ---
Catalogo.obtenerInstrumentos = async () => {
    const sql = 'SELECT * FROM INSTRUMENTOS';
    return await db.execute(sql);
};

Catalogo.obtenerInstrumento_porID = async (id) => {
    const sql = 'SELECT * FROM INSTRUMENTOS WHERE id_instrumento = $1';
    return await db.execute(sql, [id]);
};

// --- 3. MICROPIPETAS ---
Catalogo.obtenerMicropipetas = async () => {
    const sql = 'SELECT * FROM MICROPIPETAS';
    return await db.execute(sql);
};

Catalogo.obtenerMicropipeta_porID = async (id) => {
    const sql = 'SELECT * FROM MICROPIPETAS WHERE id_pipeta = $1';
    return await db.execute(sql, [id]);
};

// --- 4. EQUIPOS DE LABORATORIO ---
Catalogo.obtenerEquiposLab = async () => {
    const sql = 'SELECT * FROM EQUIPOS_LAB';
    return await db.execute(sql);
};

Catalogo.obtenerEquipoLab_porID = async (id) => {
    const sql = 'SELECT * FROM EQUIPOS_LAB WHERE id_equipo = $1';
    return await db.execute(sql, [id]);
};

// --- 5. MATERIAL SIEMBRA ---
Catalogo.obtenerMaterialSiembra = async () => {
    const sql = 'SELECT * FROM MATERIAL_SIEMBRA';
    return await db.execute(sql);
};

Catalogo.obtenerMaterialSiembra_porID = async (id) => {
    const sql = 'SELECT * FROM MATERIAL_SIEMBRA WHERE id_material_siembra = $1';
    return await db.execute(sql, [id]);
};

// --- 6. DILUYENTES ---
Catalogo.obtenerDiluyentes = async () => {
    const sql = 'SELECT * FROM DILUYENTES';
    return await db.execute(sql);
};

Catalogo.obtenerDiluyente_porID = async (id) => {
    const sql = 'SELECT * FROM DILUYENTES WHERE id_diluyente = $1';
    return await db.execute(sql, [id]);
};

// --- 7. EQUIPOS INCUBACION ---
Catalogo.obtenerEquiposIncubacion = async () => {
    const sql = 'SELECT * FROM EQUIPOS_INCUBACION';
    return await db.execute(sql);
};

Catalogo.obtenerEquipoIncubacion_porID = async (id) => {
    const sql = 'SELECT * FROM EQUIPOS_INCUBACION WHERE id_incubacion = $1';
    return await db.execute(sql, [id]);
};

// --- 8. MAESTRO CHECKLIST LIMPIEZA ---
Catalogo.obtenerMaestroChecklistLimpieza = async () => {
    const sql = 'SELECT * FROM MAESTRO_CHECKLIST_LIMPIEZA';
    return await db.execute(sql);
};

Catalogo.obtenerMaestroChecklistLimpieza_porID = async (id) => {
    const sql = 'SELECT * FROM MAESTRO_CHECKLIST_LIMPIEZA WHERE id_item = $1';
    return await db.execute(sql, [id]);
};

// --- 9. MAESTRO TIPOS ANALISIS ---
Catalogo.obtenerMaestroTiposAnalisis = async () => {
    const sql = 'SELECT * FROM MAESTRO_TIPOS_ANALISIS';
    return await db.execute(sql);
};

Catalogo.obtenerMaestroTiposAnalisis_porID = async (id) => {
    const sql = 'SELECT * FROM MAESTRO_TIPOS_ANALISIS WHERE id_tipo_analisis = $1';
    return await db.execute(sql, [id]);
};

// --- 10. MAESTRO FORMAS CALCULO ---
Catalogo.obtenerMaestroFormasCalculo = async () => {
    const sql = 'SELECT * FROM MAESTRO_FORMAS_CALCULO';
    return await db.execute(sql);
};

Catalogo.obtenerMaestroFormasCalculo_porID = async (id) => {
    const sql = 'SELECT * FROM MAESTRO_FORMAS_CALCULO WHERE id_forma = $1';
    return await db.execute(sql, [id]);
};

// --- VISTA UNIFICADA ---
Catalogo.getMaterialesPesado = async () => {
    const sql = 'SELECT * FROM V_CATALOGO_UNIFICADO';
    return await db.execute(sql);
};

module.exports = Catalogo;
