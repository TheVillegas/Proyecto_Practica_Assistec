const express = require('express');
const router = express.Router();
const muestraAliController = require('../controllers/muestraAliController.js');
const authMiddleware = require('../middleware/authMiddleware.js');

// Proteger rutas de Muestras ALI
router.use(authMiddleware.verifyToken);

router.post('/crearMuestra', muestraAliController.crearMuestraALI);
router.get('/obtenerMuestras', muestraAliController.listarMuestrasALI);
router.get('/:codigo_ali', muestraAliController.obtenerMuestraALI_porCodigoAli);
router.put('/observaciones', muestraAliController.actualizarObservacionesGenerales);
// Solo Supervisores (Rol 1) pueden eliminar muestras
router.delete('/:codigo_ali', authMiddleware.authorize(1), muestraAliController.eliminarMuestraALI);

// Rutas para Imágenes de Observaciones
const aliImagenesController = require('../controllers/aliImagenesController.js');
router.post('/imagenes', aliImagenesController.agregarImagen);
router.get('/:codigo_ali/imagenes', aliImagenesController.obtenerImagenes);
router.delete('/imagenes/:id_imagen', aliImagenesController.eliminarImagen);

module.exports = router;
