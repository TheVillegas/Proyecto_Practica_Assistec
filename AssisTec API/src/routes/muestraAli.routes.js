const { Router } = require('express');
const muestraAliController = require('../controllers/muestraAli.controller');
const { verifyToken, authorizeAny } = require('../middleware/auth');
const ROLES = require('../config/roles');

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Listar todas las muestras ALI con sus reportes
router.get('/obtenerMuestras', authorizeAny([ROLES.ANALISTA, ROLES.COORDINADORA, ROLES.JEFE_AREA, ROLES.ADMINISTRATOR]), muestraAliController.listarMuestras.bind(muestraAliController));

// Obtener una muestra por código ALI
router.get('/:codigo_ali', authorizeAny([ROLES.ANALISTA, ROLES.COORDINADORA, ROLES.JEFE_AREA, ROLES.ADMINISTRATOR]), muestraAliController.obtenerPorCodigo.bind(muestraAliController));

// Actualizar observaciones generales
router.put('/observaciones', authorizeAny([ROLES.ANALISTA, ROLES.COORDINADORA, ROLES.JEFE_AREA, ROLES.ADMINISTRATOR]), muestraAliController.actualizarObservaciones.bind(muestraAliController));

// Eliminar muestra (solo supervisores)
router.delete('/:codigo_ali', authorizeAny([ROLES.COORDINADORA, ROLES.ADMINISTRATOR]), muestraAliController.eliminar.bind(muestraAliController));

// Obtener imágenes (dummy endpoint para evitar 404 en el front)
router.get('/:codigo_ali/imagenes', authorizeAny([ROLES.ANALISTA, ROLES.COORDINADORA, ROLES.JEFE_AREA, ROLES.ADMINISTRATOR]), (req, res) => {
    res.status(200).json([]);
});

module.exports = router;
