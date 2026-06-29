# Propuesta: Reemplazo del motor NMP de Coliformes

## Intención

El cálculo de NMP de coliformes del backend AssisTec Lab está implementado sobre `nmpColi.calculator.js`: una **tabla hardcodeada** del esquema 10 / 1 / 0.1 mL → NMP/100 mL. La tabla arrastra **nueve fallas** (F1–F9, ver `docs/algoritmo-mpn-coliformes.md` §8) que ya producen errores silenciosos en producción: unidades mal etiquetadas (F1), capping en 1100 cuando todos los tubos son positivos (F2), excepciones en combinaciones válidas no tabuladas (F3), sin trazabilidad estadística (F4), y un agrupamiento por dilución que ordena alfabéticamente y descarta entradas (F5). Adicionalmente, el service que la invoca (`coliformes.service.js`) tiene un mapeo tiempo-de-lectura ↔ organismo que mezcla conceptos del dominio (F8) y normalizadores que rompen con series distintas de 3×3 (F9).

Este change reemplaza esa cadena por el motor `NUEVOS_ALGORITMOS/mpn.engine.ts`, fiel a la calculadora oficial **ISO 7218 Cláusula 11 (Wilrich-Jarvis V5)** y validado contra la tabla NCh2047 y las tablas ISO 7218 Anexo C. El resultado: NMP correcto en unidades (NMP/g según el esquema del laboratorio), manejo honesto de extremos (cero, mayor-que, inválido sin throw), intervalo de confianza 95% y Rarity Index persistidos por muestra y organismo, y un contrato de input/salida documentado que el frontend pueda maquetar sin ambigüedad.

## Cambios

### Motor y service

- Reemplazar `AssisTec API/src/calculators/nmpColi.calculator.js` (CommonJS, tabla hardcodeada) por el motor TS `NUEVOS_ALGORITMOS/mpn.engine.ts`, compilado con `tsc` a `dist/calculators/mpn.engine.js` e importado desde el service JS. El motor se usa **tal cual** (no se reimplementa).
- Refactor de `AssisTec API/src/services/coliformes.service.js`:
  - Cierra F5: iterar por `dilucion` numérico (sin `Object.keys().sort()` ni `slice(0,3)`).
  - Cierra F6: derivar `incongruenciaDetectada` de `categoriaRareza === 3` para cada organismo, y componer `observacionIncongruencia` con el/los organismo(s) afectados.
  - Cierra F7: rechazar la muestra si falta la dilución (validación dura, sin default `'10'`).
  - Cierra F8: aceptar **3 grillas independientes** `totales / fecales / ecoli` (matriz 3 diluciones × 3 tubos de booleanos) en vez de mapear 24h/48h a organismo.
  - Cierra F9: eliminar `_normalizarConteoTubos`; el motor es genérico en número de tubos y diluciones.

### Persistencia

- Migración Prisma: agregar las columnas para los **campos estadísticos detallados en §6.3 y §7.2** de `docs/algoritmo-mpn-coliformes.md` (por organismo: `mpn`/`log10_mpn`/`sd_log10`/`limite_inferior`/`limite_superior`/`rarity_index`/`categoria_rareza`/`estado`; total 3 organismos). Convención snake_case ya usada en el schema. **Naming crítico**: nunca `sd` solo (choca con `es_sd` en `SauEtapa5Resultado`); siempre `*_sd_log10`.
- Los 3 NMPs principales (`coliformes_totales`, `coliformes_fecales`, `e_coli`) se persisten como `NULL` cuando `estado === 'mayor_que' || 'invalido'` (Infinity no es representable en `Decimal(15,4)`; el `estado` + IC transmiten la información completa). **Decisión documentada en §6 del MD.**

### Build y tests

- Configurar `tsc` en `AssisTec API/package.json` para compilar `NUEVOS_ALGORITMOS/mpn.engine.ts` y `NUEVOS_ALGORITMOS/mpn.golden.test.ts` al directorio `dist/` (ya hay `typescript` y `ts-jest` en devDependencies).
- Configurar `ts-jest` para correr los golden tests (`mpn.golden.test.ts`: 41 entradas de la tabla NCh2047, 7 casos ISO 7218 Anexo C, casos extremos y QA) con el runner de Jest del backend (`cd "AssisTec API" && pnpm test`).
- Tests de integración del service: `_calcularResultadosFase4` y `calcularNmp` con motor real y con motor mockeado, cubriendo los 3 organismos, los 3 `estado` (`cero`, `estimado`, `mayor_que`, `invalido`) y los casos de validación.

### Contrato de API

- **`POST /coli/formularios/:id/calcular-nmp`** `[BREAKING]`: el `body.muestras[].lecturas` ahora es un objeto `{ totales, fecales, ecoli }` con grillas 3×3 de booleanos (ver MD §5.2). Reemplaza el `tubosPositivos24h / tubosPositivos48h` actual.
- **`POST /coli/formularios/:id/calcular-nmp`** `[BREAKING]`: la respuesta ahora expone el `ResultadoMPN` completo por organismo (md §6.3): `mpn`, `log10Mpn`, `sdLog10`, `limiteInferior`, `limiteSuperior`, `rarityIndex`, `categoriaRareza`, `estado`, más `incongruenciaDetectada` y `observacionIncongruencia`. Antes solo devolvía los 3 NMPs principales.
- **`PUT /coli/formularios/:id/fase/4`** `[BREAKING]`: el shape serializado de `ColiFase4Resultado` cambia (más columnas en BD). El endpoint sigue aceptando el mismo `idFormulario`; los `body` siguen el contrato de submuestras vigente en `coliFase3Submuestra`. La fase 4 ya no es "leer submuestras y mapear 24h→totales, 48h→fecales/ecoli"; ahora arma conteos por organismo a partir de las lecturas persistidas en fase 3.

### Documentación

- Este change **referencia** `docs/algoritmo-mpn-coliformes.md` como single source of truth (norma, contrato, casos extremos, diferencias con la NCh). No se reescribe.

## Impacto

| Área | Tipo | Descripción |
|---|---|---|
| Backend `AssisTec API/src/calculators/nmpColi.calculator.js` | Eliminado | Reemplazado por motor TS compilado. |
| Backend `AssisTec API/src/services/coliformes.service.js` | Modificado | Refactor F5–F9; ahora orquesta el motor y arma el `ResultadoMPN` por organismo. |
| Backend `AssisTec API/src/repositories/coliformes.repository.js` | Modificado | `upsertFase4Resultados` debe persistir las nuevas columnas. |
| Backend `AssisTec API/prisma/schema.prisma` + migración | Modificado | Nuevas columnas en `ColiFase4Resultado`. |
| Backend `AssisTec API/package.json` + `tsconfig.json` | Modificado | Build TS + `ts-jest` para los golden tests. |
| Frontend `Frontend/` | **Temporalmente inconsistente** | La UI actual espera la respuesta vieja (3 NMPs); este change no la toca. Se documenta como deuda técnica conocida. La maqueta nueva se hace aparte usando el MD como contrato. |
| Base de datos | Migración aditiva | Solo `ALTER TABLE` aditivo (columnas nullable). No rompe filas existentes. |
| QA / Coordinadora | Cambio de set de métricas | Las 6 métricas estadísticas nuevas son visibles en la respuesta. La coordinadora valida que los valores coincidan con la calculadora oficial ISO 7218. |

## Fuera de Alcance

- **Frontend** (`Frontend/`): no se modifica. La maqueta nueva del formulario de coliformes se hace en un change aparte, usando `docs/algoritmo-mpn-coliformes.md` como contrato. La UI actual va a quedar inconsistente con la nueva respuesta del backend durante la vida de este change; documentado como deuda.
- **Change previo `coli-nmp-calculation-and-master-tables`**: no se reabre ni se modifica. Ese change integró el frontend con el calculador viejo; queda como está.
- **Hojas de confirmación bioquímica del Excel** ("Conf CT y CF", "Conf E. coli"): fuera de scope. Quedan para un change futuro.
- **Enterobacterias**: fuera de scope (per scope del change previo).
- **Reglas de UI** (visibilidad de SD/IC/Rarity, formato de número, colores de rareza): se deciden en el change de frontend, no acá. El backend **siempre** devuelve y persiste los 6 campos; el frontend decide si los muestra.
- **Reimplementación del motor**: el motor se usa tal cual está. Cualquier diferencia con la norma debe documentarse en §10 del MD.

## Enfoque (alto nivel)

1. **RED primero**: extender `mpn.golden.test.ts` o agregar tests de integración del service que fallen contra el código actual (firma de input nueva, shape de output nuevo). `strict_tdd: true` está activo en `openspec/config.yaml`.
2. **GREEN**: introducir el motor TS compilado en el service, actualizar la migración Prisma, ajustar la respuesta del controller.
3. **REFACTOR**: limpiar el service (sin `_normalizarConteoTubos`, sin `Object.keys().sort()`), asegurar que los `controller` y `routes` no necesiten cambios fuera de su wiring.

## Capacidades

- **Nuevas** (a desarrollar en `spec.md`): `mpn-statistical-engine` — motor de máxima verosimilitud Wilrich-Jarvis integrado al cálculo de NMP, con SD, IC 95% y Rarity Index persistidos. `coli-fase4-contract-v2` — nuevo contrato de input (3 grillas por organismo) y output (6 campos estadísticos por organismo) en los endpoints `calcular-nmp` y `fase/4`.
- **Modificadas**: `coli-nmp-calculation-and-master-tables` (cambio previo) — la respuesta que consume pasa a la nueva forma. No se reabre el cambio previo; la migración de la UI es trabajo del change de frontend.

## Áreas Afectadas

| Área                                                     | Impacto            | Descripción                                                                |
| -------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------- |
| `AssisTec API/src/calculators/nmpColi.calculator.js`     | Eliminado          | Tabla hardcodeada.                                                         |
| `AssisTec API/src/calculators/` (nuevo)                  | Nuevo              | Wrapper o re-export del motor TS compilado, según decisión de `design.md`. |
| `AssisTec API/src/services/coliformes.service.js`        | Modificado         | Refactor F5–F9; orquesta el motor.                                         |
| `AssisTec API/src/repositories/coliformes.repository.js` | Modificado         | `upsertFase4Resultados` persiste los nuevos campos.                        |
| `AssisTec API/prisma/schema.prisma` + migración nueva    | Modificado         | Columnas estadísticas en `ColiFase4Resultado`.                             |
| `AssisTec API/package.json`, `tsconfig.json` (nuevo)     | Modificado / Nuevo | Build TS + ts-jest.                                                        |
| `NUEVOS_ALGORITMOS/`                                     | Sin cambios        | El motor y los golden tests ya están; este change los integra.             |
| `docs/algoritmo-mpn-coliformes.md`                       | Sin cambios        | Single source of truth.                                                    |
| `Frontend/`                                              | **No tocado**      | Deuda documentada.                                                         |

## Riesgos

| Riesgo                                                                          | Probabilidad    | Mitigación                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discrepancia de valores NMP entre tabla vieja y motor nuevo (distinto redondeo) | Alta            | Los golden tests cubren la tabla NCh2047 con tolerancia explícita (`max(0.5, 0.12·esperado)`). Diferencias dentro de tolerancia se documentan; fuera de tolerancia se investiga antes de mergear.               |
| Migración Prisma rompe filas existentes si las nuevas columnas no son nullable  | Baja            | Todas las columnas nuevas son **nullable**; `Decimal(15,4)` y `String` con default tolerante. No se borran datos.                                                                                               |
| Persistir `Infinity` en `Decimal(15,4)` falla                                   | Conocido        | El service serializa `Infinity` como `NULL` cuando `estado === 'mayor_que'`. El `estado` y `limiteInferior` transmiten la información. Documentado en §6 del MD.                                                |
| El motor TS no compila en el CI actual del backend                              | Media           | `tsc` se agrega al script `build` y al `pretest` de `package.json`; `ts-jest` se configura para correr los `.test.ts` directamente. Documentado en `design.md`.                                                 |
| Frontend rompe en producción porque la respuesta cambió                         | Alta (esperada) | El change documenta la deuda. La maqueta del frontend se hace aparte. Si la app rompe en runtime, el `Frontend/` debe quedar en una rama compatible con la respuesta vieja hasta que se mergee el change de UI. |
| Decisión de columnas del DB (cuántos y cuáles)                                  | Media           | El conteo exacto y nombres finales se sellan en `design.md` a partir del §6.3 y §7.2 del MD. El proposal no reabre el set de métricas.                                                                          |

## Plan de Rollback

- **DB**: la migración es aditiva y reversible (`ALTER TABLE ... DROP COLUMN`).
- **Backend**: revertir el commit del change deja el código en el estado del motor viejo + service viejo + `coliformes.repository` viejo. No hay cambios al frontend en este change, así que la UI sigue funcionando con la respuesta vieja después del rollback.
- **Build**: borrar el `tsconfig.json` agregado y los scripts `tsc`/`ts-jest` de `package.json`.
- **Riesgo de rollback**: si en el período de este change el frontend se actualizó para consumir la respuesta nueva, la reversión del backend rompe la UI. **Por eso este change no toca el frontend** — el acoplamiento se hace en el change de UI.

## Dependencias

- `NUEVOS_ALGORITMOS/mpn.engine.ts` — motor validado; se usa tal cual.
- `NUEVOS_ALGORITMOS/mpn.golden.test.ts` — golden tests; se corren vía `ts-jest` en el backend.
- `docs/algoritmo-mpn-coliformes.md` — contrato de input/output, decisiones del laboratorio selladas (§6.1, §6.2, §6.3), fuente de verdad.
- `AssisTec API/prisma/schema.prisma` — modelo `ColiFase4Resultado` (línea ~932) que se extiende.
- `AssisTec API/package.json` — `typescript` y `ts-jest` ya en devDependencies.
- `AssisTec API/src/controllers/coliformes.controller.js` y `AssisTec API/src/routes/coliformes.routes.js` — wiring de endpoints (no se modifican sus firmas; solo el shape de la respuesta cambia).

## Criterios de Aceptación

Adaptados de §7 del brief `NUEVOS_ALGORITMOS/BRIEF_calculadora_NMP_coliformes.md` al scope **solo backend** de este change:

- [ ] `nmpColi.calculator.js` queda eliminado del repositorio; ningún consumidor importa la tabla hardcodeada como fuente de cálculo.
- [ ] `mpn.golden.test.ts` corre vía `pnpm test` desde `AssisTec API/` y pasa al 100% (tabla NCh2047 + ISO 7218 Anexo C + extremos + QA).
- [ ] `_calcularResultadosFase4` arma los conteos por **valor de dilución**, sin `sort()` alfabético ni `slice(0,3)`, y rechaza muestras con diluciones faltantes (sin default `'10'`).
- [ ] `incongruenciaDetectada` se deriva de `categoriaRareza === 3` para cada organismo, y `observacionIncongruencia` describe el/los organismo(s) con rareza 3.
- [ ] El contrato de input de `calcular-nmp` exige 3 grillas independientes `totales / fecales / ecoli` (matriz 3 diluciones × 3 tubos de booleanos). Cierra F8.
- [ ] La respuesta de `calcular-nmp` y la fila persistida de `fase/4` incluyen los 6 campos estadísticos del MD §6.3 (`sdLog10`, `limiteInferior`, `limiteSuperior`, `rarityIndex`, `categoriaRareza`, `estado`) por organismo, además de los 3 NMPs principales ya existentes. **A CONFIRMAR en `design.md`**: el conteo exacto de columnas nuevas (el MD §7.2 menciona "6 campos" y suma 18, pero §6.3 lista 8 campos por organismo; el ejemplo de nombres del propio §7.2 lista 8 columnas por organismo).
- [ ] Las unidades del resultado son **NMP/g** para el esquema confirmado (§6.1 del MD: `v = [0.1, 0.01, 0.001]` g → NMP/g). Si la muestra es líquida, el label `NMP/mL` lo define la capa de respuesta (no el motor).
- [ ] Los casos `estado: 'cero' | 'mayor_que' | 'invalido' | 'estimado'` se manejan sin `throw` y se verifican con tests de integración del service.
- [ ] El frontend queda **explícitamente fuera** de este change; la maqueta nueva del formulario de coliformes se hace aparte usando el MD como contrato. La deuda queda documentada en este proposal.

## Referencias

- `docs/algoritmo-mpn-coliformes.md` — fuente de verdad del change: norma, algoritmo, contrato, casos extremos, decisiones selladas, diferencias con la NCh.
- `NUEVOS_ALGORITMOS/mpn.engine.ts` — motor Wilrich-Jarvis V5 validado.
- `NUEVOS_ALGORITMOS/mpn.golden.test.ts` — tests de regresión (fuente de verdad ejecutable).
- `NUEVOS_ALGORITMOS/BRIEF_calculadora_NMP_coliformes.md` — brief original con F1–F9 y los 7 criterios de aceptación adaptados arriba.
- `AssisTec API/src/calculators/nmpColi.calculator.js` — calculador viejo a eliminar.
- `AssisTec API/src/services/coliformes.service.js` — service actual con F5/F6/F7/F8/F9.
- `AssisTec API/src/repositories/coliformes.repository.js` — `upsertFase4Resultados` que persiste la fila.
- `AssisTec API/src/controllers/coliformes.controller.js`, `AssisTec API/src/routes/coliformes.routes.js` — wiring de endpoints.
- `AssisTec API/prisma/schema.prisma` — modelo `ColiFase4Resultado` (línea ~932).
- `AssisTec API/package.json` — `typescript` y `ts-jest` ya disponibles.
- `Calculator_for_MPN_methods...ISO7218_Clause11.xlsm` — archivo oficial ISO con VBA de referencia (no se modifica).
- `openspec/changes/coli-nmp-calculation-and-master-tables/` — change previo (integración frontend ↔ calculador viejo). **No se reabre.**
