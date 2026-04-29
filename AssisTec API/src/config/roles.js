/**
 * Roles del sistema AssisTec
 * 0: Analista (Trabaja sobre ALI/reportes asignados)
 * 1: Coordinadora (Valida solicitudes, modifica parcial, busca ALI/Ingreso)
 * 2: Jefe de Área (Valida formularios, busca ALI/Ingreso)
 * 3: Ingreso / Secretaria (Crea y edita solicitudes de ingreso)
 */
const ROLES = {
    ANALISTA: 0,
    COORDINADORA: 1,
    JEFE_AREA: 2,
    INGRESO: 3
};

module.exports = ROLES;
