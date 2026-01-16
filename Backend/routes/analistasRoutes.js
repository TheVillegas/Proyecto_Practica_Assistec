const express = require('express');
const router = express.Router();
const analistaController = require('../controllers/analistaController.js');
const authMiddleware = require('../middleware/authMiddleware.js');

// Rutas protegidas (Usuario debe ser admin o tener token válido para crear otros, asumo)
// CAMBIO: Se deja pública por solicitud del usuario
router.post('/crearAnalista', analistaController.crearAnalista);

// Ruta pública para login
router.post('/login', analistaController.loginAnalista);

// Ruta protegida para listar
router.get('/analistas', authMiddleware, analistaController.listarAnalistas);

module.exports = router;