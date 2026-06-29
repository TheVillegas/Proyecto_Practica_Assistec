/**
 * Tests de regresión del motor NMP.
 *
 * Fuentes de verdad (golden sets):
 *   1. Tabla 3x3 NCh2047 / Anexo B (esquema 10/1/0.1 mL → NMP/100 mL).
 *   2. ISO 7218 Anexo C, Tablas C.5–C.7 (MPN, SD, IC, Rarity, Category).
 *
 * Si un cambio futuro rompe un valor, estos tests lo detectan.
 */
import {
  calcularMPN,
  construirConteos,
  estimarMPN,
  ConteoDilucion,
} from '../../src/calculators/mpnColi.engine';

const arr = (n: number, x: number): boolean[] => Array.from({ length: n }, (_, i) => i < x);
const sig = (v: number, n = 2) => Number(v.toPrecision(n));

// ───────────────────────────── 1. Tabla NCh2047 (10/1/0.1 mL → /100 mL)

const TABLA_100ML: Record<string, number> = {
  '0,0,0': 0, '0,0,1': 3, '0,1,0': 3, '0,1,1': 6.1, '0,2,0': 6.2, '0,2,1': 9.2,
  '0,3,0': 9.4, '1,0,0': 3.6, '1,0,1': 7.2, '1,0,2': 11, '1,1,0': 7.3, '1,1,1': 11,
  '1,1,2': 15, '1,2,0': 11, '1,2,1': 15, '1,3,0': 16, '1,3,1': 20, '2,0,0': 9.1,
  '2,0,1': 14, '2,0,2': 20, '2,1,0': 15, '2,1,1': 20, '2,1,2': 27, '2,2,0': 21,
  '2,2,1': 28, '2,2,2': 35, '2,3,0': 29, '2,3,1': 36, '3,0,0': 23, '3,0,1': 39,
  '3,0,2': 64, '3,1,0': 43, '3,1,1': 75, '3,1,2': 120, '3,2,0': 93, '3,2,1': 150,
  '3,2,2': 210, '3,3,0': 240, '3,3,1': 460, '3,3,2': 1100,
};
const V_100ML = [10, 1, 0.1];

describe('Motor NMP vs tabla NCh2047 (3x3)', () => {
  for (const [combo, esperado] of Object.entries(TABLA_100ML)) {
    it(`${combo} ≈ ${esperado} NMP/100 mL`, () => {
      const [k1, k2, k3] = combo.split(',').map(Number);
      const conteos = construirConteos([arr(3, k1), arr(3, k2), arr(3, k3)], V_100ML);
      const calc = estimarMPN(conteos) * 100;
      expect(Math.abs(calc - esperado)).toBeLessThanOrEqual(Math.max(0.5, 0.12 * esperado));
    });
  }
});

// ───────────────────────────── 2. ISO 7218 Anexo C (d=1/0.1/0.01, w=1, n=3)

const V_ISO = [1, 0.1, 0.01];
type CasoISO = {
  x: [number, number, number];
  mpn: number; sd: number | null; lo: number; up: number; rar: number; cat: 1 | 2 | 3;
};
const CASOS_ISO: CasoISO[] = [
  { x: [0, 0, 0], mpn: 0,    sd: null, lo: 0,     up: 1.1, rar: 1,     cat: 1 },
  { x: [0, 1, 0], mpn: 0.3,  sd: 0.43, lo: 0.041, up: 2.3, rar: 0.087, cat: 1 },
  { x: [1, 0, 0], mpn: 0.36, sd: 0.44, lo: 0.048, up: 2.7, rar: 1,     cat: 1 },
  { x: [1, 0, 1], mpn: 0.72, sd: 0.31, lo: 0.17,  up: 3.0, rar: 0.021, cat: 2 },
  { x: [1, 1, 0], mpn: 0.74, sd: 0.31, lo: 0.18,  up: 3.1, rar: 0.211, cat: 1 },
  { x: [1, 2, 0], mpn: 1.1,  sd: 0.26, lo: 0.35,  up: 3.7, rar: 0.021, cat: 2 },
  { x: [2, 0, 0], mpn: 0.92, sd: 0.32, lo: 0.21,  up: 4.0, rar: 1,     cat: 1 },
];

describe('Motor NMP vs ISO 7218 Anexo C', () => {
  for (const c of CASOS_ISO) {
    it(`x=${c.x.join(',')} reproduce MPN/SD/IC/rareza ISO`, () => {
      const r = calcularMPN(construirConteos([arr(3, c.x[0]), arr(3, c.x[1]), arr(3, c.x[2])], V_ISO));
      if (c.mpn === 0) {
        expect(r.estado).toBe('cero');
        expect(r.mpn).toBe(0);
      } else {
        expect(sig(r.mpn)).toBe(c.mpn);
        expect(sig(r.sdLog10!)).toBe(c.sd);
      }
      expect(sig(r.limiteInferior!)).toBe(c.lo);
      expect(sig(r.limiteSuperior!)).toBe(c.up);
      expect(r.categoriaRareza).toBe(c.cat);
    });
  }
});

// ───────────────────────────── 3. Casos extremos y de control de calidad

describe('Casos extremos', () => {
  it('todos negativos ⇒ estado "cero" con cota superior exacta', () => {
    const r = calcularMPN(construirConteos([arr(3, 0), arr(3, 0), arr(3, 0)], V_ISO));
    expect(r.estado).toBe('cero');
    expect(r.limiteSuperior).toBeCloseTo(Math.log(40) / (3 * (1 + 0.1 + 0.01)), 5);
  });

  it('todos positivos ⇒ estado "mayor_que" (no se fuerza a 1100)', () => {
    const r = calcularMPN(construirConteos([arr(3, 3), arr(3, 3), arr(3, 3)], V_ISO));
    expect(r.estado).toBe('mayor_que');
    expect(r.mpn).toBe(Infinity);
    expect(r.limiteInferior).toBeGreaterThan(0); // cota inferior exacta finita
  });

  it('lectura incongruente (0,3,0) ⇒ categoría de rareza 3 (revisar)', () => {
    const r = calcularMPN(construirConteos([arr(3, 0), arr(3, 3), arr(3, 0)], V_ISO));
    expect(r.categoriaRareza).toBe(3);
  });

  it('rechaza conteo inválido (positivos > tubos)', () => {
    const conteos: ConteoDilucion[] = [{ positivos: 5, tubos: 3, volumenMuestraPorTubo: 1 }];
    expect(calcularMPN(conteos).estado).toBe('invalido');
  });
});
