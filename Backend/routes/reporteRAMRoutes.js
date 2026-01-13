const express = require('express');
const router = express.Router();

const reporteRAMController = require('../controllers/reporteRAMController');


const base64Middleware = require('../middleware/base64Middleware');

router.get('/:codigo_ali/estado', reporteRAMController.obtenerEstadoRam);
router.get('/:codigo_ali', reporteRAMController.obtenerReporteRAM);
router.post('/generarReporte', base64Middleware(['etapa7.firmaCoordinador']), reporteRAMController.guardarReporteRAM);
router.post('/calcular', reporteRAMController.previewCalculoRAM);

module.exports = router;
