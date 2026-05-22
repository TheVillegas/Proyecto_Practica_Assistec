/**
 * Roles del sistema AssisTec
 * 0: Analista (Trabaja sobre ALI/reportes asignados)
 * 1: Coordinadora (Valida solicitudes, modifica parcial, busca ALI/Ingreso)
 * 2: Jefe de Área (Valida formularios, busca ALI/Ingreso)
 * 3: Ingreso / Secretaria (Crea y edita solicitudes de ingreso)
 * 4: Administrator (Acceso transversal auditado)
 */
const ROLES = {
    ANALISTA: 0,
    COORDINADORA: 1,
    JEFE_AREA: 2,
    INGRESO: 3,
    ADMINISTRATOR: 4
};

const LANDING_PRECEDENCE = [
    ROLES.ADMINISTRATOR,
    ROLES.JEFE_AREA,
    ROLES.COORDINADORA,
    ROLES.INGRESO,
    ROLES.ANALISTA
];

const LANDING_ROUTES = {
    [ROLES.ADMINISTRATOR]: '/dashboard-admin',
    [ROLES.JEFE_AREA]: '/dashboard-jefe',
    [ROLES.COORDINADORA]: '/dashboard-coordinadora',
    [ROLES.INGRESO]: '/dashboard-ingreso',
    [ROLES.ANALISTA]: '/dashboard-analista'
};

const normalizeRole = (role) => {
    const parsedRole = Number(role);
    return Number.isInteger(parsedRole) ? parsedRole : null;
};

const uniqueRoles = (roles) => {
    const deduped = [];

    roles.forEach((role) => {
        if (role !== null && !deduped.includes(role)) {
            deduped.push(role);
        }
    });

    return deduped;
};

const resolveUserRoles = (usuario = {}) => {
    const relationRoles = Array.isArray(usuario.roles)
        ? usuario.roles.map((entry) => normalizeRole(typeof entry === 'number' ? entry : entry?.rol))
        : [];

    const fallbackRole = normalizeRole(
        usuario.primaryRole ?? usuario.rolUsuario ?? usuario.rol ?? usuario.role
    );

    return uniqueRoles([...relationRoles, fallbackRole]);
};

const resolvePrimaryRole = (usuario = {}, roles = resolveUserRoles(usuario)) => {
    const explicitPrimary = Array.isArray(usuario.roles)
        ? usuario.roles.find((entry) => entry?.isPrimary)
        : null;

    const candidates = uniqueRoles([
        normalizeRole(explicitPrimary?.rol),
        normalizeRole(usuario.primaryRole),
        normalizeRole(usuario.rolUsuario),
        normalizeRole(usuario.rol),
        normalizeRole(usuario.role),
        ...roles
    ]);

    const prioritizedRole = LANDING_PRECEDENCE.find((role) => candidates.includes(role));
    return prioritizedRole ?? ROLES.ANALISTA;
};

const resolveLandingRoute = (role) => LANDING_ROUTES[normalizeRole(role)] ?? LANDING_ROUTES[ROLES.ANALISTA];

module.exports = {
    ...ROLES,
    LANDING_PRECEDENCE,
    LANDING_ROUTES,
    normalizeRole,
    resolveUserRoles,
    resolvePrimaryRole,
    resolveLandingRoute
};
