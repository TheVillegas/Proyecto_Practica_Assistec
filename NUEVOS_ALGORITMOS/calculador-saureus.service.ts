import { CalculadorBase, DatosMuestra, ResultadoCalculo } from './calculador.base';

/**
 * Calculador de S. aureus — NCh 2671.Of2002
 * Modelo: cada PLACA trae su propia dilución.
 *
 * Payload:
 *   { volumen, placas: [{ c24h, c48h, dil, aConfirmar, coag4a6h, coag24h }, ...] }
 *
 * Por placa:
 *   C = c48h (o c24h/mayor según coloniaUsada)
 *   b = coag4a6h + coag24h
 *   a = C · (b / A)
 *
 * Agrupación interna por dilución (para n1, n2, d):
 *   - Se ordenan las diluciones de más concentrada (|dil| menor) a más diluida.
 *   - d  = 10^(-dil más concentrada)
 *   - n1 = nº de placas en la 1ª dilución
 *   - n2 = nº de placas en la 2ª dilución
 *   - Si hay más de 2 diluciones distintas → advertencia (NCh usa máx 2)
 *
 * N = Σa / ( V · (n1 + 0,1·n2) · d )
 */

export interface PlacaSaureusInput {
  c24h: number | null;        // colonias presuntivas lectura 24 h
  c48h: number | null;        // colonias presuntivas lectura 48 h
  dil: number;                // entero positivo (2 → 10^-2)
  aConfirmar: number | null;  // colonias traspasadas a coagulasa (1..5)
  coag4a6h: number | null;    // coagulasa+ a 4-6 h
  coag24h: number | null;     // coagulasa+ a 24 h (solo las nuevas)
}

export interface MuestraSaureus {
  placas: PlacaSaureusInput[];
  volumen?: number;           // mL por placa (default 1)
}

export interface OpcionesSaureus {
  coloniaUsada?: '24h' | '48h' | 'mayor'; // qué lectura usar como C (default '48h')
  maxTraspasoPorPlaca?: number;            // default 5
  volumenPorDefecto?: number;              // default 1
}

export interface DetallePlacaSaureus {
  dil: number;
  C: number;
  A: number;
  b: number;
  a: number | null;
  tiempo: '4-6h' | '24h' | '4-6h+24h' | null;
  error: string | null;
}

export interface ResultadoSaureus extends ResultadoCalculo {
  d?: number;
  detalle?: DetallePlacaSaureus[];
  advertencias?: string[];
}

export class CalculadorSaureusService extends CalculadorBase {
  private readonly maxA: number;
  private readonly volDef: number;
  private readonly coloniaUsada: '24h' | '48h' | 'mayor';

  constructor(opciones: OpcionesSaureus = {}) {
    super();
    this.maxA = opciones.maxTraspasoPorPlaca ?? 5;
    this.volDef = opciones.volumenPorDefecto ?? 1;
    this.coloniaUsada = opciones.coloniaUsada ?? '48h';
  }

  calcularSaureus(m: MuestraSaureus): ResultadoSaureus {
    const advertencias: string[] = [];
    const volumen = m.volumen ?? this.volDef;
    const detalle: DetallePlacaSaureus[] = [];

    if (!m.placas || m.placas.length === 0)
      return this.sd('Sin datos de placas.', 0, advertencias);

    // 1. Evaluar cada placa
    let sumaA = 0;
    for (const p of m.placas) {
      const det = this.evaluarPlaca(p, advertencias);
      detalle.push(det);
      if (det.a != null && det.error == null) sumaA += det.a;
    }

    // 2. Agrupar por dilución (ordenadas de más concentrada a más diluida)
    const dilsUnicas = [...new Set(m.placas.map(p => p.dil))].sort((a, b) => a - b);
    if (dilsUnicas.length > 2)
      advertencias.push(`Se ingresaron ${dilsUnicas.length} diluciones distintas; la NCh usa máx 2. Se usan las dos más concentradas.`);

    const dil1 = dilsUnicas[0];
    const dil2 = dilsUnicas[1];
    const d = Math.pow(10, -Math.abs(dil1));
    const n1 = detalle.filter(det => det.dil === dil1 && det.C >= 0).length;
    const n2 = dil2 !== undefined ? detalle.filter(det => det.dil === dil2 && det.C >= 0).length : 0;

    // 3. Resultado
    const totalColonias = detalle.reduce((s, d) => s + d.C, 0);

    const base: ResultadoSaureus = {
      ufc: null, textoReporte: 'SD', operador: '=', esSd: false,
      sumaA, sumaColonias: totalColonias, n1, n2, d, detalle, advertencias,
      coagulasaUsada: this.tiempoGlobal(detalle),
      casoAplicado: 'NCh2671_porPlaca', factorDilucion: d,
    };

    if (totalColonias <= 0)
      return { ...base, esSd: true, textoReporte: 'SD', casoAplicado: 'SIN_DESARROLLO' };
    if (sumaA <= 0)
      return { ...base, esSd: true, textoReporte: 'SD', casoAplicado: 'SIN_CONFIRMACION' };

    const divisor = volumen * (n1 + 0.1 * n2) * d;
    if (divisor <= 0)
      return { ...base, esSd: true, textoReporte: 'SD', casoAplicado: 'ERROR_DIVISOR' };

    const N = sumaA / divisor;
    return {
      ...base, ufc: N, operador: '=',
      textoReporte: `${this.redondearDosCifras(N)} UFC/g`,
      casoAplicado: 'N_NORMAL',
    };
  }

  /** Adaptador para la fábrica existente (DatosMuestra legacy). */
  calcular(datos: DatosMuestra): ResultadoSaureus {
    const dil = Math.abs(datos.diluciones?.[0]?.dil ?? 1);
    const idx = (a: any[] | undefined, i: number) => (a ? a[i] : null);
    const placas: PlacaSaureusInput[] = [0, 1].map(i => ({
      c24h: idx(datos.coloniasPosibles as any, i),
      c48h: idx(datos.coloniasPosibles as any, i),
      dil,
      aConfirmar: idx(datos.colConfirmar as any, i),
      coag4a6h: idx(datos.coagulasa4h as any, i),
      coag24h: idx(datos.coagulasa24h as any, i),
    })).filter(p => p.c24h != null || p.aConfirmar != null);
    return this.calcularSaureus({ volumen: datos.volumen, placas });
  }

  // ─── helpers ───────────────────────────────────────────────────────────────

  private evaluarPlaca(p: PlacaSaureusInput, advertencias: string[]): DetallePlacaSaureus {
    const C = this.elegirC(p);
    const A = p.aConfirmar ?? 0;
    const { b, tiempo } = this.confirmadas(p.coag4a6h, p.coag24h);

    let error: string | null = null;
    let a: number | null = null;

    if (A > this.maxA)
      error = `A=${A} supera el máximo de ${this.maxA} por placa`;
    else if (A < 1 && C > 0)
      error = `A=0: falta traspaso (hay ${C} colonias presuntivas)`;
    else if (A > C)
      error = `A>C (traspasadas ${A} > colonias ${C})`;
    else if (b > A)
      error = `b>A (confirmadas ${b} > traspasadas ${A})`;
    else
      a = C > 0 ? C * (b / A) : 0;

    if (error) advertencias.push(`dil ${p.dil}: ${error}.`);
    return { dil: p.dil, C, A, b, a, tiempo, error };
  }

  private elegirC(p: PlacaSaureusInput): number {
    const c24 = p.c24h, c48 = p.c48h;
    if (this.coloniaUsada === '24h') return c24 ?? c48 ?? 0;
    if (this.coloniaUsada === 'mayor') return Math.max(c24 ?? 0, c48 ?? 0);
    return c48 ?? c24 ?? 0; // '48h' (default)
  }

  private confirmadas(c4a6: number | null, c24: number | null): {
    b: number; tiempo: DetallePlacaSaureus['tiempo'];
  } {
    const v4 = c4a6 ?? 0, v24 = c24 ?? 0;
    const b = v4 + v24;
    let tiempo: DetallePlacaSaureus['tiempo'] = null;
    if (v4 > 0 && v24 > 0) tiempo = '4-6h+24h';
    else if (v4 > 0) tiempo = '4-6h';
    else if (v24 > 0) tiempo = '24h';
    return { b, tiempo };
  }

  private tiempoGlobal(det: DetallePlacaSaureus[]): string | null {
    const u4 = det.some(d => d.tiempo === '4-6h' || d.tiempo === '4-6h+24h');
    const u24 = det.some(d => d.tiempo === '24h' || d.tiempo === '4-6h+24h');
    if (u4 && u24) return '4-6h+24h';
    if (u4) return '4-6 hrs';
    if (u24) return '24 hrs';
    return null;
  }

  private sd(motivo: string, d: number, advertencias: string[]): ResultadoSaureus {
    return {
      ufc: null, textoReporte: 'SD', operador: '=', esSd: true,
      sumaA: 0, sumaColonias: 0, n1: 0, n2: 0, d, detalle: [],
      advertencias: [...advertencias, motivo],
      coagulasaUsada: null, casoAplicado: 'SIN_DATOS', factorDilucion: d,
    };
  }
}
