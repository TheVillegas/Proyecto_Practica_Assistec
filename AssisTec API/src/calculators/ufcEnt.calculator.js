/**
 * Calculador de Enterobacterias — NCh 2676.Of2002 (modelo per-placa, método de confirmación).
 *
 * Por placa:
 *   C   = colonias contadas (presuntivas)
 *   A   = colonias transferidas a confirmación (máx 5)
 *   b   = colonias confirmadas Enterobacteriaceae (oxidasa-negativas y glucosa-positivas)
 *   a   = C * (b / A)
 *
 * N = Σa / ( V * (n1 + 0.1*n2) * d )
 *   d  = 10^(−|dil|)  ;  dil entra como entero negativo (p.ej. -1 → 10^-1)
 *   n1 = nº placas 1ª dilución ; n2 = nº placas 2ª dilución
 *
 * Validaciones por placa: A > 5, A > C, b > A, A=0 con colonias → placa no aporta.
 * Sin colonias presuntivas o sin confirmación → "SD".
 *
 * QC orthogonal al método: se detecta incongruencia entre placas duplicadas de una
 * misma dilución (ratio max/min > 2, o una placa en 0 y otra > 0) y se reporta junto
 * al resultado, sin alterar el cálculo.
 */

const MAX_A = 5;

/**
 * Agrupa un array plano de placas (cada una con su dil) en diluciones agrupadas.
 * @param {Array<{dil: number, colonias?, confirmA?, confirmB?}>} placas
 * @returns {Array<{dil: number, placas: Array}>}
 */
function agruparPorDil(placas) {
    const map = new Map();
    for (const p of placas) {
        if (!map.has(p.dil)) map.set(p.dil, []);
        map.get(p.dil).push({
            colonias: p.colonias ?? null,
            confirmA: p.confirmA ?? null,
            confirmB: p.confirmB ?? null,
        });
    }
    return Array.from(map.entries())
        .map(([dil, pl]) => ({ dil, placas: pl }))
        .sort((a, b) => Math.abs(a.dil) - Math.abs(b.dil));
}

/**
 * Evalúa una placa y calcula su aporte 'a'.
 * @returns {{ colonias, A, b, a, error } | null}
 */
function evaluarPlaca(p, dil, advertencias) {
    const tieneAlgo = [p.colonias, p.confirmA, p.confirmB].some((v) => v != null);
    if (!tieneAlgo) return null;

    const colonias = p.colonias ?? 0;
    const A = p.confirmA ?? 0;
    const b = p.confirmB ?? 0;

    let error = null, a = null;
    if (A > MAX_A) error = `A>${MAX_A} (máx ${MAX_A} por placa)`;
    else if (A > colonias) error = `A>colonias (${A}>${colonias})`;
    else if (b > A) error = `b>A (${b}>${A})`;
    else if (colonias > 0 && A === 0) error = 'falta confirmación (A=0 con colonias presentes)';
    else a = colonias > 0 ? colonias * (b / A) : 0;

    if (error) advertencias.push(`dil ${dil}: ${error}.`);
    return { colonias, A, b, a, error };
}

/**
 * QC orthogonal: detecta incongruencia entre placas duplicadas de una misma dilución.
 * @param {Array<{dil: number, placas: Array<{colonias}>}>} diluciones
 */
function detectarIncongruencia(diluciones) {
    for (const grupo of diluciones) {
        const cols = grupo.placas
            .map((p) => p.colonias)
            .filter((c) => c !== null && c !== undefined && !Number.isNaN(c));
        if (cols.length < 2) continue;

        if (cols.some((c) => c === 0) && cols.some((c) => c > 0)) {
            return {
                detectada: true,
                observacion: `Incongruencia en dilucion ${grupo.dil}: placa con 0 y placa con >0 colonias`
            };
        }

        const valores = cols.filter((c) => c > 0);
        if (valores.length < 2) continue;

        const min = Math.min(...valores);
        const max = Math.max(...valores);

        if (max / min > 2) {
            return {
                detectada: true,
                observacion: `Incongruencia en dilucion ${grupo.dil}: ratio max/min = ${(max / min).toFixed(2)} > 2`
            };
        }
    }

    return { detectada: false, observacion: null };
}

/**
 * Calcula Enterobacterias a partir de diluciones agrupadas (formato interno).
 * @param {Array<{dil: number, placas: Array}>} diluciones
 * @param {number} volumen
 */
function calcularDesdeGrupos(diluciones, volumen = 1) {
    const advertencias = [];
    const detalle = [];
    let sumaA = 0, totalColonias = 0;
    const nPorIndice = [];

    const dils = [...diluciones]
        .filter((x) => x && x.placas && x.placas.length)
        .sort((a, b) => Math.abs(a.dil) - Math.abs(b.dil));

    const incongruencia = detectarIncongruencia(dils);

    if (dils.length === 0) {
        return {
            ufc: null,
            esSd: true,
            casoAplicado: 'SIN_DATOS',
            sumaA: 0,
            sumaColonias: 0,
            n1: 0,
            n2: 0,
            d: null,
            detalle: [],
            advertencias: ['Sin datos de diluciones.'],
            incongruenciaDetectada: incongruencia.detectada,
            observacionIncongruencia: incongruencia.observacion,
        };
    }

    if (dils.length > 2) {
        advertencias.push('Se ingresaron más de 2 diluciones; la NCh usa 2. Se usan las dos más concentradas.');
    }

    dils.forEach((grupo, i) => {
        let nPlacas = 0;
        for (const p of grupo.placas) {
            const det = evaluarPlaca(p, grupo.dil, advertencias);
            if (!det) continue;
            detalle.push({ dil: grupo.dil, ...det });
            totalColonias += det.colonias;
            nPlacas++;
            if (det.a != null && det.error == null) sumaA += det.a;
        }
        nPorIndice[i] = nPlacas;
    });

    const dilBase = dils[0].dil;
    const d = Math.pow(10, -Math.abs(dilBase));
    const n1 = nPorIndice[0] ?? 0;
    const n2 = nPorIndice[1] ?? 0;

    const base = {
        sumaA,
        sumaColonias: totalColonias,
        n1,
        n2,
        d,
        detalle,
        advertencias,
        incongruenciaDetectada: incongruencia.detectada,
        observacionIncongruencia: incongruencia.observacion,
    };

    if (totalColonias <= 0) return { ...base, ufc: null, esSd: true, casoAplicado: 'SIN_DESARROLLO' };
    if (sumaA <= 0) return { ...base, ufc: null, esSd: true, casoAplicado: 'SIN_CONFIRMACION' };

    const divisor = volumen * (n1 + 0.1 * n2) * d;
    if (divisor <= 0) return { ...base, ufc: null, esSd: true, casoAplicado: 'ERROR_DIVISOR' };

    const N = sumaA / divisor;
    return { ...base, ufc: N, esSd: false, casoAplicado: 'NCh2676_porPlaca' };
}

/**
 * Punto de entrada para la ruta de cálculo.
 * Acepta array plano de placas (cada una con su dil).
 *
 * @param {{ volumen?: number, placas: Array<{dil, colonias?, confirmA?, confirmB?}> }} input
 */
function calcularUfcEnt({ volumen = 1, placas = [] } = {}) {
    const core = calcularDesdeGrupos(agruparPorDil(placas), volumen);
    const ufcRedondeado = core.ufc !== null ? Math.round(core.ufc) : null;

    return {
        nEnterobacterias: ufcRedondeado,
        ufcPorG: ufcRedondeado,
        operador: '=',
        esEstimado: false,
        incongruenciaDetectada: core.incongruenciaDetectada,
        observacionIncongruencia: core.observacionIncongruencia,
        casoAplicado: core.casoAplicado,
        esSd: core.esSd,
        sumaA: core.sumaA,
        n1: core.n1,
        n2: core.n2,
        d: core.d,
        detalle: core.detalle,
        advertencias: core.advertencias,
    };
}

module.exports = { calcularUfcEnt };
