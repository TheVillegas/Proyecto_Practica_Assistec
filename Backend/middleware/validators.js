/**
 * Validadores centralizados — express-validator
 *
 * Patrón: cada exportación es un array de middlewares [validationChain..., handleValidationErrors]
 * que se usa directamente en la ruta:
 *
 *   router.post('/login', validators.login, controller.loginAnalista);
 *
 * handleValidationErrors siempre va al final del array y corta la cadena
 * si hay errores, devolviendo 422 con el detalle de cada campo inválido.
 */
const { body, param, validationResult } = require('express-validator');

/**
 * Middleware final del array: si hay errores de validación, responde 422.
 * Si no hay errores, llama a next() y el controller ejecuta normalmente.
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            mensaje: 'Datos de entrada inválidos',
            errores: errors.array().map(e => ({ campo: e.path, mensaje: e.msg }))
        });
    }
    next();
};

// ---------------------------------------------------------------------------
// Analistas
// ---------------------------------------------------------------------------

exports.crearAnalista = [
    body('rut_analista')
        .notEmpty().withMessage('El RUT es requerido')
        .isString().withMessage('El RUT debe ser texto')
        .trim(),
    body('nombre_apellido_analista')
        .notEmpty().withMessage('El nombre es requerido')
        .isString()
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .trim(),
    body('correo_analista')
        .notEmpty().withMessage('El correo es requerido')
        .isEmail().withMessage('El correo no tiene un formato válido')
        .normalizeEmail(),
    body('contrasena_analista')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    handleValidationErrors
];

exports.login = [
    body('correo')
        .notEmpty().withMessage('El correo es requerido')
        .isEmail().withMessage('El correo no tiene un formato válido')
        .normalizeEmail(),
    body('contrasena_analista')
        .notEmpty().withMessage('La contraseña es requerida'),
    handleValidationErrors
];

exports.actualizarFotoPerfil = [
    param('rut')
        .notEmpty().withMessage('El RUT es requerido')
        .isString().trim(),
    body('url_foto')
        .notEmpty().withMessage('La URL de la foto es requerida')
        .isString().trim(),
    handleValidationErrors
];

exports.actualizarCorreo = [
    param('rut')
        .notEmpty().withMessage('El RUT es requerido')
        .isString().trim(),
    body('correo')
        .notEmpty().withMessage('El correo es requerido')
        .isEmail().withMessage('El correo no tiene un formato válido')
        .normalizeEmail(),
    handleValidationErrors
];

exports.actualizarPassword = [
    param('rut')
        .notEmpty().withMessage('El RUT es requerido')
        .isString().trim(),
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    handleValidationErrors
];

// ---------------------------------------------------------------------------
// Muestra ALI
// ---------------------------------------------------------------------------

exports.crearMuestra = [
    body('codigo_ali')
        .notEmpty().withMessage('El código ALI es requerido')
        .isString().trim(),
    handleValidationErrors
];

exports.actualizarObservaciones = [
    body('codigo_ali')
        .notEmpty().withMessage('El código ALI es requerido')
        .isString().trim(),
    body('observaciones_generales')
        .isString().withMessage('Las observaciones deben ser texto')
        .trim(),
    handleValidationErrors
];

// ---------------------------------------------------------------------------
// Reporte TPA
// ---------------------------------------------------------------------------

exports.guardarReporteTPA = [
    // El frontend manda codigoALI como número (parseInt), no como string
    body('codigoALI')
        .notEmpty().withMessage('El código ALI es requerido')
        .isNumeric().withMessage('El código ALI debe ser un número'),
    body('estado')
        .optional()
        .isString().trim(),
    handleValidationErrors
];

exports.verificarReporteTPA = [
    param('codigo_ali')
        .notEmpty().withMessage('El código ALI es requerido')
        .isString().trim(),
    handleValidationErrors
];

// ---------------------------------------------------------------------------
// Reporte RAM
// ---------------------------------------------------------------------------

exports.guardarReporteRAM = [
    // El frontend manda codigo_ali en snake_case (string), no codigoALI
    body('codigo_ali')
        .notEmpty().withMessage('El código ALI es requerido')
        .isString().trim(),
    handleValidationErrors
];

exports.previewCalculoRAM = [
    body('diluciones')
        .isArray({ min: 1 }).withMessage('Se requiere el array "diluciones" con al menos un elemento'),
    body('diluciones.*.dil')
        .notEmpty().withMessage('Cada dilución debe tener el campo "dil"'),
    body('diluciones.*.colonias')
        .isArray({ min: 1 }).withMessage('Cada dilución debe tener el array "colonias"'),
    handleValidationErrors
];
