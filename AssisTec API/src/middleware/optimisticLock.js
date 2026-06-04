/**
 * Middleware para extraer el updated_at del body, query o headers
 * y pasarlo de forma estandarizada a los controllers/services
 * para implementar Optimistic Locking.
 */
const optimisticLock = (req, res, next) => {
    const updatedAt = req.body.updated_at ?? req.query.updated_at ?? req.headers['x-updated-at'];

    if (!updatedAt) {
        return res.status(400).json({
            codigo: 'MISSING_UPDATED_AT',
            mensaje: 'El campo updated_at es obligatorio para actualizar (optimistic locking)'
        });
    }

    // Validar que sea una fecha valida ISO-8601
    const parsedDate = new Date(updatedAt);
    if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
            codigo: 'INVALID_UPDATED_AT',
            mensaje: 'El formato de updated_at no es una fecha valida'
        });
    }

    req.expectedUpdatedAt = parsedDate;
    next();
};

module.exports = optimisticLock;
