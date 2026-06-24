const { Router } = require('express');
const enterobacteriasController = require('../controllers/enterobacterias.controller');
const { verifyToken, authorizeAny } = require('../middleware/auth');
const optimisticLock = require('../middleware/optimisticLock');
const validateForm = require('../middleware/validateForm');
const ROLES = require('../config/roles');

const router = Router();

const READ_ROLES = [ROLES.ANALISTA, ROLES.COORDINADORA, ROLES.JEFE_AREA, ROLES.ADMINISTRATOR];
const WRITE_ROLES = [ROLES.ANALISTA, ROLES.ADMINISTRATOR];

router.use(verifyToken);

router.get('/por-analisis/:idAnalisis', authorizeAny(READ_ROLES), enterobacteriasController.obtenerPorAnalisis.bind(enterobacteriasController));
router.get('/:id', authorizeAny(READ_ROLES), enterobacteriasController.obtener.bind(enterobacteriasController));

// Validacion dinamica segun el numero de etapa en la URL
router.put('/:id/etapa/:etapa', authorizeAny(WRITE_ROLES), optimisticLock, (req, res, next) => {
    const etapaNum = Number(req.params.etapa);
    if (Number.isNaN(etapaNum) || etapaNum < 1 || etapaNum > 3) {
        return res.status(400).json({ codigo: 'INVALID_ETAPA', mensaje: 'Etapa no valida (use 1-3)' });
    }
    const validator = validateForm('ent', `etapa${etapaNum}`);
    return validator(req, res, next);
}, enterobacteriasController.guardarEtapa.bind(enterobacteriasController));

module.exports = router;
