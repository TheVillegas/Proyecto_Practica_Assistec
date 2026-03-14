const express = require('express');
const router = express.Router();
const reporteRAMController = require('../controllers/reporteRAMController');
const authMiddleware = require('../middleware/authMiddleware.js');
const validators = require('../middleware/validators.js');

// Proteger rutas de Reportes RAM
router.use(authMiddleware.verifyToken);

router.get('/:codigo_ali/estado', reporteRAMController.obtenerEstadoRam);
router.get('/:codigo_ali', reporteRAMController.obtenerReporteRAM);
router.post('/generarReporte', validators.guardarReporteRAM, reporteRAMController.guardarReporteRAM);
router.post('/calcular', validators.previewCalculoRAM, reporteRAMController.previewCalculoRAM);

module.exports = router;
