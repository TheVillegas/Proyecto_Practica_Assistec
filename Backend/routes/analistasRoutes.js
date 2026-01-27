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
router.get('/analistas', authMiddleware.verifyToken, analistaController.listarAnalistas);

// Actualizar foto perfil
router.put('/foto-perfil/:rut', authMiddleware.verifyToken, analistaController.actualizarFotoPerfil);

// Actualizar correo
router.put('/correo/:rut', authMiddleware.verifyToken, analistaController.actualizarCorreo);

// Actualizar contraseña
router.put('/password/:rut', authMiddleware.verifyToken, analistaController.actualizarPassword);

module.exports = router;