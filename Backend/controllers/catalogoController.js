const Catalogo = require('../models/catalogoModel.js');
const { mapGeneric } = require('../utils/mappers');

// Helper para manejar respuestas genéricas
const handleResponse = async (res, promise) => {
    try {
        const result = await promise;
        res.status(200).json(result.rows.map(mapGeneric));
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error interno al obtener datos del catálogo' });
    }
};

const handleResponseById = async (res, promise, notFoundMessage) => {
    try {
        const result = await promise;
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: notFoundMessage });
        }
        res.status(200).json(mapGeneric(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error interno al obtener elemento' });
    }
};

// --- 1. LUGARES ALMACENAMIENTO ---
exports.listarLugaresAlmacenamiento = (req, res) => handleResponse(res, Catalogo.obtenerLugaresAlmacenamiento());
exports.obtenerLugarAlmacenamientoPorId = (req, res) => handleResponseById(res, Catalogo.obtenerLugarAlmacenamiento_porID(req.params.id), 'Lugar no encontrado');

// --- 2. INSTRUMENTOS ---
exports.listarInstrumentos = (req, res) => handleResponse(res, Catalogo.obtenerInstrumentos());
exports.obtenerInstrumentoPorId = (req, res) => handleResponseById(res, Catalogo.obtenerInstrumento_porID(req.params.id), 'Instrumento no encontrado');

// --- 3. MICROPIPETAS ---
exports.listarMicropipetas = (req, res) => handleResponse(res, Catalogo.obtenerMicropipetas());
exports.obtenerMicropipetaPorId = (req, res) => handleResponseById(res, Catalogo.obtenerMicropipeta_porID(req.params.id), 'Micropipeta no encontrada');

// --- 4. EQUIPOS DE LABORATORIO ---
exports.listarEquiposLab = (req, res) => handleResponse(res, Catalogo.obtenerEquiposLab());
exports.obtenerEquipoLabPorId = (req, res) => handleResponseById(res, Catalogo.obtenerEquipoLab_porID(req.params.id), 'Equipo no encontrado');

// --- 5. MATERIAL SIEMBRA ---
exports.listarMaterialSiembra = (req, res) => handleResponse(res, Catalogo.obtenerMaterialSiembra());
exports.obtenerMaterialSiembraPorId = (req, res) => handleResponseById(res, Catalogo.obtenerMaterialSiembra_porID(req.params.id), 'Material no encontrado');

// --- 6. DILUYENTES ---
exports.listarDiluyentes = (req, res) => handleResponse(res, Catalogo.obtenerDiluyentes());
exports.obtenerDiluyentePorId = (req, res) => handleResponseById(res, Catalogo.obtenerDiluyente_porID(req.params.id), 'Diluyente no encontrado');

// --- 7. EQUIPOS INCUBACION ---
exports.listarEquiposIncubacion = (req, res) => handleResponse(res, Catalogo.obtenerEquiposIncubacion());
exports.obtenerEquipoIncubacionPorId = (req, res) => handleResponseById(res, Catalogo.obtenerEquipoIncubacion_porID(req.params.id), 'Equipo de incubación no encontrado');

// --- 8. MAESTRO CHECKLIST LIMPIEZA ---
exports.listarMaestroChecklistLimpieza = (req, res) => handleResponse(res, Catalogo.obtenerMaestroChecklistLimpieza());
exports.obtenerMaestroChecklistLimpiezaPorId = (req, res) => handleResponseById(res, Catalogo.obtenerMaestroChecklistLimpieza_porID(req.params.id), 'Item no encontrado');

// --- 9. MAESTRO TIPOS ANALISIS ---
exports.listarMaestroTiposAnalisis = (req, res) => handleResponse(res, Catalogo.obtenerMaestroTiposAnalisis());
exports.obtenerMaestroTipoAnalisisPorId = (req, res) => handleResponseById(res, Catalogo.obtenerMaestroTiposAnalisis_porID(req.params.id), 'Tipo analisis no encontrado');

// --- 10. MAESTRO FORMAS CALCULO ---
exports.listarMaestroFormasCalculo = (req, res) => handleResponse(res, Catalogo.obtenerMaestroFormasCalculo());
exports.obtenerMaestroFormaCalculoPorId = (req, res) => handleResponseById(res, Catalogo.obtenerMaestroFormaCalculo_porID(req.params.id), 'Forma calculo no encontrada');

// --- VISTA UNIFICADA ---
exports.getMaterialesPesado = (req, res) => handleResponse(res, Catalogo.getMaterialesPesado());
