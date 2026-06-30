# BRIEF PARA AGENTE IA — Corrección del cálculo de *S. aureus* (UFC/g)

> **TL;DR:** Reemplazar `calculador-saureus.service.ts` por el código de la sección 7.
> Modelo **PER-PLACA con dilución propia por placa**.
> Validado contra el Excel oficial y el ejemplo de la supervisora.
> Sin puntos abiertos.

---

## 1. Contexto
- Estándar: **NCh 2671.Of2002**.
- Fuente de verdad: Excel `S_AUREUS.xlsx` + supervisora de área + formulario real del sistema.
- Cada placa tiene **su propia dilución**. El backend recibe una lista de placas.

---

## 2. Estructura del formulario (cómo se ve en pantalla)

```
                C 24h    C 48h    D    A confirmar    Coagulasa 4-6h    Coagulasa 24h
Placa A:          23       45     2          5               3                 0
Placa B:          45       49     3          5               4                 0
```

- **C 24h / C 48h:** dos lecturas de colonias presuntivas por placa.
- **D:** dilución entera positiva (`2` → el sistema arma `10^-2`).
- **A confirmar:** colonias traspasadas a coagulasa (1 a 5 por placa).
- **Coagulasa 4-6h / 24h:** positivas en cada lectura (la casilla 24h son **solo las nuevas**).

---

## 3. Payload al backend

Lista plana de placas — **cada placa trae su propia dilución**:

```json
{
  "volumen": 1,
  "placas": [
    { "c24h": 23, "c48h": 45, "dil": 2, "aConfirmar": 5, "coag4a6h": 3, "coag24h": 0 },
    { "c24h": 45, "c48h": 49, "dil": 3, "aConfirmar": 5, "coag4a6h": 4, "coag24h": 0 }
  ]
}
```

El servicio agrupa internamente por dilución para calcular `n₁`, `n₂` y `d`.

---

## 4. Fórmulas (per-placa)

```
Por placa:
  C = c48h  (lectura 48h; configurable con coloniaUsada: '24h' | '48h' | 'mayor')
  b = coag4a6h + coag24h                    (incremental)
  a = C · (b / A)                           ("Final number of colonies")

Validaciones (si falla → placa no aporta + advertencia):
  1 ≤ A ≤ 5  (máximo 5 por placa, mínimo 1 si hay colonias)
  A ≤ C
  b ≤ A

Agrupación interna por dilución (ordenadas de más concentrada a más diluida):
  d  = 10^(-dil más concentrada)
  n₁ = nº de placas en la 1ª dilución
  n₂ = nº de placas en la 2ª dilución   (0 si todas tienen la misma dilución)

Total:
  Σa = Σ a_placa
  N  = Σa / ( V · (n₁ + 0,1·n₂) · d )

Redondeo: 2 cifras significativas, "x,y × 10ᶻ UFC/g" (coma decimal).
```

---

## 5. Reglas de negocio confirmadas

| Regla | Valor |
|---|---|
| Modelo | **per-placa** — `a = C·(b/A)` por placa, luego `Σa` |
| Dilución | entero positivo por placa → sistema arma `10^(-n)` |
| C (colonias) | **dos lecturas por placa** (24h y 48h); default usa `c48h` |
| Coagulasa | `b = coag4a6h + coag24h` (incremental; 24h son solo las nuevas) |
| A mín/máx | **1 a 5 por placa**; A=6 rechazada; A=0 con colonias → error |
| Sin colonias | → `SD` |
| Sin confirmación (b=0) | → `SD` |
| NE / número estimado | **no implementar** |
| Regla del 80% | **no existe** — siempre `a = C·(b/A)` |
| Volumen | parámetro del payload; default 1 mL |

---

## 6. Qué estaba roto

| # | Bug | Efecto |
|---|---|---|
| 1 | `resolverCoagulasa` elegía 4-6h **o** 24h global | descartaba confirmaciones de 24h |
| 2 | **Regla del 80%** (`b/A ≥ 0,8 → a = C`) | inflaba el resultado |
| 3 | `n₁` fijo en 1 | divisor incorrecto |
| 4 | Sin volumen en el denominador | resultado incorrecto |
| 5 | Tope de 5 sobre la suma A+B | rechazaba combinaciones válidas |
| 6 | Una sola lectura de colonias por placa | perdía distinción 24h/48h |
| 7 | Diluciones como contenedor, no por placa | no coincidía con el formulario real |

---

## 7. Verificación (debe cumplirse tras el cambio)

| Caso | Entrada | Resultado esperado |
|---|---|---|
| **Ejemplo real** | A(c48=45,dil2,A5,b=3) B(c48=49,dil3,A5,b=4) | `6,0 × 10³` (27+39,2=66,2) |
| **Excel validado** | A(c48=23,dil2,A5,b=3) B(c48=45,dil2,A4,b=4) | `2,9 × 10³` (13,8+45=58,8) ✅ |
| **Supervisora** | 1 placa, c=58, dil1, A5, b=1@24h | `1,2 × 10²` (a=11,6) ✅ |
| A a 4-6h, B solo a 24h | A(40,dil2,A5,b4=3) B(50,dil2,A5,b24=2) | `2,2 × 10³` (B no se pierde) |
| Sin desarrollo | c=0 | `SD` |
| Sin confirmación | c>0, b=0 | `SD` |
| A=6 rechazada | A=6 en cualquier placa | placa no aporta (advertencia) |

---

## 8. Código (reemplaza `calculador-saureus.service.ts`)

> Compila con `tsc --strict`. Mantiene `calcular(DatosMuestra)` para la fábrica existente.
> No usa `resolverCoagulasa` ni `aplicarRegla80`.

```ts
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
```

---

## 9. Checklist para el agente

- [ ] Reemplazar `calculador-saureus.service.ts` por el código de la sección 8.
- [ ] Adaptar el endpoint para recibir el payload de la sección 3 (`MuestraSaureus`).
- [ ] Confirmar con el laboratorio cuál lectura usar como C (`coloniaUsada: '48h'` por defecto).
- [ ] Eliminar el uso de `resolverCoagulasa` y `aplicarRegla80` para S. aureus.
- [ ] Corregir la tabla de diseño (tenía la fórmula pooled, que no es la oficial).
- [ ] Correr los 7 casos de verificación de la sección 7.
