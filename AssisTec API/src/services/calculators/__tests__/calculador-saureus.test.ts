import { CalculadorSaureusService, MuestraSaureus } from '../calculador-saureus.service';

describe('CalculadorSaureusService — NCh 2671 (per-placa)', () => {
  let calc: CalculadorSaureusService;

  beforeEach(() => {
    calc = new CalculadorSaureusService();
  });

  // Caso 1: reproduce el Excel oficial → 2,9 × 10³
  it('caso Excel real: dil 2, dos placas → 2,9 × 10³ UFC/g', () => {
    // Placa A: c48=23, A=5, b=3 → a = 23*(3/5) = 13.8
    // Placa B: c48=45, A=4, b=4 → a = 45*(4/4) = 45
    // Σa=58.8, n1=2, d=0.01 → N = 58.8/0.02 = 2940
    const m: MuestraSaureus = {
      diluciones: [{ dil: 2, placas: [
        { colonias24h: 22, colonias48h: 23, aConfirmar: 5, coag4a6h: 3, coag24h: 0 },
        { colonias24h: 40, colonias48h: 45, aConfirmar: 4, coag4a6h: 4, coag24h: 0 },
      ]}]
    };
    const r = calc.calcularSaureus(m);
    expect(r.esSd).toBe(false);
    expect(r.ufc).toBeCloseTo(2940, 0);
    expect(r.textoReporte).toContain('2,9');
  });

  // Caso 2: ejemplo supervisora → 1,2 × 10²
  it('caso supervisora: 1 placa, c=58, A=5, b=1@24h, dil 1 → 1,2 × 10² UFC/g', () => {
    // a = 58*(1/5) = 11.6; n1=1, d=0.1 → N = 11.6/0.1 = 116
    const m: MuestraSaureus = {
      diluciones: [{ dil: 1, placas: [
        { colonias24h: null, colonias48h: 58, aConfirmar: 5, coag4a6h: 0, coag24h: 1 },
      ]}]
    };
    const r = calc.calcularSaureus(m);
    expect(r.esSd).toBe(false);
    expect(r.ufc).toBeCloseTo(116, 0);
    expect(r.textoReporte).toContain('1,2');
  });

  // Caso 3: A confirma a 4-6h, B solo a 24h — la coagulasa incremental no pierde a B
  it('caso coagulasa mixta: A 4-6h, B solo 24h → 2,2 × 10³ UFC/g', () => {
    // a_A = 40*(3/5) = 24; a_B = 50*(2/5) = 20; Σa=44, n1=2, d=0.01 → N=2200
    const m: MuestraSaureus = {
      diluciones: [{ dil: 2, placas: [
        { colonias24h: null, colonias48h: 40, aConfirmar: 5, coag4a6h: 3, coag24h: 0 },
        { colonias24h: null, colonias48h: 50, aConfirmar: 5, coag4a6h: 0, coag24h: 2 },
      ]}]
    };
    const r = calc.calcularSaureus(m);
    expect(r.esSd).toBe(false);
    expect(r.ufc).toBeCloseTo(2200, 0);
    expect(r.textoReporte).toContain('2,2');
  });

  // Caso 4: sin colonias presuntivas → SD
  it('sin desarrollo: colonias = 0 → SD', () => {
    const m: MuestraSaureus = {
      diluciones: [{ dil: 2, placas: [
        { colonias24h: 0, colonias48h: 0, aConfirmar: 0, coag4a6h: 0, coag24h: 0 },
      ]}]
    };
    const r = calc.calcularSaureus(m);
    expect(r.esSd).toBe(true);
    expect(r.textoReporte).toBe('SD');
    expect(r.casoAplicado).toBe('SIN_DESARROLLO');
  });

  // Caso 5: colonias presentes pero b = 0 → SD
  it('sin confirmación: colonias > 0, b = 0 → SD', () => {
    const m: MuestraSaureus = {
      diluciones: [{ dil: 2, placas: [
        { colonias24h: null, colonias48h: 40, aConfirmar: 5, coag4a6h: 0, coag24h: 0 },
      ]}]
    };
    const r = calc.calcularSaureus(m);
    expect(r.esSd).toBe(true);
    expect(r.textoReporte).toBe('SD');
    expect(r.casoAplicado).toBe('SIN_CONFIRMACION');
  });

  // Caso 6: A = 6 → placa rechazada con advertencia, no aporta al resultado
  it('A = 6 rechazada: placa excluida con advertencia', () => {
    const m: MuestraSaureus = {
      diluciones: [{ dil: 2, placas: [
        { colonias24h: null, colonias48h: 40, aConfirmar: 6, coag4a6h: 3, coag24h: 0 },
      ]}]
    };
    const r = calc.calcularSaureus(m);
    expect(r.advertencias?.some(a => a.includes('máx 5'))).toBe(true);
    expect(r.detalle?.find(d => d.A === 6)?.error).toBeTruthy();
    // La única placa fue rechazada → SD por falta de confirmación
    expect(r.esSd).toBe(true);
  });

  // Caso 7: dos diluciones → usa n₁ + 0,1·n₂ en el divisor
  it('dos diluciones: usa n₁ + 0,1·n₂ en divisor', () => {
    // dil 2 (1 placa): a = 30*(3/5)=18
    // dil 3 (1 placa): a = 40*(4/5)=32
    // Σa=50, d=0.01 (dil más concentrada), n1=1, n2=1
    // N = 50 / (1 * (1 + 0.1*1) * 0.01) = 50 / 0.011 ≈ 4545
    const m: MuestraSaureus = {
      diluciones: [
        { dil: 2, placas: [{ colonias24h: null, colonias48h: 30, aConfirmar: 5, coag4a6h: 3, coag24h: 0 }] },
        { dil: 3, placas: [{ colonias24h: null, colonias48h: 40, aConfirmar: 5, coag4a6h: 4, coag24h: 0 }] },
      ]
    };
    const r = calc.calcularSaureus(m);
    expect(r.esSd).toBe(false);
    expect(r.n1).toBe(1);
    expect(r.n2).toBe(1);
    expect(r.d).toBeCloseTo(0.01);
    expect(r.ufc).toBeCloseTo(50 / (1.1 * 0.01), 0);
  });
});
