# Algoritmo NMP (Número Más Probable) para Coliformes

> **Change:** `coli-mpn-engine-replacement`
> **Rama:** `feature/motor_coliformes`
> **Audiencia doble:** (1) Coordinadora del laboratorio — para validar unidades, algoritmo y casos extremos antes de implementar. (2) Equipo frontend — para conocer el contrato JSON del backend y maquetar la UI.
> **Orden de prioridad de fuentes** (regla del proyecto): reglas de plataforma → decisiones del laboratorio → `algoritmo.md` → Excel oficial → VBA → NCh → TS existente.

---

## 1. Resumen ejecutivo

El cálculo del NMP para coliformes se reemplaza de una **tabla hardcodeada** (`nmpColi.calculator.js`) por un **motor de máxima verosimilitud** fiel a la calculadora oficial **ISO 7218 Cláusula 11 (Wilrich-Jarvis V5, 2017-01-09)**. La tabla NCh2047 Anexo B es un caso particular de evaluar esa ecuación; calcular es mejor que tabular porque:

- Evita los huecos de la tabla (combinaciones válidas pero no tabuladas).
- Corrige los errores de unidades (la tabla vieja asumía siempre 10/1/0.1 mL → NMP/100 mL).
- Entrega el intervalo de confianza 95% y un Rarity Index (control de calidad) por muestra.
- Reporta correctamente el caso "todos los tubos positivos" como "mayor que" + cota inferior (la tabla lo capaba en 1100, que es un artefacto del último valor tabulado, no el real).

El motor está implementado en TypeScript (`NUEVOS_ALGORITMOS/mpn.engine.ts`) y validado con tests de regresión (`NUEVOS_ALGORITMOS/mpn.golden.test.ts`) contra la tabla NCh2047 (3×3) y las tablas ISO 7218 Anexo C C.5–C.7 (6 salidas por caso).

---

## 2. Fuente de verdad

- **Norma primaria**: ISO 7218:2007 / Amd 1:2013 — *Microbiology of food and animal feeding stuffs — General requirements and guidance for microbiological examinations*, Cláusula 11 (cálculo del NMP por máxima verosimilitud).
- **Implementación de referencia**: archivo oficial `Calculator_for_MPN_methods...ISO7218_Clause11.xlsm`, módulo VBA `Functions.bas` con las funciones `MPN`, `SD_lg_MPN`, `Upper`, `Lower`, `Rarity` y `Checks_Calculations.bas` con los sanity checks.
- **Norma chilena**: NCh2047 (Anexo B, tabla 3×3) y NCh2676 §8.1 (que remite a esa tabla).
- **Motor del proyecto**: `NUEVOS_ALGORITMOS/mpn.engine.ts`. Reproduce exactamente la tabla 3×3 de NCh2047 y las 6 salidas de las tablas ISO 7218 Anexo C.

**Regla de oro**: las fórmulas NO se reimplementan desde cero ni desde memoria. Se usa el motor tal cual está. Cualquier diferencia con la norma debe documentarse en §10 y tener justificación explícita.

---

## 3. Sistema de unidades

El motor trabaja con **`v = d · w`** = muestra original por tubo (en gramos o mililitros), donde:

| Símbolo | Significado | Valor (esquema laboratorio) |
|---|---|---|
| `d` | Factor de dilución de la **fila** (suspensión) | `0.1` (suspensión inicial 1:10) |
| `w` | Volumen inoculado por tubo | `[1, 0.1, 0.01]` mL |
| `v` | Muestra original por tubo | `[0.1, 0.01, 0.001]` g |

**Convención clave:** si `v` se expresa en **gramos** de muestra original, el resultado sale en **NMP/g** automáticamente, sin factores manuales de corrección.

**Caso muestra líquida** (agua, bebidas): el motor devuelve NMP por "unidad de muestra original". Si la muestra se mide en mL, el reporte final etiqueta el resultado como **NMP/mL**. El motor no distingue; el label se define en la capa de respuesta. (Esto se documenta como diferencia con la norma en §10.)

---

## 4. Algoritmo (alto nivel, sin fórmulas)

1. Por cada organismo y por cada muestra se construye un arreglo de `ConteoDilucion[]`: `positivos`, `tubos`, `volumenMuestraPorTubo`. Para nuestro caso: 3 diluciones × 3 tubos = 9 observaciones por organismo.
2. Se estima el NMP resolviendo la ecuación de score (log-verosímil derivado) por bisección geométrica en escala log.
3. Se calcula la SD de log10(MPN) con la fórmula de información observada de Wilrich.
4. Se calcula el intervalo de confianza 95% asumiendo distribución lognormal con factor 2: `MPN · exp(±2 · SD_ln)`.
5. Se calcula el Rarity Index (razón entre la probabilidad del patrón observado y la del patrón más probable). Categorías:
   - `1` = plausible (≥ 0.05)
   - `2` = poco probable [0.01, 0.05)
   - `3` = improbable / revisar lecturas [0, 0.01)

**Casos extremos** (manejados sin throw):

| Patrón | `estado` | Resultado |
|---|---|---|
| Todos los tubos negativos | `cero` | `mpn: 0`, `limiteSuperior = ln(40) / Σ(n·v)` |
| Todos los tubos positivos | `mayor_que` | `mpn: Infinity`, `limiteInferior` exacto (raíz de `Π(1−e^{−v·z})^n = 0.025`) |
| Datos inválidos (x > n, no enteros, v ≤ 0) | `invalido` | `mpn: NaN`, sin throw |

---

## 5. Contrato de input del backend

### 5.1 Endpoints

| Operación | Método | Path | Persiste |
|---|---|---|---|
| Calcular y devolver (preview) | `POST` | `/coli/formularios/:id/calcular-nmp` | No |
| Calcular y persistir | `PUT` | `/coli/formularios/:id/fase/4` | Sí, en `ColiFase4Resultado` |

Ambos pasan por el mismo motor. El primero es para preview / UX, el segundo es el que efectivamente graba el resultado. El frontend puede llamar al primero para mostrar el cálculo al analista antes de confirmar el guardado.

### 5.2 Payload

**Request (POST `/coli/formularios/:id/calcular-nmp`):**

```json
{
  "muestras": [
    {
      "idColiMuestra": 12,
      "lecturas": {
        "totales": [
          [true,  false, true],
          [true,  false, false],
          [false, true,  true]
        ],
        "fecales": [
          [true,  false, true],
          [true,  false, false],
          [false, true,  true]
        ],
        "ecoli": [
          [false, false, false],
          [false, false, false],
          [false, false, false]
        ]
      }
    }
  ]
}
```

- `lecturas[totales|fecales|ecoli]` es una matriz `[3 diluciones][3 tubos]` de booleanos.
- `true` = tubo positivo (gas / fluorescencia / subconfirmación, según corresponda).
- `false` = tubo negativo.
- Los tres organismos son **independientes**: cada uno tiene su propia grilla. Si en la práctica `fecales` y `ecoli` se leen sobre los mismos tubos físicos, el frontend manda el mismo patrón para los dos — el backend los trata como inputs separados y calcula NMPs separados.

### 5.3 Validaciones

- `positivos ∈ [0, tubos]` por dilución.
- `tubos > 0` por dilución.
- `volumenMuestraPorTubo > 0` (en este change siempre es `[0.1, 0.01, 0.001]` g; el campo es extensible si el esquema cambia).
- `lecturas[tipo]` debe ser matriz 3×3 (extensible a 3×N tubos).
- Si alguna validación falla, el resultado de ese organismo es `{ estado: 'invalido', detalle: '...' }` — **no se lanza excepción**.

---

## 6. Contrato de output del backend

### 6.1 Estructura

**Response (POST `/coli/formularios/:id/calcular-nmp`):**

```json
{
  "fase4Resultado": [
    {
      "idColiMuestra": 12,
      "coliformesTotales": 21,
      "coliformesFecales": 15,
      "eColi": 0,
      "totales": {
        "mpn": 21,
        "log10Mpn": 1.322,
        "sdLog10": 0.31,
        "limiteInferior": 6.8,
        "limiteSuperior": 64,
        "rarityIndex": 0.21,
        "categoriaRareza": 1,
        "estado": "estimado"
      },
      "fecales": {
        "mpn": 15,
        "log10Mpn": 1.176,
        "sdLog10": 0.32,
        "limiteInferior": 4.5,
        "limiteSuperior": 50,
        "rarityIndex": 0.12,
        "categoriaRareza": 1,
        "estado": "estimado"
      },
      "ecoli": {
        "mpn": 0,
        "log10Mpn": null,
        "sdLog10": null,
        "limiteInferior": 0,
        "limiteSuperior": 1.1,
        "rarityIndex": 1,
        "categoriaRareza": 1,
        "estado": "cero"
      },
      "incongruenciaDetectada": false,
      "observacionIncongruencia": null
    }
  ]
}
```

### 6.2 Campos

| Campo | Tipo | Significado |
|---|---|---|
| `coliformesTotales`, `coliformesFecales`, `eColi` | `number \| null` | NMP/g (o NMP/mL si la muestra es líquida) — los 3 NMPs principales. `null` si `estado === 'invalido'`. |
| `totales`, `fecales`, `ecoli` | `ResultadoMPN` | Objeto con el detalle estadístico del cálculo. |
| `incongruenciaDetectada` | `boolean` | `true` si `categoriaRareza === 3` para **algún** organismo. Lectura a revisar. |
| `observacionIncongruencia` | `string \| null` | Texto que describe el/los organismo(s) con rareza 3, generado por el backend. |

### 6.3 Objeto `ResultadoMPN` (por organismo)

| Campo | Tipo | Significado |
|---|---|---|
| `mpn` | `number` | NMP/g. `0` si `estado === 'cero'`. `Infinity` si `estado === 'mayor_que'`. `NaN` si `estado === 'invalido'`. |
| `log10Mpn` | `number \| null` | `log10(mpn)`. `null` en casos extremos (`cero` y `mayor_que`) y en `invalido`. |
| `sdLog10` | `number \| null` | Desviación estándar de log10(MPN) (Wilrich). `null` en casos extremos. |
| `limiteInferior` | `number \| null` | Límite inferior del IC 95%. `0` si `estado === 'cero'`. `null` si `invalido`. |
| `limiteSuperior` | `number \| null` | Límite superior del IC 95%. `Infinity` si `estado === 'mayor_que'`. `null` si `invalido`. |
| `rarityIndex` | `number \| null` | Rarity Index (Wilrich). `null` si `invalido`. |
| `categoriaRareza` | `1 \| 2 \| 3 \| null` | `null` si `invalido`. |
| `estado` | `'cero' \| 'estimado' \| 'mayor_que' \| 'invalido'` | Categoría del resultado. |

### 6.4 Ejemplos por caso extremo

**`estado: 'cero'`** (todos los tubos de un organismo negativos):

```json
{
  "mpn": 0,
  "log10Mpn": null,
  "sdLog10": null,
  "limiteInferior": 0,
  "limiteSuperior": 1.1,
  "rarityIndex": 1,
  "categoriaRareza": 1,
  "estado": "cero"
}
```

**`estado: 'mayor_que'`** (todos los tubos positivos):

```json
{
  "mpn": null,
  "log10Mpn": null,
  "sdLog10": null,
  "limiteInferior": 180,
  "limiteSuperior": null,
  "rarityIndex": 1,
  "categoriaRareza": 1,
  "estado": "mayor_que"
}
```

**`estado: 'invalido'`** (datos mal formados):

```json
{
  "mpn": null,
  "log10Mpn": null,
  "sdLog10": null,
  "limiteInferior": null,
  "limiteSuperior": null,
  "rarityIndex": null,
  "categoriaRareza": null,
  "estado": "invalido",
  "detalle": "Conteo inválido: x=5, n=3, v=0.01"
}
```

> **Importante para la coordinadora**: en la implementación nueva, los 3 NMPs principales (`coliformesTotales`, `coliformesFecales`, `eColi`) se serializan como `null` cuando `estado === 'mayor_que'` o `'invalido'`. La base de datos los persiste como `Decimal(15, 4)` y `Infinity` no se puede persistir, así que se guarda `NULL`. Esto es deliberado: el `estado` y los `limiteInferior/Superior` transmiten la información completa.

---

## 7. Persistencia en base de datos

### 7.1 Schema actual (`ColiFase4Resultado` en `prisma/schema.prisma`)

| Columna | Tipo | Observación |
|---|---|---|
| `id_coli_fase4_resultado` | `BigInt` PK autoincrement | — |
| `id_coli_muestra` | `BigInt` UNIQUE FK | Una fila por muestra. |
| `coliformes_totales` | `Decimal(15,4)` nullable | NMP/g (o NMP/mL) — Totales |
| `coliformes_fecales` | `Decimal(15,4)` nullable | NMP/g — Fecales |
| `e_coli` | `Decimal(15,4)` nullable | NMP/g — E. coli |
| `incongruencia_detectada` | `Boolean` default false | Deriva de `categoriaRareza === 3`. |
| `observacion_incongruencia` | `String` nullable | — |

### 7.2 Schema nuevo (este change)

Se suman los 6 campos estadísticos por organismo (3 NMPs × 6 campos = 18 columnas nuevas) **o**, alternativamente, un objeto JSON por muestra. La decisión de modelado se cierra en el artifact `design.md` del change.

**Convención de nombres de columnas** (mantener el patrón snake_case del schema existente):

```
totales_mpn, totales_log10_mpn, totales_sd_log10,
totales_limite_inferior, totales_limite_superior,
totales_rarity_index, totales_categoria_rareza, totales_estado,

fecales_mpn, fecales_log10_mpn, ...,

ecoli_mpn, ecoli_log10_mpn, ...,
```

**Naming crítico**: NUNCA se usa un nombre que sea solo `sd` o `sd_` (choca con `es_sd` = "Sin Desarrollo" en `SauEtapa5Resultado`). Los nombres canónicos son `*_sd_log10` (siempre explícitos sobre qué desviación estándar es).

---

## 8. Mapeo de fallas cerradas (F1–F9)

| # | Falla en `nmpColi.calculator.js` y `coliformes.service.js` | Impacto | Cierre en este change |
|---|---|---|---|
| F1 | Tabla hardcodeada al esquema 10/1/0.1 mL → NMP/100 mL, pero se etiqueta como NMP/g | Error de unidades ×10/×100 según esquema real | El motor recibe `v` explícito (`[0.1, 0.01, 0.001]`) y devuelve NMP/g directo. Sin factores manuales. |
| F2 | `'3,3,3' → 1100` | Subestima muestras muy contaminadas | `estado: 'mayor_que'` + `limiteInferior` exacto. `coliformesTotales` se persiste como `NULL` (Infinity no es representable). |
| F3 | Throw en combinaciones no tabuladas | Caídas en combinaciones válidas | El motor resuelve por MLE; cualquier patrón válido tiene respuesta. Inválidos → `estado: 'invalido'` sin throw. |
| F4 | Sin SD / IC / Rarity | Sin trazabilidad ni control de calidad | El motor entrega los 6 campos estadísticos. Se persisten y devuelven siempre. |
| F5 | `Object.keys(porDilucion).sort()` ordena diluciones alfabéticamente y `slice(0,3)` descarta | NMP incorrecto en silencio | Se itera por `dilucion` como valor numérico (`v`); sin `sort()` ni `slice(0,3)`. |
| F6 | `incongruenciaDetectada: false` hardcoded | Nunca se detectan lecturas implausibles | Se deriva de `categoriaRareza === 3` para cada organismo. |
| F7 | `s.dilucion \|\| '10'` enmascara datos faltantes | Falsos positivos | Se rechaza el sample si falta la dilución. Validación dura. |
| F8 | `calcularNmp` mapea `totales=24h`, `fecales=48h`, `ecoli=48h` | Mezcla tiempo de lectura con tipo de organismo; fecales y ecoli siempre iguales | Se reciben 3 conjuntos independientes `totales/fecales/ecoli` por muestra, cada uno con su grilla. |
| F9 | `_normalizarConteoTubos` capa a 3 tubos y limita a `[0,3]` | Rompe si se usan 3×5 o 3×10 tubos | El motor es genérico; sin cap artificial. |

---

## 9. Pruebas de regresión

`NUEVOS_ALGORITMOS/mpn.golden.test.ts` cubre tres golden sets:

1. **Tabla NCh2047** (3×3, 10/1/0.1 mL → /100 mL): las 41 entradas de la tabla, validando que el motor las reproduce con tolerancia `max(0.5, 0.12 · esperado)`.
2. **ISO 7218 Anexo C** (C.5–C.7): casos con MPN, SD, IC 95%, Rarity Index y Category especificados — valida las 6 salidas en conjunto.
3. **Casos extremos y QA**: `todos negativos` → `cero` con cota superior exacta; `todos positivos` → `mayor_que` con cota inferior; lectura incongruente `(0,3,0)` → `categoriaRareza === 3`; conteo inválido (`positivos > tubos`) → `invalido`.

**Criterio de aceptación del change**: este archivo pasa al 100% con `pnpm test` desde `AssisTec API/`. Si rompe un valor, la implementación difiere de la fuente oficial y hay que revisar.

Tests adicionales a agregar (en la fase `apply`):
- Test unitario del service: `_calcularResultadosFase4` y `calcularNmp` con motores reales y con mocks, cubriendo los 3 organismos, los 3 `estado` y los casos de error.

---

## 10. Diferencias respecto a la NCh (documentación obligatoria)

| Tema | NCh / Norma | Implementación | Justificación |
|---|---|---|---|
| Cálculo NMP | NCh2676 §8.1 remite a la **tabla** del Anexo B (NCh2047). | Se calcula por **máxima verosimilitud** (ISO 7218), que **genera** esa misma tabla. | La tabla es un caso particular de la ecuación; calcular evita huecos y errores de unidad. Resultados idénticos a la tabla (validado contra golden tests). |
| Caso "todos positivos" | La tabla 3×3 termina en 1100. | Se reporta "mayor que" + cota inferior. | 1100 es el último valor tabulado, no el valor real. |
| SD / IC 95% / Rarity | No exigidos por la tabla NCh. | Se calculan (ISO 7218 / Wilrich). | Trazabilidad y control de calidad; el laboratorio puede mostrarlos u ocultarlos. |
| Nº de tubos / diluciones | Esquema fijo 3×3. | Genérico (cualquier nº de tubos y diluciones). | Extensibilidad; no rompe el caso 3×3. |
| Unidades del resultado | NCh no especifica (la tabla 3×3 es /100 mL). | NMP/g (o NMP/mL si la muestra es líquida) — depende de cómo se mide `v`. | El laboratorio confirmó esquema 1:10 / 1/0.1/0.01 mL → `v = [0.1, 0.01, 0.001] g` → **NMP/g** (decisión de laboratorio §6.1). |

> Regla: **ninguna diferencia con la norma se elimina sin dejar constancia** de que es una decisión del laboratorio o de la plataforma. Si en el futuro la NCh cambia, este change se mantiene defendible porque cada desviación tiene justificación registrada.

---

## 11. Glosario mínimo

| Término | Significado |
|---|---|
| NMP / MPN | Número Más Probable (Most Probable Number). Es la estimación puntual de la densidad bacteriana. |
| ISO 7218 | Norma internacional de microbiología de alimentos que define el método de referencia para NMP. Cláusula 11 es la sección de cálculo. |
| NCh2047 / NCh2676 | Normas chilenas de microbiología. NCh2676 §8.1 remite a la tabla 3×3 del Anexo B de NCh2047. |
| Wilrich-Jarvis V5 | Método de máxima verosimilitud con información observada (no esperada) para estimar MPN, su SD, IC 95% y Rarity. Publicado por Wilrich (2013-2017). |
| `v = d · w` | Muestra original por tubo: `d` = factor de dilución de la fila, `w` = volumen inoculado. |
| SD log10 | Desviación estándar del log10(MPN). En el IC 95% se usa factor 2 (Wilrich). |
| IC 95% | Intervalo de confianza al 95%. Asume distribución lognormal. |
| Rarity Index | Razón entre la probabilidad del patrón observado y la del patrón más probable. Detecta lecturas incongruentes. Cercano a 0 = sospechoso. |
| `categoriaRareza` | Discretización del Rarity Index: 1 plausible, 2 poco probable, 3 improbable (revisar). |
| `estado` | Categoría del resultado: `cero`, `estimado`, `mayor_que`, `invalido`. |

---

## 12. Decisiones del laboratorio selladas (referencia)

Estas decisiones se cerraron en sesión con el laboratorio. **No se reabren** sin acuerdo explícito.

- **§6.1 — Esquema de dilución:** suspensión inicial 1:10 → `d = 0.1`. Inóculos 1 / 0.1 / 0.01 mL → `w = [1, 0.1, 0.01]`. `v = [0.1, 0.01, 0.001] g`. **Resultado en NMP/g.** Si la muestra es líquida, NMP/mL con el mismo `v` (interpretación: 1 mL de muestra = 1 g).
- **§6.2 — Contrato de input:** 3 conjuntos independientes de +/− por muestra, uno por organismo (`totales`, `fecales`, `ecoli`). Cierra F8. Cada conjunto es su propia grilla 3 dil × 3 tubos.
- **§6.3 — Naming de métricas:** nunca `sd` solo (choca con `esSd` = "Sin Desarrollo" en `SauEtapa5Resultado`). Nombres canónicos: `sdLog10`, `limiteInferior`, `limiteSuperior`, `rarityIndex`, `categoriaRareza`, `estado`. El backend **siempre** los persiste y devuelve; el frontend decide si los muestra al analista, los usa solo para QA o los oculta.

---

## 13. Referencias

- `NUEVOS_ALGORITMOS/mpn.engine.ts` — motor validado.
- `NUEVOS_ALGORITMOS/mpn.golden.test.ts` — tests de regresión (fuente de verdad ejecutable).
- `NUEVOS_ALGORITMOS/BRIEF_calculadora_NMP_coliformes.md` — brief original con F1–F9.
- `AssisTec API/src/calculators/nmpColi.calculator.js` — calculador viejo a eliminar.
- `AssisTec API/src/services/coliformes.service.js` — service actual con F5/F6/F7/F8/F9, a refactorizar.
- `AssisTec API/src/routes/coliformes.routes.js` — rutas `POST /coli/formularios/:id/calcular-nmp` y `PUT /coli/formularios/:id/fase/4`.
- `AssisTec API/src/controllers/coliformes.controller.js` — controller de las rutas.
- `AssisTec API/prisma/schema.prisma` — schema Prisma, modelo `ColiFase4Resultado` (línea ~932).
- `Calculator_for_MPN_methods...ISO7218_Clause11.xlsm` — archivo oficial ISO con VBA de referencia.
- `openspec/changes/coli-nmp-calculation-and-master-tables/` — change previo (frontend integration con calculador viejo). NO se reescribe; este change es el reemplazo del backend.
