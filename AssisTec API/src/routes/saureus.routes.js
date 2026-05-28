const { Router } = require('express');
const saureusController = require('../controllers/saureus.controller');
const { verifyToken, authorizeAny } = require('../middleware/auth');
const optimisticLock = require('../middleware/optimisticLock');
const ROLES = require('../config/roles');

const router = Router();

const READ_ROLES = [ROLES.ANALISTA, ROLES.COORDINADORA, ROLES.JEFE_AREA, ROLES.ADMINISTRATOR];
const WRITE_ROLES = [ROLES.ANALISTA, ROLES.ADMINISTRATOR];

router.use(verifyToken);

router.post('/', authorizeAny(WRITE_ROLES), saureusController.crear.bind(saureusController));
router.get('/por-analisis/:idAnalisis', authorizeAny(READ_ROLES), saureusController.obtenerPorAnalisis.bind(saureusController));
router.get('/:id', authorizeAny(READ_ROLES), saureusController.obtener.bind(saureusController));
router.put('/:id/etapa/:etapa', authorizeAny(WRITE_ROLES), optimisticLock, saureusController.guardarEtapa.bind(saureusController));

module.exports = router;
