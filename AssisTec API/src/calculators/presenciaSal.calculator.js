/**
 * Calculadora Presencia/Ausencia para Salmonella
 * Evalua resultados de Agar XLD/SS × 24h/48h × Selenito/Rappaport
 * Si cualquier agar muestra crecimiento tipico -> Presencia
 * Si todos muestran ausencia de crecimiento -> Ausencia
 */

const CAMPOS_LECTURA = [
    'resXld24hSelenito',
    'resSs24hSelenito',
    'resXld48hSelenito',
    'resSs48hSelenito',
    'resXld24hRappaport',
    'resSs24hRappaport',
    'resXld48hRappaport',
    'resSs48hRappaport'
];

/**
 * Determina presencia o ausencia de Salmonella segun lecturas de agares
 * @param {Object} lecturas - Objeto con los 8 campos de resultado
 * @returns {string} - 'Presencia' | 'Ausencia'
 */
function determinarPresenciaAusencia(lecturas = {}) {
    const hayTipico = CAMPOS_LECTURA.some((campo) => {
        const valor = lecturas[campo];
        return valor === 'tipico';
    });

    if (hayTipico) {
        return 'Presencia';
    }

    return 'Ausencia';
}

module.exports = {
    determinarPresenciaAusencia
};
