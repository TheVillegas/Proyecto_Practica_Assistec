/**
 * Motor de cálculo NMP (Número Más Probable) — fiel a la calculadora oficial
 * ISO 7218 Cláusula 11 (Wilrich-Jarvis V5, 2017-01-09).
 *
 * Validado: reproduce EXACTAMENTE las tablas de referencia ISO 7218 Anexo C
 * (C.5–C.7) en las 6 salidas: MPN, log10(MPN), SD, IC 95% inferior/superior,
 * Rarity Index y Category. También reproduce la tabla NCh2047 (Anexo B) 3x3.
 *
 * PRINCIPIO DE DISEÑO
 * -------------------
 * La tabla NMP NO es la fuente de verdad: es el resultado de evaluar la ecuación
 * de máxima verosimilitud en un esquema concreto. Aquí el motor calcula; las
 * tablas quedan como fixtures de validación (ver mpn.golden.test.ts).
 *
 * Estructura central: la cantidad de MUESTRA ORIGINAL por tubo, v = d · w
 *   d = factor de dilución de la fila (1 = sin diluir, 0.1 = 1:10, 0.01 = 1:100)
 *   w = volumen inoculado por tubo (mL o g)
 * Si v se expresa en gramos de muestra original, el resultado sale en NMP/g
 * automáticamente, sin factores de corrección manuales.
 */

// ───────────────────────────────────────────────────────────── Tipos de dominio

/** Lectura de un tubo individual: positivo (+) o negativo (−). */
export type LecturaTubo = boolean;

/** Una dilución observada de una serie. */
export interface ConteoDilucion {
  /** k_j / x: tubos positivos en esta dilución. */
  positivos: number;
  /** n_j / n: tubos inoculados en esta dilución. */
  tubos: number;
  /** v_j = d·w: muestra ORIGINAL por tubo (g o mL).
   *  Ej: dilución 1:100 (d=0.01), 1 mL por tubo (w=1) ⇒ v = 0.01 g. */
  volumenMuestraPorTubo: number;
}

/** Estado del resultado según el patrón de positivos. */
export type EstadoMPN = 'cero' | 'estimado' | 'mayor_que' | 'invalido';

export interface ResultadoMPN {
  /** NMP por unidad de muestra original. 0 si todos negativos; Infinity si todos positivos. */
  mpn: number;
  /** log10(MPN). null en casos extremos. */
  log10Mpn: number | null;
  /** Desviación estándar de log10(MPN) (Wilrich). null en casos extremos. */
  sdLog10: number | null;
  /** Límite inferior del IC 95%. */
  limiteInferior: number | null;
  /** Límite superior del IC 95%. */
  limiteSuperior: number | null;
  /** Rarity Index ∈ (0,1]: probabilidad relativa del patrón observado vs. el más
   *  probable. Cercano a 1 = plausible; cercano a 0 = combinación rara/sospechosa. */
  rarityIndex: number | null;
  /** Categoría de rareza Wilrich: 1 = plausible (≥0.05), 2 = poco probable
   *  [0.01,0.05), 3 = improbable / revisar lecturas [0,0.01). */
  categoriaRareza: 1 | 2 | 3 | null;
  estado: EstadoMPN;
  /** Mensaje legible para mostrar / registrar en observaciones. */
  detalle: string;
}

// ─────────────────────────────────────────── Resolución de raíces (regula falsi)

/** Busca la raíz de f en [lo,hi] (f monótona, signos opuestos) por bisección
 *  geométrica: estable en escala logarítmica, sin riesgo de no converger. */
function resolverRaiz(f: (z: number) => number, lo = 1e-12, hi = 1e12, iter = 300): number {
  const fLo = f(lo);
  for (let i = 0; i < iter; i++) {
    const mid = Math.sqrt(lo * hi);
    const fMid = f(mid);
    if (fMid === 0) return mid;
    if (Math.sign(fMid) === Math.sign(fLo)) lo = mid;
    else hi = mid;
  }
  return Math.sqrt(lo * hi);
}

// ─────────────────────────────────────────────────── Núcleo: estimación MLE

/**
 * Ecuación de score (log-verosímil derivado, ISO 7218 / Wilrich):
 *   Σ_j v_j · ( x_j / (1 − e^{−v_j·λ}) − n_j ) = 0
 * Monótona decreciente en λ. λ = MPN por unidad de muestra original.
 */
export function estimarMPN(conteos: ConteoDilucion[]): number {
  const nSum = conteos.reduce((a, c) => a + c.tubos, 0);
  const xSum = conteos.reduce((a, c) => a + c.positivos, 0);
  if (xSum === 0) return 0;
  if (xSum === nSum) return Infinity;

  const score = (z: number) =>
    conteos.reduce((s, { positivos: x, tubos: n, volumenMuestraPorTubo: v }) => {
      if (v <= 0 || n <= 0) return s;
      return s + (x * v) / (1 - Math.exp(-v * z)) - n * v;
    }, 0);

  return resolverRaiz(score);
}

/**
 * SD de log10(MPN), fórmula Wilrich (información OBSERVADA, usa x_j):
 *   denom = Σ_j x_j·v_j²·e^{−v_j·λ} / (1 − e^{−v_j·λ})²
 *   SD = log10(e) · sqrt( 1 / (λ²·denom) )
 */
export function sdLog10MPN(conteos: ConteoDilucion[], mpn: number): number {
  const log10e = Math.LOG10E;
  const denom = conteos.reduce((s, { positivos: x, volumenMuestraPorTubo: v }) => {
    if (v <= 0) return s;
    const e = Math.exp(-v * mpn);
    return s + (x * v * v * e) / Math.pow(1 - e, 2);
  }, 0);
  return log10e * Math.sqrt(1 / (mpn * mpn * denom));
}

/** IC 95% caso regular: lognormal con factor 2 (Wilrich): MPN·exp(±2·SDln). */
function icRegular(mpn: number, sdLog10: number): { inferior: number; superior: number } {
  const sdLn = sdLog10 / Math.LOG10E; // pasa de escala log10 a ln
  return { inferior: mpn * Math.exp(-2 * sdLn), superior: mpn * Math.exp(2 * sdLn) };
}

/** Cota superior exacta cuando TODOS los tubos son negativos: ln(40)/Σ(n_j·v_j). */
function cotaSuperiorCero(conteos: ConteoDilucion[]): number {
  const denom = conteos.reduce(
    (s, { tubos: n, volumenMuestraPorTubo: v }) => (v > 0 && n > 0 ? s + n * v : s),
    0
  );
  return Math.log(40) / denom;
}

/** Cota inferior exacta cuando TODOS los tubos son positivos:
 *  resuelve Π_j (1 − e^{−v_j·z})^{n_j} = 0.025. */
function cotaInferiorInf(conteos: ConteoDilucion[]): number {
  const g = (z: number) =>
    conteos.reduce(
      (p, { tubos: n, volumenMuestraPorTubo: v }) =>
        v > 0 && n > 0 ? p * Math.pow(1 - Math.exp(-v * z), n) : p,
      1
    ) - 0.025;
  return resolverRaiz(g, 1e-9, 1e9);
}

/**
 * Rarity Index (Wilrich): razón entre la probabilidad del patrón observado y la
 * del patrón más probable dado el MPN estimado. Detecta lecturas incongruentes.
 *   nom   = Σ_j [ ln C(n_j,x_j) + x_j·ln(p_j) − (n_j−x_j)·v_j·λ ]
 *   denom = Σ_j [ ln C(n_j,x*_j) + x*_j·ln(p_j) − (n_j−x*_j)·v_j·λ ],  p_j = 1−e^{−v_j·λ}
 *   x*_j  = min(n_j, floor((n_j+1)·p_j))   (modo de la binomial)
 *   Rarity = exp(nom − denom)
 */
export function rarityIndex(conteos: ConteoDilucion[], mpn: number): number {
  let nom = 0;
  let denom = 0;
  for (const { positivos: x, tubos: n, volumenMuestraPorTubo: v } of conteos) {
    if (v <= 0 || n <= 0) continue;
    const p = 1 - Math.exp(-v * mpn);
    const xModa = Math.min(n, Math.floor((n + 1) * p));
    const lnP = Math.log(p);
    nom += lnComb(n, x) + x * lnP - (n - x) * v * mpn;
    denom += lnComb(n, xModa) + xModa * lnP - (n - xModa) * v * mpn;
  }
  return Math.exp(nom - denom);
}

function categoriaRareza(r: number): 1 | 2 | 3 {
  if (r < 0.01) return 3; // improbable: revisar lecturas
  if (r < 0.05) return 2; // poco probable
  return 1; // plausible
}

/** ln de la combinatoria C(n,k), estable vía lgamma. */
function lnComb(n: number, k: number): number {
  if (k < 0 || k > n) return -Infinity;
  return lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1);
}

/** ln Γ(x) — aproximación de Lanczos. */
function lnGamma(x: number): number {
  const g = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  x -= 1;
  let a = 0.99999999999980993;
  const t = x + 7.5;
  for (let i = 0; i < g.length; i++) a += g[i] / (x + i + 1);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

// ─────────────────────────────────────────────── API de alto nivel (semántica)

export function calcularMPN(conteos: ConteoDilucion[]): ResultadoMPN {
  for (const c of conteos) {
    if (
      c.positivos < 0 || c.tubos <= 0 || c.positivos > c.tubos ||
      !Number.isInteger(c.positivos) || !Number.isInteger(c.tubos) ||
      c.volumenMuestraPorTubo <= 0
    ) {
      return invalido(`Conteo inválido: x=${c.positivos}, n=${c.tubos}, v=${c.volumenMuestraPorTubo}`);
    }
  }

  const mpn = estimarMPN(conteos);

  if (mpn === 0) {
    return {
      mpn: 0, log10Mpn: null, sdLog10: null,
      limiteInferior: 0, limiteSuperior: cotaSuperiorCero(conteos),
      rarityIndex: 1, categoriaRareza: 1, estado: 'cero',
      detalle: 'Todos los tubos negativos: NMP = 0 con cota superior 95%.',
    };
  }

  if (!Number.isFinite(mpn)) {
    const nSum = conteos.reduce((a, c) => a + c.tubos, 0);
    return {
      mpn: Infinity, log10Mpn: null, sdLog10: null,
      limiteInferior: cotaInferiorInf(conteos), limiteSuperior: Infinity,
      rarityIndex: 1, categoriaRareza: 1, estado: 'mayor_que',
      detalle: `Todos los ${nSum} tubos positivos: NMP no acotado superiormente.`,
    };
  }

  const sd = sdLog10MPN(conteos, mpn);
  const { inferior, superior } = icRegular(mpn, sd);
  const rar = rarityIndex(conteos, mpn);

  return {
    mpn,
    log10Mpn: Math.log10(mpn),
    sdLog10: sd,
    limiteInferior: inferior,
    limiteSuperior: superior,
    rarityIndex: rar,
    categoriaRareza: categoriaRareza(rar),
    estado: 'estimado',
    detalle: 'NMP estimado por máxima verosimilitud (ISO 7218).',
  };
}

function invalido(detalle: string): ResultadoMPN {
  return {
    mpn: NaN, log10Mpn: null, sdLog10: null,
    limiteInferior: null, limiteSuperior: null,
    rarityIndex: null, categoriaRareza: null, estado: 'invalido', detalle,
  };
}

// ─────────────────────────────────────────── Adaptador desde el formulario (+/−)

/**
 * Convierte lecturas +/− del formulario en ConteoDilucion[].
 * @param lecturasPorDilucion  por dilución, el array de lecturas (+/−) de sus tubos.
 * @param volumenesMuestra     v = d·w por tubo, mismo orden que las diluciones.
 *   Ej (dil 1:10, inóculos 1/0.1/0.01 mL ⇒ v en g): [0.1, 0.01, 0.001]
 */
export function construirConteos(
  lecturasPorDilucion: LecturaTubo[][],
  volumenesMuestra: number[]
): ConteoDilucion[] {
  if (lecturasPorDilucion.length !== volumenesMuestra.length) {
    throw new Error('Cada dilución debe tener un volumen de muestra (v = d·w) asociado.');
  }
  return lecturasPorDilucion.map((tubos, j) => ({
    positivos: tubos.filter(Boolean).length,
    tubos: tubos.length,
    volumenMuestraPorTubo: volumenesMuestra[j],
  }));
}
