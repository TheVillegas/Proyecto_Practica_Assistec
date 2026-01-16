const express = require('express');
const router = express.Router();
const reporteRAMController = require('../controllers/reporteRAMController');
const authMiddleware = require('../middleware/authMiddleware.js');

// Proteger rutas de Reportes RAM
router.use(authMiddleware);

router.get('/:codigo_ali/estado', reporteRAMController.obtenerEstadoRam);
router.get('/:codigo_ali', reporteRAMController.obtenerReporteRAM);
router.post('/generarReporte', reporteRAMController.guardarReporteRAM);
router.post('/calcular', reporteRAMController.previewCalculoRAM);

module.exports = router;
