const { Router } = require('express');
const authController = require('../controllers/auth.controller');

const router = Router();

router.post('/login', authController.login.bind(authController));
router.post('/crearAnalista', authController.crearAnalista.bind(authController));

module.exports = router;
