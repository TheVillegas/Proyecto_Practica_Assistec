# Brief — Refactor de la calculadora NMP (Coliformes totales / fecales / E. coli)

> Documento para entregar al agente IA. Describe **qué está fallando** en la
> implementación actual, **cuál es el comportamiento correcto** (ya validado contra
> la fuente oficial) y **qué queda pendiente de decisión del laboratorio**.
> Sigue el orden de prioridad de fuentes del proyecto: reglas de plataforma →
> decisiones del laboratorio → algoritmo.md → Excel oficial → VBA → NCh → TS existente.

---

## 1. Objetivo

Reemplazar el cálculo NMP actual (tabla hardcodeada de 3 tubos) por un motor
**fiel a la calculadora oficial ISO 7218 Cláusula 11 (Wilrich-Jarvis V5)**, que es
la fuente de la que derivan todas las tablas NMP, incluida la de NCh2047 (Anexo B
referido por NCh2676 §8.1).

El motor ya está implementado y validado en `mpn.engine.ts`. Este brief explica
por qué se cambia y cómo debe integrarse.

---

## 2. Fuente de verdad (ya validada — no rediscutir)

El motor `mpn.engine.ts` reproduce **exactamente**:

- Las 41 entradas de la tabla 3×3 de NCh2047 / Anexo B.
- Las tablas C.5–C.7 del Anexo C de ISO 7218, en sus 6 salidas: MPN, log10(MPN),
  SD log10, límites de confianza 95% inferior y superior, Rarity Index y Category.

Las fórmulas provienen directamente del VBA del archivo oficial
(`Functions.bas` → `MPN`, `SD_lg_MPN`, `Upper`, `Lower`, `Rarity`). No reimplementar
desde cero ni desde memoria: usar `mpn.engine.ts` como está.

Estructura central del dato: cada dilución aporta `v = d · w` = **muestra original
por tubo** (d = factor de dilución de la fila; w = volumen inoculado). Si `v` está
en gramos, el resultado sale en **NMP/g automáticamente**, sin factores manuales.

---

## 3. Fallas de la implementación actual

### 3.1 `nmpColi.calculator.js` — la tabla como fuente de verdad (CRÍTICO)

| # | Falla | Impacto |
|---|-------|---------|
| F1 | La tabla está fijada al esquema **10 / 1 / 0.1 mL → NMP/100 mL**, pero el resultado se usa/etiqueta como **NMP/g**. | Error de unidades de hasta ×10 / ×100 según el esquema real del laboratorio. |
| F2 | `'3,3,3' → 1100`. Todos los tubos positivos NO es 1100: es **"mayor que"** (densidad no acotada superiormente). | Subestima groseramente muestras muy contaminadas. |
| F3 | Cualquier combinación que no esté en la tabla lanza `throw`. | Caídas en combinaciones válidas pero "improbables" no tabuladas. |
| F4 | No entrega SD, intervalo de confianza ni Rarity Index. | Sin trazabilidad estadística ni control de calidad. |

### 3.2 `coliformes.service.js → _calcularResultadosFase4` (CRÍTICO)

| # | Falla | Impacto |
|---|-------|---------|
| F5 | `Object.keys(porDilucion).sort()` ordena diluciones como **strings alfabéticamente** y luego `slice(0,3)`. | Asigna positivos a la dilución equivocada y **descarta diluciones en silencio**. El NMP resultante es incorrecto sin error visible. |
| F6 | `incongruenciaDetectada: false` está **hardcodeado**. | Nunca se detectan lecturas implausibles (ej.: más positivos en mayor dilución que en menor). |
| F7 | `const dil = s.dilucion || '10'` asume un default de dilución. | Enmascara datos faltantes en vez de rechazarlos. |

### 3.3 `coliformes.service.js → calcularNmp` (REVISAR CON LABORATORIO)

| # | Falla | Impacto |
|---|-------|---------|
| F8 | Mapea `totales ← tubos 24h`, `fecales ← tubos 48h`, `ecoli ← tubos 48h`. Mezcla **tiempo de lectura** con **tipo de organismo**. | Probable error de dominio: totales/fecales/E. coli son confirmaciones distintas, cada una con su propio conteo de positivos por dilución. Requiere confirmación del laboratorio (ver §6). |
| F9 | `_normalizarConteoTubos` recorta a 3 y limita cada valor a `[0,3]`. | Rompe si alguna serie usa 3×5 o 3×10 tubos. El motor nuevo no tiene este límite. |

---

## 4. Comportamiento correcto esperado

Reemplazar `nmpColi.calculator.js` por `mpn.engine.ts`. Por cada serie (tipo de
organismo) y por cada muestra:

1. Construir `ConteoDilucion[]` con `construirConteos(lecturas, volumenes)`, donde:
   - `lecturas` = arreglo por dilución de lecturas +/− de cada tubo.
   - `volumenes` = `v = d·w` por dilución, en gramos de muestra original.
2. Llamar a `calcularMPN(conteos)`. Devuelve:
   - `mpn` (NMP/g), `log10Mpn`, `sdLog10`
   - `limiteInferior`, `limiteSuperior` (IC 95%)
   - `rarityIndex`, `categoriaRareza` (1 plausible / 2 poco probable / 3 revisar)
   - `estado` (`cero` | `estimado` | `mayor_que` | `invalido`)
3. Persistir el resultado **con todos esos campos**, no solo el número.
4. `incongruenciaDetectada` ← `resultado.categoriaRareza === 3`.

Manejo de extremos (ya implementado, no reinventar):
- Todos negativos → `estado: 'cero'`, `mpn: 0`, cota superior `ln(40)/Σ(n·v)`.
- Todos positivos → `estado: 'mayor_que'`, `mpn: Infinity`, cota inferior exacta.
- Datos inválidos (`x > n`, no enteros, `v ≤ 0`) → `estado: 'invalido'`, sin throw.

---

## 5. Diferencias respecto a la NCh (a documentar en `algoritmo.md`)

| Tema | NCh / Norma | Implementación | Justificación |
|------|-------------|----------------|---------------|
| Cálculo NMP | NCh2676 §8.1 remite a la **tabla** del Anexo B (NCh2047). | Se calcula por **máxima verosimilitud** (ISO 7218), que **genera** esa misma tabla. | La tabla es un caso particular de la ecuación; calcular evita huecos y errores de unidad. Resultados idénticos a la tabla (validado). |
| Caso "todos positivos" | La tabla 3×3 termina en 1100. | Se reporta "mayor que" + cota inferior. | 1100 es el último valor tabulado, no el valor real. |
| SD / IC 95% / Rarity | No exigidos por la tabla NCh. | Se calculan (ISO 7218 / Wilrich). | Trazabilidad y control de calidad; el laboratorio puede mostrarlos u ocultarlos. |
| Nº de tubos / diluciones | Esquema fijo 3×3. | Genérico (cualquier nº de tubos y diluciones). | Extensibilidad; no rompe el caso 3×3. |

> Regla: **ninguna diferencia con la norma se elimina sin dejar constancia** de que
> es una decisión del laboratorio o de la plataforma.

---

## 6. Decisiones PENDIENTES del laboratorio (bloquean el cierre)

El agente **no debe asumir** estos puntos. Deben confirmarse y registrarse en
`algoritmo.md` antes de dar el refactor por terminado:

1. **Esquema de dilución real.** ¿Suspensión inicial 1:10 y se inocula 1 / 0.1 / 0.01 mL?
   De ahí salen `v = [0.1, 0.01, 0.001]` g y se confirma que el reporte es **NMP/g**.
   (El formulario muestra las líneas 1 / 0.1 / 0.01 mL — falta confirmar la dilución base.)

2. **Mapeo tipo ↔ lectura (falla F8).** ¿Cómo se cuentan los positivos de
   coliformes totales, fecales y E. coli? ¿Son medios/confirmaciones distintos, cada
   uno con su propio recuento por dilución, o realmente se derivan de 24h vs 48h?

3. **Visibilidad de SD / IC / Rarity en el reporte final.** ¿Se muestran al analista,
   se usan solo para QA interno, o se ocultan?

---

## 7. Criterios de aceptación

- [ ] `nmpColi.calculator.js` queda reemplazado por `mpn.engine.ts`; ningún consumidor
      importa la tabla hardcodeada como fuente de cálculo.
- [ ] `mpn.golden.test.ts` pasa al 100% (tabla NCh2047 + ISO 7218 Anexo C + extremos + QA).
- [ ] `_calcularResultadosFase4` arma los conteos por **valor de dilución**, sin
      `sort()` alfabético ni `slice(0,3)`, y rechaza diluciones faltantes (sin default).
- [ ] `incongruenciaDetectada` se deriva de `categoriaRareza === 3`.
- [ ] Resultados persistidos incluyen mpn, sd, IC inferior/superior, rarityIndex,
      categoriaRareza y estado.
- [ ] Decisiones §6 confirmadas y documentadas en `algoritmo.md`.
- [ ] Las unidades del resultado coinciden con el esquema confirmado (§6.1).

---

## 8. Archivos de referencia

- `mpn.engine.ts` — motor validado (usar tal cual).
- `mpn.golden.test.ts` — tests de regresión (fuente de verdad ejecutable).
- Archivo oficial: `Calculator_for_MPN_methods...ISO7218_Clause11.xlsm`
  (módulos VBA `Functions.bas`, `Checks_Calculations.bas`).
- `nmpColi.calculator.js`, `coliformes.service.js` — a refactorizar.
