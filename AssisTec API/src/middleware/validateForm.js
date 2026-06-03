/**
 * Middleware factory que aplica validacion Zod segun tipo y etapa/fase.
 *
 * @param {string} tipo - 'sau' | 'coli' | 'sal'
 * @param {string} etapa - nombre de la etapa/fase (ej: 'etapa1', 'fase1')
 */
const validateForm = (tipo, etapa) => {
    const schemaModule = require(`../validators/${tipo}.schema`);
    const schema = schemaModule[etapa + 'Schema'];

    if (!schema) {
        throw new Error(`Schema no encontrado para ${tipo}.${etapa}`);
    }

    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                codigo: 'VALIDATION_ERROR',
                errores: result.error.issues.map((issue) => ({
                    campo: issue.path.join('.'),
                    mensaje: issue.message
                }))
            });
        }
        req.body = result.data;
        next();
    };
};

module.exports = validateForm;
