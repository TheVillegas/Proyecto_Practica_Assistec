const { Router } = require('express');
const saureusController = require('../controllers/saureus.controller');
const { verifyToken, authorizeAny } = require('../middleware/auth');
const optimisticLock = require('../middleware/optimisticLock');
const validateForm = require('../middleware/validateForm');
const ROLES = require('../config/roles');

const router = Router();

const READ_ROLES = [ROLES.ANALISTA, ROLES.COORDINADORA, ROLES.JEFE_AREA, ROLES.ADMINISTRATOR];
const WRITE_ROLES = [ROLES.ANALISTA, ROLES.ADMINISTRATOR];

router.use(verifyToken);

router.get('/por-analisis/:idAnalisis', authorizeAny(READ_ROLES), saureusController.obtenerPorAnalisis.bind(saureusController));
router.get('/:id', authorizeAny(READ_ROLES), saureusController.obtener.bind(saureusController));

// Validacion dinamica segun el numero de etapa en la URL
router.put('/:id/etapa/:etapa', authorizeAny(WRITE_ROLES), optimisticLock, (req, res, next) => {
    const etapaNum = Number(req.params.etapa);
    if (Number.isNaN(etapaNum) || etapaNum < 1 || etapaNum > 6) {
        return res.status(400).json({ codigo: 'INVALID_ETAPA', mensaje: 'Etapa no valida (use 1-6)' });
    }
    const validator = validateForm('sau', `etapa${etapaNum}`);
    return validator(req, res, next);
}, saureusController.guardarEtapa.bind(saureusController));

module.exports = router;
