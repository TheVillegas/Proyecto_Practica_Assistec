const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogoController.js');
const authMiddleware = require('../middleware/authMiddleware.js');

// Proteger todas las rutas del catálogo
router.use(authMiddleware);

// --- 1. LUGARES ALMACENAMIENTO ---
router.get('/lugares-almacenamiento', catalogoController.listarLugaresAlmacenamiento);
router.get('/lugares-almacenamiento/:id', catalogoController.obtenerLugarAlmacenamientoPorId);
router.post('/lugares-almacenamiento', catalogoController.crearLugarAlmacenamiento);
router.put('/lugares-almacenamiento/:id', catalogoController.actualizarLugarAlmacenamiento);
router.delete('/lugares-almacenamiento/:id', catalogoController.eliminarLugarAlmacenamiento);

// --- 2. INSTRUMENTOS ---
router.get('/instrumentos', catalogoController.listarInstrumentos);
router.get('/instrumentos/:id', catalogoController.obtenerInstrumentoPorId);
router.post('/instrumentos', catalogoController.crearInstrumento);
router.put('/instrumentos/:id', catalogoController.actualizarInstrumento);
router.delete('/instrumentos/:id', catalogoController.eliminarInstrumento);

// --- 3. MICROPIPETAS ---
router.get('/micropipetas', catalogoController.listarMicropipetas);
router.get('/micropipetas/:id', catalogoController.obtenerMicropipetaPorId);
router.post('/micropipetas', catalogoController.crearMicropipeta);
router.put('/micropipetas/:id', catalogoController.actualizarMicropipeta);
router.delete('/micropipetas/:id', catalogoController.eliminarMicropipeta);

// --- 4. EQUIPOS DE LABORATORIO ---
router.get('/equipos-lab', catalogoController.listarEquiposLab);
router.get('/equipos-lab/:id', catalogoController.obtenerEquipoLabPorId);
router.post('/equipos-lab', catalogoController.crearEquipoLab);
router.put('/equipos-lab/:id', catalogoController.actualizarEquipoLab);
router.delete('/equipos-lab/:id', catalogoController.eliminarEquipoLab);

// --- 5. MATERIAL SIEMBRA ---
router.get('/material-siembra', catalogoController.listarMaterialSiembra);
router.get('/material-siembra/:id', catalogoController.obtenerMaterialSiembraPorId);
router.post('/material-siembra', catalogoController.crearMaterialSiembra);
router.put('/material-siembra/:id', catalogoController.actualizarMaterialSiembra);
router.delete('/material-siembra/:id', catalogoController.eliminarMaterialSiembra);

// --- 6. DILUYENTES ---
router.get('/diluyentes', catalogoController.listarDiluyentes);
router.get('/diluyentes/:id', catalogoController.obtenerDiluyentePorId);
router.post('/diluyentes', catalogoController.crearDiluyente);
router.put('/diluyentes/:id', catalogoController.actualizarDiluyente);
router.delete('/diluyentes/:id', catalogoController.eliminarDiluyente);

// --- 7. EQUIPOS INCUBACION ---
router.get('/equipos-incubacion', catalogoController.listarEquiposIncubacion);
router.get('/equipos-incubacion/:id', catalogoController.obtenerEquipoIncubacionPorId);
router.post('/equipos-incubacion', catalogoController.crearEquipoIncubacion);
router.put('/equipos-incubacion/:id', catalogoController.actualizarEquipoIncubacion);
router.delete('/equipos-incubacion/:id', catalogoController.eliminarEquipoIncubacion);

// --- 8. MAESTRO CHECKLIST LIMPIEZA ---
router.get('/checklist-limpieza', catalogoController.listarMaestroChecklistLimpieza);
router.get('/checklist-limpieza/:id', catalogoController.obtenerMaestroChecklistLimpiezaPorId);
router.post('/checklist-limpieza', catalogoController.crearMaestroChecklistLimpieza);
router.put('/checklist-limpieza/:id', catalogoController.actualizarMaestroChecklistLimpieza);
router.delete('/checklist-limpieza/:id', catalogoController.eliminarMaestroChecklistLimpieza);

// --- 9. MAESTRO TIPOS ANALISIS ---
router.get('/tipos-analisis', catalogoController.listarMaestroTiposAnalisis);
router.get('/tipos-analisis/:id', catalogoController.obtenerMaestroTipoAnalisisPorId);
router.post('/tipos-analisis', catalogoController.crearMaestroTipoAnalisis);
router.put('/tipos-analisis/:id', catalogoController.actualizarMaestroTipoAnalisis);
router.delete('/tipos-analisis/:id', catalogoController.eliminarMaestroTipoAnalisis);

// --- 10. MAESTRO FORMAS CALCULO ---
router.get('/formas-calculo', catalogoController.listarMaestroFormasCalculo);
router.get('/formas-calculo/:id', catalogoController.obtenerMaestroFormaCalculoPorId);
router.post('/formas-calculo', catalogoController.crearMaestroFormaCalculo);
router.put('/formas-calculo/:id', catalogoController.actualizarMaestroFormaCalculo);
router.delete('/formas-calculo/:id', catalogoController.eliminarMaestroFormaCalculo);

// --- VISTA UNIFICADA ---
router.get('/materiales-pesado', catalogoController.getMaterialesPesado);

module.exports = router;
