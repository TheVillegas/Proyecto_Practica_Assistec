/**
 * Calculadora NMP (Numero Mas Probable) para Coliformes
 * Tabla de referencia basada en combinaciones de 3 tubos x 3 diluciones
 * Input: array de 3 numeros [positivos_dil1, positivos_dil2, positivos_dil3]
 * Output: valor NMP/100ml (number)
 */

// Tabla NMP estandar para 3 tubos por dilucion (10ml, 1ml, 0.1ml)
// Formato: "a,b,c" -> NMP/100ml
const TABLA_NMP = {
    '0,0,0': 0,
    '0,0,1': 3,
    '0,1,0': 3,
    '0,1,1': 6.1,
    '0,2,0': 6.2,
    '0,2,1': 9.2,
    '0,3,0': 9.4,
    '1,0,0': 3.6,
    '1,0,1': 7.2,
    '1,0,2': 11,
    '1,1,0': 7.3,
    '1,1,1': 11,
    '1,1,2': 15,
    '1,2,0': 11,
    '1,2,1': 15,
    '1,3,0': 16,
    '1,3,1': 20,
    '2,0,0': 9.1,
    '2,0,1': 14,
    '2,0,2': 20,
    '2,1,0': 15,
    '2,1,1': 20,
    '2,1,2': 27,
    '2,2,0': 21,
    '2,2,1': 28,
    '2,2,2': 35,
    '2,3,0': 29,
    '2,3,1': 36,
    '3,0,0': 23,
    '3,0,1': 39,
    '3,0,2': 64,
    '3,1,0': 43,
    '3,1,1': 75,
    '3,1,2': 120,
    '3,2,0': 93,
    '3,2,1': 150,
    '3,2,2': 210,
    '3,3,0': 240,
    '3,3,1': 460,
    '3,3,2': 1100,
    '3,3,3': 1100
};

const TIPOS_VALIDOS = ['totales', 'fecales', 'ecoli'];

/**
 * Calcula el NMP/100ml para un tipo de lectura dado
 * @param {string} tipoLectura - 'totales' | 'fecales' | 'ecoli'
 * @param {number[]} tubosPositivosPorDilucion - Array de 3 numeros [dil1, dil2, dil3]
 * @returns {number} - Valor NMP/100ml
 */
function calcularNMP(tipoLectura, tubosPositivosPorDilucion) {
    if (!TIPOS_VALIDOS.includes(tipoLectura)) {
        throw new Error(`Tipo de lectura invalido: ${tipoLectura}. Use: ${TIPOS_VALIDOS.join(', ')}`);
    }

    if (!Array.isArray(tubosPositivosPorDilucion) || tubosPositivosPorDilucion.length !== 3) {
        throw new Error('Se requieren exactamente 3 diluciones');
    }

    const key = tubosPositivosPorDilucion.map(Number).join(',');
    const valor = TABLA_NMP[key];

    if (valor === undefined) {
        throw new Error(`Combinacion de tubos no encontrada en tabla NMP: ${key}`);
    }

    return valor;
}

/**
 * Calcula los 3 valores NMP para una muestra
 * @param {Object} params
 * @param {number[]} params.tubosPositivosTotales - [dil1, dil2, dil3] para coliformes totales
 * @param {number[]} params.tubosPositivosFecales - [dil1, dil2, dil3] para coliformes fecales
 * @param {number[]} params.tubosPositivosEcoli - [dil1, dil2, dil3] para E.Coli
 * @returns {Object} - { coliformesTotales, coliformesFecales, eColi }
 */
function calcularResultadosNMP({
    tubosPositivosTotales = [0, 0, 0],
    tubosPositivosFecales = [0, 0, 0],
    tubosPositivosEcoli = [0, 0, 0]
} = {}) {
    return {
        coliformesTotales: calcularNMP('totales', tubosPositivosTotales),
        coliformesFecales: calcularNMP('fecales', tubosPositivosFecales),
        eColi: calcularNMP('ecoli', tubosPositivosEcoli)
    };
}

module.exports = {
    calcularNMP,
    calcularResultadosNMP
};
