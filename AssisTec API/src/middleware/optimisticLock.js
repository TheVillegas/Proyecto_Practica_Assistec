/**
 * Middleware para extraer el updated_at del body o query
 * y pasarlo de forma estandarizada a los controllers/services
 * para implementar Optimistic Locking.
 */
const optimisticLock = (req, res, next) => {
    const updatedAt = req.body.updated_at || req.query.updated_at;
    
    if (!updatedAt) {
        return res.status(400).json({ 
            mensaje: 'El campo updated_at es obligatorio para actualizar (optimistic locking)' 
        });
    }

    // Validar que sea una fecha válida
    const parsedDate = new Date(updatedAt);
    if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ 
            mensaje: 'El formato de updated_at no es una fecha válida' 
        });
    }

    req.expectedUpdatedAt = parsedDate;
    next();
};

module.exports = optimisticLock;
