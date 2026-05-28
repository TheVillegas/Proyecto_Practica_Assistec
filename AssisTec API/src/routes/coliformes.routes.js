const { Router } = require('express');
const coliformesController = require('../controllers/coliformes.controller');
const { verifyToken, authorizeAny } = require('../middleware/auth');
const optimisticLock = require('../middleware/optimisticLock');
const ROLES = require('../config/roles');

const router = Router();

const READ_ROLES = [ROLES.ANALISTA, ROLES.COORDINADORA, ROLES.JEFE_AREA, ROLES.ADMINISTRATOR];
const WRITE_ROLES = [ROLES.ANALISTA, ROLES.ADMINISTRATOR];

router.use(verifyToken);

router.post('/', authorizeAny(WRITE_ROLES), coliformesController.crear.bind(coliformesController));
router.get('/por-analisis/:idAnalisis', authorizeAny(READ_ROLES), coliformesController.obtenerPorAnalisis.bind(coliformesController));
router.get('/:id', authorizeAny(READ_ROLES), coliformesController.obtener.bind(coliformesController));
router.put('/:id/fase/:fase', authorizeAny(WRITE_ROLES), optimisticLock, coliformesController.guardarFase.bind(coliformesController));

module.exports = router;
