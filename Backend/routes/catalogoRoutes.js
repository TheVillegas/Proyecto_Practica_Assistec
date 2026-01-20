const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogoController.js');
const authMiddleware = require('../middleware/authMiddleware.js');

// Proteger todas las rutas del catálogo
router.use(authMiddleware.verifyToken);

// --- 1. LUGARES ALMACENAMIENTO ---
router.get('/lugares-almacenamiento', catalogoController.listarLugaresAlmacenamiento);
router.get('/lugares-almacenamiento/:id', catalogoController.obtenerLugarAlmacenamientoPorId);

// --- 2. INSTRUMENTOS ---
router.get('/instrumentos', catalogoController.listarInstrumentos);
router.get('/instrumentos/:id', catalogoController.obtenerInstrumentoPorId);

// --- 3. MICROPIPETAS ---
router.get('/micropipetas', catalogoController.listarMicropipetas);
router.get('/micropipetas/:id', catalogoController.obtenerMicropipetaPorId);

// --- 4. EQUIPOS DE LABORATORIO ---
router.get('/equipos-lab', catalogoController.listarEquiposLab);
router.get('/equipos-lab/:id', catalogoController.obtenerEquipoLabPorId);

// --- 5. MATERIAL SIEMBRA ---
router.get('/material-siembra', catalogoController.listarMaterialSiembra);
router.get('/material-siembra/:id', catalogoController.obtenerMaterialSiembraPorId);

// --- 6. DILUYENTES ---
router.get('/diluyentes', catalogoController.listarDiluyentes);
router.get('/diluyentes/:id', catalogoController.obtenerDiluyentePorId);

// --- 7. EQUIPOS INCUBACION ---
router.get('/equipos-incubacion', catalogoController.listarEquiposIncubacion);
router.get('/equipos-incubacion/:id', catalogoController.obtenerEquipoIncubacionPorId);

// --- 8. MAESTRO CHECKLIST LIMPIEZA ---
router.get('/checklist-limpieza', catalogoController.listarMaestroChecklistLimpieza);
router.get('/checklist-limpieza/:id', catalogoController.obtenerMaestroChecklistLimpiezaPorId);

// --- 9. MAESTRO TIPOS ANALISIS ---
router.get('/tipos-analisis', catalogoController.listarMaestroTiposAnalisis);
router.get('/tipos-analisis/:id', catalogoController.obtenerMaestroTipoAnalisisPorId);

// --- 10. MAESTRO FORMAS CALCULO ---
router.get('/formas-calculo', catalogoController.listarMaestroFormasCalculo);
router.get('/formas-calculo/:id', catalogoController.obtenerMaestroFormaCalculoPorId);

// --- VISTA UNIFICADA ---
router.get('/materiales-pesado', catalogoController.getMaterialesPesado);

module.exports = router;
