const { Router } = require('express');
const solicitudController = require('../controllers/solicitud.controller');
const { verifyToken, authorizeAny, requireActingRole } = require('../middleware/auth');
const optimisticLock = require('../middleware/optimisticLock');
const ROLES = require('../config/roles');

const router = Router();

// Todas las rutas requieren JWT
router.use(verifyToken);

router.post('/', authorizeAny([ROLES.INGRESO, ROLES.ADMINISTRATOR]), requireActingRole(), solicitudController.crear.bind(solicitudController));
router.get('/', solicitudController.listar.bind(solicitudController));
router.get('/analisis/resolver', solicitudController.resolverAnalisis.bind(solicitudController));
router.get('/summary', solicitudController.summary.bind(solicitudController));
router.get('/queue', solicitudController.queue.bind(solicitudController));
router.get('/:codigoAli/plazo-estimado', solicitudController.plazoEstimado.bind(solicitudController));
router.get('/:id', solicitudController.obtener.bind(solicitudController));
router.put('/:id', authorizeAny([ROLES.INGRESO, ROLES.COORDINADORA, ROLES.JEFE_AREA, ROLES.ADMINISTRATOR]), requireActingRole(), optimisticLock, solicitudController.editar.bind(solicitudController));
router.post('/:id/enviar-validacion', authorizeAny([ROLES.INGRESO, ROLES.ADMINISTRATOR]), requireActingRole(), optimisticLock, solicitudController.enviarValidacion.bind(solicitudController));
router.post('/:id/validar', authorizeAny([ROLES.COORDINADORA, ROLES.JEFE_AREA, ROLES.ADMINISTRATOR]), requireActingRole(), optimisticLock, solicitudController.validar.bind(solicitudController));
router.post('/:id/rechazar', authorizeAny([ROLES.COORDINADORA, ROLES.JEFE_AREA, ROLES.ADMINISTRATOR]), requireActingRole(), optimisticLock, solicitudController.rechazar.bind(solicitudController));

module.exports = router;
