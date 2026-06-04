/**
 * Calculadora UFC/g para S. Aureus.
 * Adaptado de calcularRecuentoColonias (legacy).
 *
 * @param {Object} params
 * @param {number} params.volumen — volumen sembrado en ml (default: 1)
 * @param {Array}  params.diluciones — [{ dil: -1, colonias: [c1, c2] }]
 * @returns {Object} { nSAureus, ufcPorG, incongruenciaDetectada, observacionIncongruencia, operador, esEstimado }
 */

const UMBRAL_OPTIMO_MIN = 15;
const UMBRAL_OPTIMO_MAX = 300;
const UMBRAL_MNPC = 300;

function clasificarDilucion(dilucion) {
    const coloniasValidas = (dilucion.colonias || [])
        .filter((c) => c !== null && c !== undefined && !Number.isNaN(c));

    const suma = coloniasValidas.reduce((acc, c) => acc + c, 0);
    const promedio = coloniasValidas.length > 0 ? suma / coloniasValidas.length : 0;

    const esSinCrecimiento = coloniasValidas.length > 0 && coloniasValidas.every((c) => c === 0);

    let tipo;
    if (esSinCrecimiento) {
        tipo = 'RANGO_SIN_CRECIMIENTO';
    } else if (promedio < UMBRAL_OPTIMO_MIN) {
        tipo = 'RANGO_BAJO';
    } else if (promedio > UMBRAL_OPTIMO_MAX) {
        tipo = 'RANGO_EXCESO';
    } else {
        tipo = 'RANGO_OPTIMO';
    }

    return {
        ...dilucion,
        coloniasValidas,
        promedio,
        tipo,
        factorDilucion: Math.pow(10, -Math.abs(dilucion.dil || 0))
    };
}

function detectarIncongruencia(dilucionesClasificadas) {
    for (const d of dilucionesClasificadas) {
        const cols = d.coloniasValidas;
        if (cols.length < 2) continue;

        const valores = cols.filter((c) => c > 0);
        if (valores.length < 2) continue;

        const min = Math.min(...valores);
        const max = Math.max(...valores);

        // Si una placa tiene 0 y la otra tiene > 0
        if (cols.some((c) => c === 0) && cols.some((c) => c > 0)) {
            return {
                detectada: true,
                observacion: `Incongruencia en dilucion ${d.dil}: placa con 0 y placa con >0 colonias`
            };
        }

        // Si el ratio entre max y min es > 2
        if (max / min > 2) {
            return {
                detectada: true,
                observacion: `Incongruencia en dilucion ${d.dil}: ratio max/min = ${(max / min).toFixed(2)} > 2`
            };
        }
    }

    return { detectada: false, observacion: null };
}

function buildResultado(ufcRaw, operador, esEstimado, casoAplicado, incongruencia) {
    const ufc = ufcRaw !== null ? Math.round(ufcRaw) : null;
    return {
        nSAureus: ufc,
        ufcPorG: ufc,
        incongruenciaDetectada: incongruencia.detectada,
        observacionIncongruencia: incongruencia.observacion,
        operador,
        esEstimado,
        casoAplicado
    };
}

function calcularUfcSau({ volumen = 1, diluciones = [] } = {}) {
    if (!diluciones || diluciones.length === 0) {
        return buildResultado(null, '=', false, 'SIN_DATOS', { detectada: false, observacion: null });
    }

    const clasificadas = diluciones.map(clasificarDilucion);
    const incongruencia = detectarIncongruencia(clasificadas);

    const resolverFactor = (dil) => Math.pow(10, -Math.abs(dil || 0));

    // Prioridad 1: Rango optimo
    const optimas = clasificadas.filter((d) => d.tipo === 'RANGO_OPTIMO');
    if (optimas.length > 0) {
        const d = optimas[0];
        const ufc = d.promedio / (volumen * d.factorDilucion);
        return buildResultado(ufc, '=', false, 'PRIORIDAD_1', incongruencia);
    }

    // Prioridad 2: Rango bajo
    const bajas = clasificadas.filter((d) => d.tipo === 'RANGO_BAJO');
    if (bajas.length > 0) {
        const dilMenor = bajas.reduce((min, d) => (Math.abs(d.dil) < Math.abs(min.dil) ? d : min), bajas[0]);
        const resultado = UMBRAL_OPTIMO_MIN / (volumen * dilMenor.factorDilucion);
        return buildResultado(resultado, '<', false, 'PRIORIDAD_2', incongruencia);
    }

    // Prioridad 3: Rango exceso
    const excesos = clasificadas.filter((d) => d.tipo === 'RANGO_EXCESO');
    if (excesos.length > 0) {
        const dilMayor = excesos.reduce((max, d) => (Math.abs(d.dil) > Math.abs(max.dil) ? d : max), excesos[0]);
        const factor = dilMayor.factorDilucion;

        if (dilMayor.promedio < UMBRAL_MNPC) {
            const ufc = dilMayor.promedio / (volumen * factor);
            return buildResultado(ufc, '=', true, 'PRIORIDAD_3A', incongruencia);
        }
        const resultado = UMBRAL_MNPC / (volumen * factor);
        return buildResultado(resultado, '>', false, 'PRIORIDAD_3B', incongruencia);
    }

    // Prioridad 4: Sin crecimiento
    const sinCrecimiento = clasificadas.filter((d) => d.tipo === 'RANGO_SIN_CRECIMIENTO');
    if (sinCrecimiento.length > 0) {
        const dilMenor = sinCrecimiento.reduce((min, d) => (Math.abs(d.dil) < Math.abs(min.dil) ? d : min), sinCrecimiento[0]);
        const resultado = 1 / (volumen * dilMenor.factorDilucion);
        return buildResultado(resultado, '<', false, 'PRIORIDAD_4', incongruencia);
    }

    return buildResultado(null, '=', false, 'ERROR', incongruencia);
}

module.exports = { calcularUfcSau };
