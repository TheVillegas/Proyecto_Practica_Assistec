import { CalculadorBase, DatosMuestra, ResultadoCalculo } from './calculador.base';

/**
 * Calculador de S. aureus — NCh 2671.Of2002 (modelo PER-PLACA, reproduce el Excel).
 *
 * Por placa:  a = colonias · ( b / A )          // "Final number of colonies"
 *   colonias = recuento de colonias presuntivas de la placa
 *   A        = colonias traspasadas a coagulasa (1..5 por placa)
 *   b        = coagulasa+ (4-6 h) + coagulasa+ (24 h)   [incremental]
 *
 * Σa = Σ a (todas las placas de las diluciones seleccionadas)
 * N  = Σa / ( V · (n1 + 0,1·n2) · d )
 *   n1 = nº placas 1ª dilución ; n2 = nº placas 2ª dilución
 *   d  = 10^(-dilucion) ; la dilución entra como entero positivo (2 -> 10^-2)
 *
 * Casos: sin colonias presuntivas o sin confirmación -> "SD". (No se usa NE.)
 */

export interface PlacaSaureus {
  colonias24h: number | null;  // colonias_1 / colonias_3  (lectura 24 h)
  colonias48h: number | null;  // colonias_2 / colonias_4  (lectura 48 h)
  aConfirmar: number | null;   // Colonies to confirm (1..5)
  coag4a6h: number | null;     // coagulasa + a 4-6 h
  coag24h: number | null;      // coagulasa + a 24 h
}
export interface DilucionSaureus {
  dil: number;                 // entero positivo: 2 -> 10^-2
  placas: PlacaSaureus[];      // normalmente 2 (placa A y B)
}
export interface MuestraSaureus {
  diluciones: DilucionSaureus[];
  volumen?: number;            // mL/placa (default 1)
}
export interface OpcionesSaureus {
  coloniaUsada?: '24h' | '48h' | 'mayor'; // qué lectura usar como C (default '48h')
  maxTraspasoPorPlaca?: number;           // default 5
  volumenPorDefecto?: number;             // default 1
}
export interface DetallePlacaSaureus {
  dil: number; colonias: number; A: number; b: number; a: number | null;
  tiempo: '4-6h' | '24h' | '4-6h+24h' | null; error: string | null;
}
export interface ResultadoSaureus extends ResultadoCalculo {
  d?: number; n1?: number; n2?: number;
  detalle?: DetallePlacaSaureus[]; advertencias?: string[];
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

    // Diluciones de más concentrada (|dil| menor) a más diluida
    const dils = [...(m.diluciones ?? [])]
      .filter(x => x && x.placas && x.placas.length)
      .sort((a, b) => Math.abs(a.dil) - Math.abs(b.dil));

    if (dils.length === 0) return this.sd('Sin datos de diluciones.', 0);

    let sumaA = 0, totalColonias = 0;
    const nPorIndice: number[] = [];

    dils.forEach((grupo, i) => {
      let nPlacas = 0;
      for (const p of grupo.placas) {
        const det = this.evaluarPlaca(p, grupo.dil, advertencias);
        if (!det) continue;
        detalle.push(det);
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
    if (dils.length > 2)
      advertencias.push('Se ingresaron más de 2 diluciones; la NCh usa 2. Se usan las dos más concentradas.');

    const baseRes: ResultadoSaureus = {
      ufc: null, textoReporte: 'SD', operador: '=', esSd: false,
      sumaA, sumaColonias: totalColonias, n1, n2, d, detalle, advertencias,
      coagulasaUsada: this.tiempoGlobal(detalle),
      casoAplicado: 'NCh2671_porPlaca', factorDilucion: d,
    };

    // Sin colonias presuntivas, o ninguna confirmó -> SD
    if (totalColonias <= 0) return { ...baseRes, esSd: true, textoReporte: 'SD', casoAplicado: 'SIN_DESARROLLO' };
    if (sumaA <= 0) return { ...baseRes, esSd: true, textoReporte: 'SD', casoAplicado: 'SIN_CONFIRMACION' };

    const divisor = volumen * (n1 + 0.1 * n2) * d;
    if (divisor <= 0) return { ...baseRes, esSd: true, textoReporte: 'SD', casoAplicado: 'ERROR_DIVISOR' };

    const N = sumaA / divisor;
    return { ...baseRes, ufc: N, operador: '=', textoReporte: `${this.redondearDosCifras(N)} UFC/g`, casoAplicado: 'N_NORMAL' };
  }

  /** Adaptador para la fábrica (DatosMuestra legacy [A,B]). */
  calcular(datos: DatosMuestra): ResultadoSaureus {
    const dil = Math.abs(datos.diluciones?.[0]?.dil ?? 1);
    const idx = (a: any[] | undefined, i: number) => (a ? a[i] : null);
    const placa = (i: number): PlacaSaureus => ({
      colonias24h: idx(datos.coloniasPosibles as any, i),
      colonias48h: idx(datos.coloniasPosibles as any, i),
      aConfirmar: idx(datos.colConfirmar as any, i),
      coag4a6h: idx(datos.coagulasa4h as any, i),
      coag24h: idx(datos.coagulasa24h as any, i),
    });
    return this.calcularSaureus({ volumen: datos.volumen, diluciones: [{ dil, placas: [placa(0), placa(1)] }] });
  }

  private evaluarPlaca(p: PlacaSaureus, dil: number, advertencias: string[]): DetallePlacaSaureus | null {
    const tieneAlgo = [p.colonias24h, p.colonias48h, p.aConfirmar, p.coag4a6h, p.coag24h].some(v => v != null);
    if (!tieneAlgo) return null;
    const colonias = this.elegirC(p);
    const A = p.aConfirmar ?? 0;
    const { b, tiempo } = this.confirmadas(p.coag4a6h, p.coag24h);

    let error: string | null = null, a: number | null = null;
    if (A > this.maxA) error = `A>${this.maxA} (máx ${this.maxA} por placa)`;
    else if (A > colonias) error = `A>colonias (${A}>${colonias})`;
    else if (b > A) error = `b>A (${b}>${A})`;
    else if (colonias > 0 && A === 0) error = 'falta traspaso (A=0 con colonias presentes)';
    else a = colonias > 0 ? colonias * (b / A) : 0;
    if (error) advertencias.push(`dil ${dil}: ${error}.`);

    return { dil, colonias, A, b, a, tiempo, error };
  }

  private elegirC(p: PlacaSaureus): number {
    const c24 = p.colonias24h, c48 = p.colonias48h;
    if (this.coloniaUsada === '24h') return c24 ?? c48 ?? 0;
    if (this.coloniaUsada === 'mayor') return Math.max(c24 ?? 0, c48 ?? 0);
    return c48 ?? c24 ?? 0; // '48h' (default)
  }

  private confirmadas(c4a6: number | null, c24: number | null): { b: number; tiempo: DetallePlacaSaureus['tiempo'] } {
    const v4 = c4a6 ?? 0, v24 = c24 ?? 0;
    const b = v4 + v24; // incremental
    let tiempo: DetallePlacaSaureus['tiempo'] = null;
    if (v4 > 0 && v24 > 0) tiempo = '4-6h+24h'; else if (v4 > 0) tiempo = '4-6h'; else if (v24 > 0) tiempo = '24h';
    return { b, tiempo };
  }

  private tiempoGlobal(det: DetallePlacaSaureus[]): string | null {
    const u4 = det.some(d => d.tiempo === '4-6h' || d.tiempo === '4-6h+24h');
    const u24 = det.some(d => d.tiempo === '24h' || d.tiempo === '4-6h+24h');
    if (u4 && u24) return '4-6h+24h'; if (u4) return '4-6 hrs'; if (u24) return '24 hrs'; return null;
  }

  private sd(motivo: string, d: number): ResultadoSaureus {
    return { ufc: null, textoReporte: 'SD', operador: '=', esSd: true, sumaA: 0, sumaColonias: 0,
      n1: 0, n2: 0, d, detalle: [], advertencias: [motivo], coagulasaUsada: null,
      casoAplicado: 'SIN_DATOS', factorDilucion: d };
  }
}
