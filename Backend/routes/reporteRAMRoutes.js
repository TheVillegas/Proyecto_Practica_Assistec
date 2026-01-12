const express = require('express');
const router = express.Router();

const reporteRAMController = require('../controllers/reporteRAMController');


router.get('/:codigo_ali/estado', reporteRAMController.obtenerEstadoRam);
router.get('/:codigo_ali', reporteRAMController.obtenerReporteRAM);
router.post('/generarReporte', reporteRAMController.guardarReporteRAM);

module.exports = router;
