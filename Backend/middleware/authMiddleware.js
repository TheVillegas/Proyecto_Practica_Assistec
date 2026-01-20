/**
 * Middleware de Autenticación Simplificado (Mock para transición a Microservicios)
 * 
 * Este middleware intenta obtener la identidad del usuario desde dos fuentes:
 * 1. Headers (Ideal para API Gateway/Microservicios): x-rut-usuario, x-rol-usuario
 * 2. Body (Legacy/Frontend actual): rutUsuario, rolUsuario

 */
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

module.exports = {
    verifyToken: (req, res, next) => {
        let token = req.headers['x-access-token'] || (req.body && req.body.token);

        // Check Authorization header for Bearer token
        if (!token && req.headers['authorization']) {
            const authHeader = req.headers['authorization'];
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7, authHeader.length);
            }
        }

        if (!token) {
            // Check if it's a public endpoint (optional logic, usually handled by not applying middleware)
            return res.status(403).json({ mensaje: 'Token no proporcionado' });
        }

        if (!process.env.JWT_SECRET) {
            console.error('FATAL: JWT_SECRET no definido en entorno');
            return res.status(500).json({ mensaje: 'Error de configuración del servidor' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ mensaje: 'Token inválido o expirado' });
            }
            req.user = {
                rut: decoded.id,
                rol: decoded.role // Rol 1: Supervisor, Rol 2: Analista
            };
            next();
        });
    },

    authorize: (roles = []) => {
        // roles param can be a single role string (e.g. '1') or an array of roles (e.g. ['1', '2'])
        if (typeof roles === 'number') {
            roles = [roles];
        } else if (typeof roles === 'string') {
            roles = [parseInt(roles)];
        }

        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ mensaje: 'Usuario no autenticado' });
            }

            if (roles.length && !roles.includes(req.user.rol)) {
                // user's role is not authorized
                return res.status(401).json({ mensaje: 'No tienes permiso para realizar esta acción' });
            }

            // authentication and authorization successful
            next();
        };
    }
};
