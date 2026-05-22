const jwt = require('jsonwebtoken');
const ROLES = require('../config/roles');
const { normalizeRole, resolvePrimaryRole, resolveUserRoles } = require('../config/roles');

const AUTHZ_MESSAGE = 'No tienes permiso para realizar esta acción';

const normalizeAuthenticatedUser = (decoded = {}) => {
    const roles = resolveUserRoles(decoded);
    const primaryRole = resolvePrimaryRole(decoded, roles);

    return {
        ...decoded,
        roles,
        primaryRole,
        role: normalizeRole(decoded.role) ?? primaryRole,
        rol: normalizeRole(decoded.rol) ?? primaryRole
    };
};

const extractActingRole = (req) => {
    return normalizeRole(
        req.body?.actingRole
        ?? req.body?.acting_role
        ?? req.query?.actingRole
        ?? req.query?.acting_role
        ?? req.headers['x-acting-role']
    );
};

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
        req.user = normalizeAuthenticatedUser(decoded);
        next();
    } catch (err) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};

const authorizeAny = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ mensaje: 'Usuario no autenticado' });
        }

        const normalizedAllowedRoles = allowedRoles
            .map((role) => normalizeRole(role))
            .filter((role) => role !== null);
        const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [];
        const hasAllowedRole = userRoles.some((role) => normalizedAllowedRoles.includes(role));

        if (!hasAllowedRole) {
            return res.status(403).json({ mensaje: AUTHZ_MESSAGE });
        }

        next();
    };
};

const requireActingRole = ({ requiredForRoles = [ROLES.ADMINISTRATOR] } = {}) => {
    const normalizedRequiredRoles = requiredForRoles
        .map((role) => normalizeRole(role))
        .filter((role) => role !== null);

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ mensaje: 'Usuario no autenticado' });
        }

        const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [];
        const actingRole = extractActingRole(req);
        const mustProvideActingRole = userRoles.some((role) => normalizedRequiredRoles.includes(role));

        if (actingRole === null) {
            if (mustProvideActingRole) {
                return res.status(403).json({ mensaje: 'actingRole es obligatorio para esta acción' });
            }

            req.user.actingRole = req.user.role;
            return next();
        }

        if (!userRoles.includes(actingRole)) {
            return res.status(403).json({ mensaje: 'actingRole no autorizado para este usuario' });
        }

        req.user.actingRole = actingRole;
        req.user.role = actingRole;
        req.user.rol = actingRole;
        next();
    };
};

module.exports = {
    verifyToken,
    authorize: authorizeAny,
    authorizeAny,
    requireActingRole
};
