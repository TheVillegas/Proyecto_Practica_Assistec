/**
 * Middleware de Autenticación Simplificado (Mock para transición a Microservicios)
 * 
 * Este middleware intenta obtener la identidad del usuario desde dos fuentes:
 * 1. Headers (Ideal para API Gateway/Microservicios): x-rut-usuario, x-rol-usuario
 * 2. Body (Legacy/Frontend actual): rutUsuario, rolUsuario

 */
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
    console.log('--- Debug AuthMiddleware ---');
    console.log('Headers:', req.headers);
    let token = req.headers['x-access-token'] || (req.body && req.body.token);

    // Check Authorization header for Bearer token
    if (!token && req.headers['authorization']) {
        const authHeader = req.headers['authorization'];
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7, authHeader.length);
        }
    }

    if (!token) {
        return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ mensaje: 'Token inválido' });
        }
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
}

module.exports = authMiddleware;
