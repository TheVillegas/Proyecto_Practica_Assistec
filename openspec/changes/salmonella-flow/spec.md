# Delta Spec: Salmonella Flow

> **Change**: `salmonella-flow` · **Project**: `Proyecto_Practica_Assistec` · **Mode**: `openspec`
> **Proposal**: `openspec/changes/salmonella-flow/proposal.md`
> **Date**: 2026-06-24
> **Capabilities** (per proposal): NEW `salmonella-frontend`, NEW `salmonella-phase-rules`, NEW `enterobacterias-ufc-calc`, MODIFIED `enterobacterias-flow` (UFC/g additive)

This delta spec covers LAB-48, LAB-62, LAB-63, LAB-64 and the extra Enterobacterias UFC/g calculator. The Salmonella backend (`sal_*` layers) is already complete (10 fases, optimistic locking, `presenciaSal.calculator.js`); the work focuses on backend enhancements (matrix logic, 25-min alert), a full frontend rebuild, a routing bug fix, and a new Enterobacterias UFC/g calculator wired through an adapter.

---

## Capability: `salmonella-frontend` (NEW)

### Requirement: SFE-01 (LAB-48) — Ruta de navegación Salmonella

El sistema SHALL enrutar el código de formulario `SALMONELLA` desde `muestraAli.repository.js` a `/form-salmonella` (no `/form-enterobacterias`).

#### Scenario: Click en formulario Salmonella desde Muestra ALI
- GIVEN una Muestra ALI con un `SalFormulario` asociado y `codigo: 'SALMONELLA'`
- WHEN el frontend invoca `GET /api/muestra-ali/:codigoAli` y arma la grilla de formularios
- THEN SHALL incluir `ruta: '/form-salmonella'` en el item SALMONELLA del array `formularios`

#### Scenario: Backend sirve la ruta correcta
- GIVEN el lookup map en `muestraAli.repository.js`
- WHEN se inspecciona la entrada para `SALMONELLA`
- THEN SHALL ser igual a `/form-salmonella` (no `/form-enterobacterias`)
- AND SHALL ser consistente con la ruta registrada en `app-routing.module.ts`

#### Scenario: Ruta no rompe formularios SAU/COLI
- GIVEN los códigos `SAUREUS` y `COLIFORMES` mapean a `/form-s-aureus` y `/form-coliformes`
- WHEN se aplica el fix de LAB-48
- THEN SHALL mantener inalterados los mapeos de SAUREUS y COLIFORMES

---

### Requirement: SFE-02 (LAB-64) — Servicio HTTP tipado para Salmonella

El sistema SHALL exponer `SalmonellaApiService` (`providedIn: 'root'`) con los métodos `obtenerPorAnalisis(idAnalisis)`, `obtener(idFormulario)`, `guardarFase(idFormulario, fase, payload, updatedAt)`. SHALL usar `inject(HttpClient)` (no constructor injection).

#### Scenario: Inyección con `inject()`
- GIVEN el servicio se declara en `services/salmonella-api.service.ts`
- WHEN un componente lo consume
- THEN SHALL obtener la instancia vía `inject(SalmonellaApiService)`
- AND SHALL tener `apiUrl = environment.apiUrl + '/formulario/sal'`

#### Scenario: PUT con header `updated_at`
- GIVEN el analista guarda la fase 2a
- WHEN se invoca `guardarFase(id, 2, payload, updatedAt)` con `updatedAt = T`
- THEN SHALL enviar `PUT /formulario/sal/:id/fase/2` con body `{ updated_at: T, fase2a: payload, completada: payload.completada }`
- AND SHALL serializar `updated_at` como string ISO-8601

---

### Requirement: SFE-03 (LAB-64) — Interfaces TypeScript para 10 sub-fases

El sistema SHALL crear `interfaces/salmonella.interfaces.ts` con `SalFase1Payload`…`SalFase10Payload`, `SalFormularioCompleto`, `SalMuestra`, y `SalLecturaFase3c[]` / `SalLecturaFase4b[]` para los arrays por muestra.

#### Scenario: Compilación sin `any`
- GIVEN el servicio y la página importan las interfaces
- WHEN se compila con `strict: true`
- THEN SHALL compilar sin warnings de `any`
- AND SHALL tipar todos los payloads de `guardarFase`

---

### Requirement: SFE-04 (LAB-64) — Wizard de 10 sub-fases con navegación local

El sistema SHALL reemplazar el stub monolítico por un wizard de 10 sub-fases con el siguiente mapeo wizard↔backend (patrón `form-enterobacterias` 8-pasos):

| Paso UI | Fase Backend | Etapa lógica |
|---------|--------------|--------------|
| 1 | **Fase 1** Trazabilidad | Etapa 1 |
| 2 | **Fase 2a** Siembra | Etapa 2 |
| 3 | **Fase 2b** Insumos | Etapa 2 |
| 4 | **Fase 2c** Controles | Etapa 2 |
| 5 | **Fase 3a** Traspaso caldos | Etapa 3 |
| 6 | **Fase 3b** Estufa selenito | Etapa 3 |
| 7 | **Fase 3c** Lecturas caldo | Etapa 3 |
| 8 | **Fase 4a** Traspaso agares | Etapa 4 |
| 9 | **Fase 4b** Lecturas agar 24h/48h | Etapa 4 |
| 10 | **Fase 5** Resultado final | Etapa 5 |

#### Scenario: Avance local entre pasos 1→2
- GIVEN el analista está en paso 1 (Trazabilidad) y completa los campos
- WHEN presiona "Siguiente"
- THEN SHALL avanzar a paso 2 (Siembra) SIN invocar la API
- AND SHALL conservar los datos del paso 1 en memoria

#### Scenario: Persistencia en paso 2 (Fase 2a)
- GIVEN el analista está en paso 2 (Siembra) y completa `completada: true`
- WHEN presiona "Siguiente"
- THEN SHALL invocar `PUT /formulario/sal/:id/fase/2` con el payload aplanado de Fase 2a
- AND SHALL avanzar a paso 3 solo si la respuesta es 2xx
- AND SHALL actualizar el `updatedAt` local con el devuelto por el backend

#### Scenario: Paso 10 auto-calculado
- GIVEN el analista llega al paso 10 (Resultado final)
- WHEN presiona "Siguiente" o "Finalizar"
- THEN SHALL invocar `PUT /formulario/sal/:id/fase/10`
- AND SHALL renderizar el resultado `Presencia`/`Ausencia` por muestra + duplicado retornado por `presenciaSal.calculator.js`

#### Scenario: Concurrencia optimista — 409
- GIVEN otro analista modificó el formulario entre el GET y el PUT
- WHEN el server responde 409 con código `CONCURRENCY_ERROR`
- THEN SHALL mostrar un toast "El formulario fue modificado por otro usuario. Recargue y vuelva a intentar."
- AND SHALL re-invocar `obtener()` para refrescar

---

### Requirement: SFE-05 (LAB-64) — Render de alertas visuales

El sistema SHALL mostrar un banner amarillo/rojo persistente en el paso 2 (Fase 2a) cuando `alertaTiempo25min === true`. El banner SHALL incluir el texto: "⚠️ Tiempo de transporte homogeneización → estufa excede 25 minutos".

#### Scenario: Alerta visible
- GIVEN `form.fase2a.alertaTiempo25min === true`
- WHEN se renderiza el paso 2
- THEN SHALL mostrar un banner amarillo `<ion-banner color="warning">`
- AND SHALL incluir minutosHomoAEstufa en el mensaje

#### Scenario: Sin alerta cuando está en rango
- GIVEN `form.fase2a.alertaTiempo25min === false`
- WHEN se renderiza el paso 2
- THEN SHALL NO mostrar el banner

---

## Capability: `salmonella-phase-rules` (NEW)

### Requirement: SPR-01 (LAB-62) — Auto-asignación de caldo por matriz

El sistema SHALL calcular `caldoAsignadoAuto` en función de `tipoMatriz` al guardar la Fase 1:

| `tipoMatriz` | `caldoAsignadoAuto` |
|--------------|---------------------|
| `Chocolate` | `Leche descremada` |
| `Polvo` | `Caldo APT` |
| `Normal` (otro) | `Caldo APT` |

#### Scenario: Matriz Chocolate
- GIVEN el analista envía `tipoMatriz: 'Chocolate'` en `PUT /fase/1`
- WHEN el service llama a `_asignarCaldoPorMatriz(tipoMatriz)`
- THEN SHALL persistir `caldoAsignadoAuto: 'Leche descremada'` (sobrescribiendo cualquier valor enviado por el cliente)

#### Scenario: Matriz Polvo
- GIVEN `tipoMatriz: 'Polvo'`
- WHEN se aplica la auto-asignación
- THEN SHALL persistir `caldoAsignadoAuto: 'Caldo APT'`

#### Scenario: TipoMatriz no proveído
- GIVEN `tipoMatriz` es `undefined` o `null` en el payload de Fase 1
- WHEN se intenta auto-asignar
- THEN SHALL lanzar `Error('TIPO_MATRIZ_REQUERIDO')` (400)

---

### Requirement: SPR-02 (LAB-62) — Validación de hidratación

El sistema SHALL calcular `hidratacionValida` comparando `horaTerminoHidratacion - horaInicioHidratacion` con un mínimo configurable de 5 minutos. SHALL devolver `true` si el delta es ≥ 5 min, `false` en caso contrario.

#### Scenario: Hidratación suficiente
- GIVEN `horaInicioHidratacion: 10:00` y `horaTerminoHidratacion: 10:10`
- WHEN se evalúa la hidratación
- THEN SHALL persistir `hidratacionValida: true`

#### Scenario: Hidratación insuficiente
- GIVEN `horaInicioHidratacion: 10:00` y `horaTerminoHidratacion: 10:03` (3 min)
- WHEN se evalúa la hidratación
- THEN SHALL persistir `hidratacionValida: false`
- AND SHALL NO rechazar el guardado (warning, no error)

#### Scenario: Hora de término anterior al inicio
- GIVEN `horaTerminoHidratacion < horaInicioHidratacion`
- WHEN se evalúa
- THEN SHALL lanzar `Error('HIDRATACION_INTERVALO_INVALIDO')` (400)

---

### Requirement: SPR-03 (LAB-63) — Alerta 25 min transporte a estufa

El sistema SHALL calcular `minutosHomoAEstufa` (delta en minutos entre `horaTerminoHomo` y `horaIngresoEstufa`) y SHALL setear `alertaTiempo25min = true` cuando el delta sea estrictamente mayor a 25.

#### Scenario: Tiempo dentro del límite
- GIVEN `horaTerminoHomo: 10:00` y `horaIngresoEstufa: 10:20` (20 min)
- WHEN se evalúa `_calcularAlerta25min(...)`
- THEN SHALL persistir `minutosHomoAEstufa: 20` y `alertaTiempo25min: false`

#### Scenario: Tiempo excede 25 min
- GIVEN `horaTerminoHomo: 10:00` y `horaIngresoEstufa: 10:30` (30 min)
- WHEN se evalúa la alerta
- THEN SHALL persistir `minutosHomoAEstufa: 30` y `alertaTiempo25min: true`

#### Scenario: Exactamente 25 min (límite inclusivo)
- GIVEN delta = 25 min exactos
- WHEN se evalúa
- THEN SHALL persistir `alertaTiempo25min: false` (estricto `> 25`)

#### Scenario: Hora estufa anterior al término
- GIVEN `horaIngresoEstufa < horaTerminoHomo`
- WHEN se calcula el delta
- THEN SHALL lanzar `Error('HOMO_ESTUFA_INTERVALO_INVALIDO')` (400)

---

## Capability: `enterobacterias-flow` (MODIFIED — additive UFC/g)

> El spec base `enterobacterias-flow` no contiene requisitos previos de cálculo UFC/g; los requisitos siguientes son **ADDED** (no MODIFIED de uno existente). La archive-step los fusionará con el spec principal.

### Requirement: ECB-08 — Cálculo UFC/g en Enterobacterias (UFC Ent)

El sistema SHALL calcular `ufcPorG` (UFC/g) en el flujo de Enterobacterias al guardar la Etapa 2 con `completada: true`, usando `calcularUfcEnt()` y almacenando el resultado en `ent_etapa3.ufcPorG` (nueva columna).

#### Scenario: Etapa 2 completa dispara cálculo
- GIVEN el analista envía `PUT /:id/etapa/2` con `completada: true`, `dilucion: 1`, `coloniasContadas: 100`
- WHEN el service procesa la petición
- THEN SHALL invocar `calcularUfcEnt({ volumen: 1, diluciones: [{ dil: 0, colonias: [100, 100] }] })`
- AND SHALL persistir `ufcPorG: 100` en la respuesta de etapa 2 (no requiere etapa 3 para calcular)

#### Scenario: Recálculo al editar etapa 2
- GIVEN etapa 2 ya está guardada con `coloniasContadas: 100` y `ufcPorG: 100`
- WHEN el analista actualiza etapa 2 con `coloniasContadas: 200`
- THEN SHALL recalcular y devolver `ufcPorG: 200` actualizado

#### Scenario: Etapa 2 en borrador no calcula
- GIVEN el analista envía `PUT /:id/etapa/2` con `completada: false`
- WHEN el service procesa
- THEN SHALL persistir los campos sin invocar la calculadora
- AND SHALL retornar `ufcPorG: null` (o el valor previo si existe)

---

### Requirement: ECB-09 — Adapter single-value → array para UFC Ent

El sistema SHALL convertir los campos simples `ent_etapa2.dilucion` y `ent_etapa2.coloniasContadas` al formato array `diluciones: [{ dil, colonias: [c1, c2] }]` esperado por `calcularUfcEnt()`, mediante un adapter interno.

#### Scenario: Conversión simple
- GIVEN `dilucion: 1` y `coloniasContadas: 50`
- WHEN el adapter `_adaptarParaUfcEnt(etapa2)` se invoca
- THEN SHALL retornar `{ volumen: 1, diluciones: [{ dil: 0, colonias: [50, 50] }] }` (duplicado como placa 1 y 2)

#### Scenario: Dilución fraccionaria negativa
- GIVEN `dilucion: 0.1` (10⁻¹)
- WHEN el adapter aplica `Math.log10(dilucion) = -1`
- THEN SHALL usar `dil: -1` en el array

#### Scenario: Sin datos
- GIVEN `coloniasContadas: 0` y `dilucion: null`
- WHEN el adapter se invoca
- THEN SHALL retornar `{ volumen: 1, diluciones: [] }` (la calculadora retornará `casoAplicado: 'SIN_DATOS'`)

---

### Requirement: ECB-10 — Exposición de `ufcPorG` en GETs

El sistema SHALL incluir `ufcPorG` (number | null) en las respuestas de `GET /api/formulario/ent/:id` y `GET /api/formulario/ent/por-analisis/:idAnalisis`, dentro del objeto `etapa2` y como campo top-level `ufcPorG` para conveniencia del frontend.

#### Scenario: GET por id retorna ufcPorG
- GIVEN una `EntFormulario` con etapa 2 completada
- WHEN el frontend invoca `GET /api/formulario/ent/:id`
- THEN SHALL incluir `ufcPorG: <number|null>` en el JSON de respuesta
- AND SHALL incluirlo también en `etapa2.ufcPorG` (mismo valor)

---

## Appendix: `enterobacterias-ufc-calc` (NEW — supplementary)

> Capacidad auxiliar. Se implementa como clone 1:1 de `ufcSau.calculator.js`, con renombre de la función exportada y del campo `nSAureus` → `nEnterobacterias`. Se mantiene el resto de la lógica idéntica.

### Requirement: UEC-01 — Calculadora `calcularUfcEnt`

El sistema SHALL exponer `calculators/ufcEnt.calculator.js` con la función `calcularUfcEnt({ volumen = 1, diluciones = [] })` que retorna `{ nEnterobacterias, ufcPorG, incongruenciaDetectada, observacionIncongruencia, operador, esEstimado, casoAplicado }`.

#### Scenario: Rango óptimo (Prioridad 1)
- GIVEN `{ volumen: 1, diluciones: [{ dil: -1, colonias: [50, 55] }] }`
- WHEN se invoca `calcularUfcEnt`
- THEN SHALL retornar `ufcPorG: 525` (promedio 52.5 / 0.1), `operador: '='`, `casoAplicado: 'PRIORIDAD_1'`, `esEstimado: false`

#### Scenario: Rango bajo (Prioridad 2)
- GIVEN `{ diluciones: [{ dil: -2, colonias: [5, 7] }] }` (promedio 6 < 15)
- WHEN se invoca
- THEN SHALL retornar `operador: '<'`, `casoAplicado: 'PRIORIDAD_2'`, `ufcPorG: 1500` (15/0.01)

#### Scenario: Sin crecimiento (Prioridad 4)
- GIVEN `{ diluciones: [{ dil: -1, colonias: [0, 0] }] }`
- WHEN se invoca
- THEN SHALL retornar `operador: '<'`, `casoAplicado: 'PRIORIDAD_4'`

#### Scenario: Incongruencia detectada
- GIVEN `{ diluciones: [{ dil: -1, colonias: [10, 50] }] }` (max/min = 5 > 2)
- WHEN se invoca
- THEN SHALL retornar `incongruenciaDetectada: true` con `observacionIncongruencia` describiendo el ratio

---

### Requirement: UEC-02 — Tests unitarios `ufcEnt.calculator.test.js`

El sistema SHALL crear `__tests__/unit/ufcEnt.calculator.test.js` clonando los casos del test de S. Aureus, con los siguientes casos mínimos:

| # | Caso | Esperado |
|---|------|----------|
| 1 | Rango óptimo | `PRIORIDAD_1`, `operador: '='` |
| 2 | Rango bajo | `PRIORIDAD_2`, `operador: '<'` |
| 3 | Rango exceso < 300 | `PRIORIDAD_3A`, `esEstimado: true` |
| 4 | Rango exceso ≥ 300 | `PRIORIDAD_3B`, `operador: '>'` |
| 5 | Sin crecimiento | `PRIORIDAD_4`, `operador: '<'` |
| 6 | Sin datos (array vacío) | `casoAplicado: 'SIN_DATOS'`, `ufcPorG: null` |
| 7 | Incongruencia 0 + >0 | `incongruenciaDetectada: true` |
| 8 | Incongruencia ratio > 2 | `incongruenciaDetectada: true` |

#### Scenario: Suite completa verde
- GIVEN los 8 casos del test
- WHEN se ejecuta `pnpm test -- ufcEnt.calculator`
- THEN SHALL pasar los 8 casos sin fallos

---

### Requirement: UEC-03 — Feature flag en `enterobacterias.service.js`

El sistema SHALL leer `process.env.ENT_UFC_CALC_ENABLED` (default `true`) y SHALL omitir la llamada a `calcularUfcEnt` cuando el flag sea `false`. El flag SHALL permitir rollback rápido sin redeploy.

#### Scenario: Flag activado (default)
- GIVEN `ENT_UFC_CALC_ENABLED` no está definido o es `'true'`
- WHEN se guarda etapa 2 con `completada: true`
- THEN SHALL invocar `calcularUfcEnt` y persistir `ufcPorG`

#### Scenario: Flag desactivado
- GIVEN `ENT_UFC_CALC_ENABLED === 'false'`
- WHEN se guarda etapa 2
- THEN SHALL persistir los datos sin calcular `ufcPorG` (queda `null`)

---

## Frontend — Comportamiento UI (resumen compacto)

| Elemento | Comportamiento |
|----------|----------------|
| Botón "Siguiente" entre sub-pasos 1↔2↔…↔9 | Navegación local, sin HTTP |
| Botón "Siguiente" en paso 2 | `PUT /fase/2` con `fase2a` |
| Botón "Siguiente" en paso 3 | `PUT /fase/3` con `fase2b` + `tweenPipetas` + `micropipetas` |
| Botón "Siguiente" en paso 4 | `PUT /fase/4` con `fase2c` |
| Botón "Siguiente" en paso 5 | `PUT /fase/5` con `fase3a` |
| Botón "Siguiente" en paso 6 | `PUT /fase/6` con `fase3b` + `pipetas` |
| Botón "Siguiente" en paso 7 | `PUT /fase/7` con `lecturas[]` (Fase 3c) |
| Botón "Siguiente" en paso 8 | `PUT /fase/8` con `fase4a` |
| Botón "Siguiente" en paso 9 | `PUT /fase/9` con `lecturas[]` (Fase 4b) |
| Botón "Finalizar" en paso 10 | `PUT /fase/10` → backend auto-calcula y muestra Presencia/Ausencia |
| "Guardar Borrador" | `PUT` con `completada: false`, permanece en el paso |
| Banner amarillo paso 2 | Visible si `alertaTiempo25min === true` |

### RBAC Frontend
- `allowedRoles` en ruta `/form-salmonella`: mantener `[0, 4]` (escritura) — la propuesta NO incluye LAB-6 aquí.
- Coordinadora/Jefe Área aún no tienen acceso de lectura (sin LAB-6 equivalente en este change).

---

## Contratos de API (resumen)

| Método | Ruta | Auth | Body | 2xx | Errores clave |
|--------|------|------|------|-----|----------------|
| `GET` | `/formulario/sal/por-analisis/:idAnalisis` | READ (todos los autenticados) | — | `{ existe, formulario }` | 403, 404 |
| `GET` | `/formulario/sal/:id` | READ | — | `SalFormularioCompleto` | 403, 404 |
| `PUT` | `/formulario/sal/:id/fase/:n` (n 1..10) | WRITE `[0, 4]` | `{ updated_at, completada, fase, ...payload específico }` | `SalFormularioCompleto` | 400, 403, 409 `CONCURRENCY_ERROR` / `INVALID_STAGE_PROGRESSION` / `TIPO_MATRIZ_REQUERIDO` / `HIDRATACION_INTERVALO_INVALIDO` / `HOMO_ESTUFA_INTERVALO_INVALIDO` |
| `GET` | `/formulario/ent/por-analisis/:idAnalisis` | READ | — | `{ existe, formulario, ufcPorG }` | 403, 404 |
| `GET` | `/formulario/ent/:id` | READ | — | `EntFormularioCompleto` con `ufcPorG` | 403, 404 |
| `PUT` | `/formulario/ent/:id/etapa/2` | WRITE | (existente) | + `ufcPorG` en respuesta | (existente) |

### Errores nuevos (Salmonella)
- `TIPO_MATRIZ_REQUERIDO` (400) — payload de Fase 1 sin `tipoMatriz`
- `HIDRATACION_INTERVALO_INVALIDO` (400) — `horaTermino < horaInicio`
- `HOMO_ESTUFA_INTERVALO_INVALIDO` (400) — `horaIngresoEstufa < horaTerminoHomo`

---

## Consideraciones de Base de Datos

> **Out of scope** (per proposal): cambios de schema Prisma. La nueva columna `ufcPorG` en `ent_etapa3` requiere una migración aditiva, que **debe coordinarse** con el equipo de DB antes de implementar. Opciones:

| Opción | Pros | Contras |
|--------|------|---------|
| **A**: agregar columna `ufcPorG DECIMAL(15,4) NULL` en `ent_etapa3` | Limpio, persistible | Requiere migración Prisma + regenerar cliente |
| **B**: devolver `ufcPorG` solo en response (no persistir) | Cero migración | Se pierde tras refresh; inconsistente con el spec |
| **C**: derivar `ufcPorG` en frontend desde `coloniasContadas`/`dilucion` | Sin cambios backend | Duplica lógica, contradice la calculadora server-side |

**Recomendación**: Opción A. Agregar la columna vía `prisma migrate dev` cuando se implemente ECB-08.

---

## Matriz de Trazabilidad

| Req    | Cubre                  | LAB       | Endpoint / Archivo                                                |
| ------ | ---------------------- | --------- | ----------------------------------------------------------------- |
| SFE-01 | Fix ruteo              | LAB-48    | `muestraAli.repository.js`                                        |
| SFE-02 | HTTP service           | LAB-64    | `salmonella-api.service.ts`                                       |
| SFE-03 | Interfaces             | LAB-64    | `salmonella.interfaces.ts`                                        |
| SFE-04 | Wizard 10 pasos        | LAB-64    | `form-salmonella.page.ts/html`                                    |
| SFE-05 | Banner alerta 25min    | LAB-63/64 | `form-salmonella.page.html`                                       |
| SPR-01 | Caldo auto-asignado    | LAB-62    | `salmonella.service.js::_asignarCaldoPorMatriz`                   |
| SPR-02 | Validación hidratación | LAB-62    | `salmonella.service.js::_validarHidratacion`                      |
| SPR-03 | Alerta 25 min          | LAB-63    | `salmonella.service.js::_calcularAlerta25min`                     |
| ECB-08 | Cálculo UFC Ent        | Extra     | `enterobacterias.service.js`                                      |
| ECB-09 | Adapter                | Extra     | `enterobacterias.service.js::_adaptarParaUfcEnt`                  |
| ECB-10 | Exposición `ufcPorG`   | Extra     | `enterobacterias.service.js::serializeFormulario`                 |
| UEC-01 | Calculadora nueva      | Extra     | `calculators/ufcEnt.calculator.js`                                |
| UEC-02 | Tests                  | Extra     | `__tests__/unit/ufcEnt.calculator.test.js`                        |
| UEC-03 | Feature flag           | Extra     | `enterobacterias.service.js` + `process.env.ENT_UFC_CALC_ENABLED` |

---

## Out of Scope (per proposal)

- Cambios de schema Prisma (la columna `ent_etapa3.ufcPorG` se coordinará por separado si se aprueba Opción A).
- Refactor de UI de Enterobacterias (sólo se agrega el cálculo UFC).
- Alertas activas (cron / node-cron) — validación on-demand.
- Exportación PDF/Excel.
- LAB-6 equivalente para Salmonella (acceso lectura a Coordinadora) — el change mantiene `allowedRoles: [0, 4]`.
- Modificación de `presenciaSal.calculator.js`.

---

## Criterios de Aceptación Globales

- [ ] Click en formulario SALMONELLA desde Muestra ALI → navega a `/form-salmonella` (LAB-48).
- [ ] `tipoMatriz: 'Chocolate'` → backend persiste `caldoAsignadoAuto: 'Leche descremada'` (LAB-62).
- [ ] Delta homogeneización→estufa > 25 min → `alertaTiempo25min: true` y banner amarillo visible (LAB-63).
- [ ] Wizard frontend navega localmente entre 9 pasos y dispara `PUT` en cada paso con `completada: true` (LAB-64).
- [ ] Optimistic locking: dos `PUT` simultáneos con mismo `updated_at` → uno 200, otro 409.
- [ ] `ufcPorG` aparece en `GET /formulario/ent/:id` con valor numérico tras etapa 2 completa.
- [ ] Suite de tests: 8 casos para `ufcEnt.calculator` + casos existentes de `salmonella` sin regresión.
- [ ] Lint frontend sin warnings nuevos en `form-salmonella/`.
- [ ] Feature flag `ENT_UFC_CALC_ENABLED=false` desactiva la calculadora sin errores.
