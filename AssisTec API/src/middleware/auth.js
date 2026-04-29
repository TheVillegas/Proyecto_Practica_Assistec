const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(403).json({ mensaje: 'No se proporcionó un token de autorización' });
    }

    const token = authHeader.split(' ')[1]; // Formato: "Bearer <token>"

    if (!token) {
        return res.status(403).json({ mensaje: 'Formato de token inválido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id: rut, role: rol, ... }
        next();
    } catch (err) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};

const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ mensaje: 'Usuario no autenticado' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(401).json({ mensaje: 'No tienes permiso para realizar esta acción' });
        }

        next();
    };
};

module.exports = {
    verifyToken,
    authorize
};
