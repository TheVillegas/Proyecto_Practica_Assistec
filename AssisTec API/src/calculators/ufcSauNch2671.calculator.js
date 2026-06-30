/**
 * Calculador de S. aureus — NCh 2671.Of2002 (modelo per-placa).
 *
 * Por placa:
 *   C   = colonias48h (o 24h si no hay 48h)
 *   b   = coag4a6h + coag24h  (incremental)
 *   a   = C * (b / A)
 *
 * N = Σa / ( V * (n1 + 0.1*n2) * d )
 *   d  = 10^(−|dil|)  ;  dil entra como entero positivo (2 → 10^-2)
 *   n1 = nº placas 1ª dilución ; n2 = nº placas 2ª dilución
 *
 * Validaciones por placa: A > 5, A > C, b > A, A=0 con colonias → placa no aporta.
 * Sin colonias presuntivas o sin confirmación → "SD".
 */

const MAX_A = 5;

/**
 * Redondea a 2 cifras significativas con formato español "x,y × 10ᶻ".
 */
function redondearDosCifras(valor) {
  if (valor === 0) return '0';
  const orden = Math.floor(Math.log10(Math.abs(valor)));
  const factor = Math.pow(10, 1 - orden);
  const redondeado = Math.round(valor * factor) / factor;
  const exponente = Math.floor(Math.log10(Math.abs(redondeado)));
  const mantisaStr = (redondeado / Math.pow(10, exponente)).toFixed(1).replace('.', ',');
  const sup = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const expStr = Math.abs(exponente).toString().split('').map(d => sup[d]).join('');
  const signo = exponente < 0 ? '⁻' : '';
  return `${mantisaStr} x 10${signo}${expStr}`;
}

/**
 * Agrupa un array plano de placas (cada una con su dil) en DilucionSaureus[].
 * @param {Array<{dil: number, colonias24h?, colonias48h?, aConfirmar?, coag4a6h?, coag24h?}>} placas
 * @returns {Array<{dil: number, placas: Array}>}
 */
function agruparPorDil(placas) {
  const map = new Map();
  for (const p of placas) {
    if (!map.has(p.dil)) map.set(p.dil, []);
    map.get(p.dil).push({
      colonias24h: p.colonias24h ?? null,
      colonias48h: p.colonias48h ?? null,
      aConfirmar: p.aConfirmar ?? null,
      coag4a6h: p.coag4a6h ?? null,
      coag24h: p.coag24h ?? null,
    });
  }
  return Array.from(map.entries())
    .map(([dil, pl]) => ({ dil, placas: pl }))
    .sort((a, b) => Math.abs(a.dil) - Math.abs(b.dil));
}

/**
 * Elige la lectura de colonias (C) para la placa.
 * Default: colonias48h; fallback: colonias24h.
 */
function elegirC(p) {
  return p.colonias48h ?? p.colonias24h ?? 0;
}

/**
 * Evalúa una placa y calcula su aporte 'a'.
 * @returns {{ colonias, A, b, a, error, tiempo } | null}
 */
function evaluarPlaca(p, dil, advertencias) {
  const tieneAlgo = [p.colonias24h, p.colonias48h, p.aConfirmar, p.coag4a6h, p.coag24h].some(v => v != null);
  if (!tieneAlgo) return null;

  const colonias = elegirC(p);
  const A = p.aConfirmar ?? 0;
  const v4 = p.coag4a6h ?? 0;
  const v24 = p.coag24h ?? 0;
  const b = v4 + v24;
  const tiempo = v4 > 0 && v24 > 0 ? '4-6h+24h' : v4 > 0 ? '4-6h' : v24 > 0 ? '24h' : null;

  let error = null, a = null;
  if (A > MAX_A)            error = `A>${MAX_A} (máx ${MAX_A} por placa)`;
  else if (A > colonias)    error = `A>colonias (${A}>${colonias})`;
  else if (b > A)           error = `b>A (${b}>${A})`;
  else if (colonias > 0 && A === 0) error = 'falta traspaso (A=0 con colonias presentes)';
  else a = colonias > 0 ? colonias * (b / A) : 0;

  if (error) advertencias.push(`dil ${dil}: ${error}.`);
  return { colonias, A, b, a, error, tiempo };
}

/**
 * Calcula S. aureus a partir de diluciones agrupadas (formato interno).
 * @param {Array<{dil: number, placas: Array}>} diluciones
 * @param {number} volumen
 */
function calcularDesdeGrupos(diluciones, volumen = 1) {
  const advertencias = [];
  const detalle = [];
  let sumaA = 0, totalColonias = 0;
  const nPorIndice = [];

  // Ordenar de más concentrada a más diluida (|dil| menor primero)
  const dils = [...diluciones]
    .filter(x => x && x.placas && x.placas.length)
    .sort((a, b) => Math.abs(a.dil) - Math.abs(b.dil));

  if (dils.length === 0) {
    return { ufc: null, textoReporte: 'SD', esSd: true, casoAplicado: 'SIN_DATOS', sumaA: 0, sumaColonias: 0, advertencias: ['Sin datos de diluciones.'] };
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
      if (det.colonias != null) nPlacas++;
      if (det.a != null && det.error == null) sumaA += det.a;
    }
    nPorIndice[i] = nPlacas;
  });

  const dilBase = dils[0].dil;
  const d = Math.pow(10, -Math.abs(dilBase));
  const n1 = nPorIndice[0] ?? 0;
  const n2 = nPorIndice[1] ?? 0;

  const base = { sumaA, sumaColonias: totalColonias, n1, n2, d, detalle, advertencias, factorDilucion: d };

  if (totalColonias <= 0) return { ...base, ufc: null, textoReporte: 'SD', esSd: true, casoAplicado: 'SIN_DESARROLLO' };
  if (sumaA <= 0)         return { ...base, ufc: null, textoReporte: 'SD', esSd: true, casoAplicado: 'SIN_CONFIRMACION' };

  const divisor = volumen * (n1 + 0.1 * n2) * d;
  if (divisor <= 0)       return { ...base, ufc: null, textoReporte: 'SD', esSd: true, casoAplicado: 'ERROR_DIVISOR' };

  const N = sumaA / divisor;
  return { ...base, ufc: N, textoReporte: `${redondearDosCifras(N)} UFC/g`, esSd: false, casoAplicado: 'NCh2671_porPlaca' };
}

/**
 * Punto de entrada para la ruta de cálculo.
 * Acepta array plano de placas (cada una con su dil).
 *
 * @param {{ placas: Array<{dil, colonias24h?, colonias48h?, aConfirmar?, coag4a6h?, coag24h?}>, volumen?: number }} input
 */
function calcularUfcSauNch2671({ placas = [], volumen = 1 } = {}) {
  return calcularDesdeGrupos(agruparPorDil(placas), volumen);
}

/**
 * Punto de entrada para el servicio CRUD (datos desde etapas del DB).
 *
 * @param {{
 *   etapa1Lecturas: Array<{conteo24hPlaca1?, conteo24hPlaca2?, conteo48hPlaca1?, conteo48hPlaca2?}>,
 *   etapa3Lecturas: Array<{coloniasPlaca1?, coloniasPlaca2?}>,   ← aConfirmar por placa
 *   etapa4Lecturas: Array<{tipoLectura: string, coloniasPlaca1?, coloniasPlaca2?}>,
 *   dilDefecto?: number   ← exponente negativo; default -1 (limitación del modelo SauMuestra)
 * }} etapas
 */
function calcularUfcSauDesdeEtapas({ etapa1Lecturas = [], etapa3Lecturas = [], etapa4Lecturas = [], dilDefecto = -1 } = {}) {
  if (etapa1Lecturas.length === 0) {
    return calcularDesdeGrupos([], 1);
  }

  const lect1 = etapa1Lecturas[0];
  const lect3 = etapa3Lecturas[0];
  const lect4_46h = etapa4Lecturas.find(l => l.tipoLectura === '4-6h');
  const lect4_24h = etapa4Lecturas.find(l => l.tipoLectura === '24h');

  const toNum = v => (v != null ? Number(v) : null);

  const placaA = {
    colonias24h: toNum(lect1.conteo24hPlaca1),
    colonias48h: toNum(lect1.conteo48hPlaca1),
    aConfirmar:  lect3 ? toNum(lect3.coloniasPlaca1) : null,
    coag4a6h:    lect4_46h ? toNum(lect4_46h.coloniasPlaca1) : null,
    coag24h:     lect4_24h ? toNum(lect4_24h.coloniasPlaca1) : null,
  };
  const placaB = {
    colonias24h: toNum(lect1.conteo24hPlaca2),
    colonias48h: toNum(lect1.conteo48hPlaca2),
    aConfirmar:  lect3 ? toNum(lect3.coloniasPlaca2) : null,
    coag4a6h:    lect4_46h ? toNum(lect4_46h.coloniasPlaca2) : null,
    coag24h:     lect4_24h ? toNum(lect4_24h.coloniasPlaca2) : null,
  };

  const diluciones = [{ dil: dilDefecto, placas: [placaA, placaB] }];
  return calcularDesdeGrupos(diluciones, 1);
}

module.exports = { calcularUfcSauNch2671, calcularUfcSauDesdeEtapas, agruparPorDil };
