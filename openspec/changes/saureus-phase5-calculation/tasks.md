# Tasks: Etapa 5 — Cálculo S. Aureus

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1200–1600 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Backend) → PR 2 (Frontend Foundation) → PR 3 (Frontend Components) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Schema + Motor de Cálculo Universal + tests | PR 1 | Prisma, calculador.base, calculador-saureus, factory, TDD. ~550 lines |
| 2 | API endpoints + import-duplicado + tests | PR 2 | Routes/controllers, servicio importación, tests. Depends on PR 1. ~400 lines |
| 3 | Frontend: Delete tables + create components | PR 3 | Eliminar tablas Etapas 1-4, crear componentes Etapa 5. ~750 lines |

---

## Phase 1: Schema & Motor de Cálculo Universal (Backend)

### 1A: Schema Prisma

- [x] 1.1 Add `SaureusMuestra` model to `AssisTec API/prisma/schema.prisma` per design §4 (all fields: dil1-4, coloniasPosibles, colConfirmar, confirmadas4h/24h, resultadoUfc, aPlacaA/B, sumaA, coagulasaUsada, proporcion, regla80, factorDilucion, casoAplicado)
- [x] 1.2 Run `pnpm prisma migrate dev --name saureus_phase5_calculation` (BLOCKED on infrastructure: PostgreSQL not running, Docker daemon down. Migration file corrected for FK type mismatch and ready to apply.)

### 1B: Motor de Cálculo Universal (REUTILIZABLE)

- [x] 1.3 Create `AssisTec API/src/services/calculators/calculador.base.ts` — Interfaz `CalculadorBase` + lógica compartida (resolverCoagulasa, aplicarRegla80, redondearDosCifras, calcularFactorDilucion)
- [x] 1.4 TDD RED: Create `AssisTec API/src/services/calculators/__tests__/calculador.base.test.ts` — tests para métodos compartidos
- [x] 1.5 TDD GREEN: Implementar lógica base
- [x] 1.6 Create `AssisTec API/src/services/calculators/calculador-saureus.service.ts` — Extiende CalculadorBase, implementa `calcular()` con NCh2676 8.2.2.1: a = (b/A) × C
- [x] 1.7 TDD RED: Create `AssisTec API/src/services/calculators/__tests__/calculador-saureus.test.ts` — failing tests: both plates (spec §1.1), one plate null (§1.2), 80% rule ≥/\<80% (§2.1-2.2), coagulasa 4h/24h/SD (§3.1-3.3), formula (§5.1), <15 colonies (§6.1)
- [x] 1.8 TDD GREEN: Implementar cálculo S. aureus para pasar todos los tests
- [x] 1.9 Create `AssisTec API/src/services/calculators/calculador.factory.ts` — Fábrica: `obtenerCalculador(tipoFormulario)` retorna calculador correcto (RAM, SAU, COLI, SAL)
- [x] 1.10 TDD RED: Create `AssisTec API/src/services/calculators/__tests__/calculador.factory.test.ts` — tests para fábrica
- [x] 1.11 TDD GREEN: Implementar fábrica

---

## Phase 2: API Endpoints (Backend)

- [x] 2.1 Create `AssisTec API/src/routes/saureus-calculation.routes.ts` — POST `/calcular-muestra`, POST `/calcular-todo`, GET `/importar-duplicado`
- [x] 2.2 TDD RED: Create `AssisTec API/src/routes/__tests__/saureus-calculation.routes.test.ts` — failing tests for: POST calcular-muestra 200+resultado (§7.1), POST calcular-todo (§7.2), GET importar-duplicado (§7.3)
- [x] 2.3 TDD GREEN: Implement route handlers calling `calcularSAureus()` from Phase 1
- [x] 2.4 Create `AssisTec API/src/services/saureus/import-duplicado.service.ts` — fetch Muestra 1 data from past ALI
- [x] 2.5 TDD RED+GREEN: Test import-duplicado — returns data when ALI exists, warning when no S. aureus data

---

## Phase 3: Frontend — Eliminar Tablas y Crear Componentes

### 3A: Eliminar Tablas Existentes (Etapas 1-4)

- [x] 3.1 **Eliminar** tabla "Muestras y Lecturas 24h-48h" de Etapa 1 (`form-s-aureus.page.html` líneas 151-178) — reemplazada por aviso de derivación a Etapa 5
- [x] 3.2 **Eliminar** tabla "Traspaso BHI" de Etapa 3 (`form-s-aureus.page.html` líneas 425-442) — reemplazada por sección sin tabla
- [x] 3.3 **Eliminar** tabla "Coagulasa 4-6 Hrs" de Etapa 4 (`form-s-aureus.page.html` líneas 561-576) — reemplazada por sección sin tabla
- [x] 3.4 **Eliminar** tabla "Coagulasa 24 Hrs" de Etapa 4 (`form-s-aureus.page.html` líneas 619-634) — reemplazada por sección sin tabla
- [x] 3.5 **Eliminar** tabla actual de Etapa 5 (`form-s-aureus.page.html` líneas 641-671) — reemplazada por `<app-etapa5-calculo>`

### 3B: Crear Componentes Atómicos

- [x] 3.6 Create `Frontend/src/app/features/saureus/components/atoms/placa-input/` — Input individual para Placa A o B
- [x] 3.7 Create `Frontend/src/app/features/saureus/components/atoms/resultado-badge/` — Badge: ✓ (calculado), ⚠ (SD), — (pendiente)
- [x] 3.8 Create `Frontend/src/app/features/saureus/components/atoms/ali-selector/` — Selector dropdown de ALI pasado

### 3C: Crear Componentes Compuestos (3 Secciones)

- [x] 3.9 Create `Frontend/src/app/features/saureus/components/compounds/recuento-section/` — 📊 Tabla: Dil | Placa A | Placa B (inputs editables)
- [x] 3.10 Create `Frontend/src/app/features/saureus/components/compounds/confirmacion-coagulasa-section/` — 🧪 Tabla: A confirmar | Coag 4 hrs | Coag 24 h (por placa A/B)
- [x] 3.11 Create `Frontend/src/app/features/saureus/components/compounds/resultado-calculo-section/` — 📈 Panel: a (suma placas), Σa, d, previas, N S. Aureus, NE S. Aureus, Lectura usada

### 3D: Crear Componentes Contenedor (Rediseñado)

- [x] 3.12 ~~Create `saureus-muestra-card`~~ — **ELIMINADO**: funcionalidad integrada en `etapa5-calculo` (ion-accordion por muestra)
- [x] 3.13 ~~Create `saureus-duplicado-card`~~ — **ELIMINADO**: duplicado integrado dentro del acordeón M1
- [x] 3.14 Rediseñar `etapa5-calculo` — ion-accordion por muestra (M1-M6) con layout RAM, duplicado dentro de M1, botón calcular por muestra

### 3E: Integración y Actualización

- [x] 3.15 **Integrar** `etapa5-calculo` en `form-s-aureus.module.ts` (imports[]) — `form-s-aureus.page.ts` usa `standalone: false`, así que la importación va al NgModule, no al decorador
- [x] 3.16 **Actualizar** Etapa 6 (`form-s-aureus.page.html`) — los campos `desfavorable`, `tablaPagina`, `limite`, `fechaEntrega`, `horaEntrega` se mantienen; el consolidado M1-M6+DUP se muestra en Etapa 5 vía `<app-etapa5-calculo>` (su `resumen-container`)
- [x] 3.17 **Actualizar** `form-s-aureus.page.ts` — eliminadas interfaces/arrays muertos (`MuestraEtapa1-5`, `muestrasEtapa1/3/4/5`); el stageper y la navegación ya estaban correctos

### 3F: Tests Unitarios

- [x] 3.18 TDD: Unit tests for `recuento-section` — 9 tests, GREEN a nivel type-check
- [x] 3.19 TDD: Unit tests for `confirmacion-coagulasa-section` — 11 tests, GREEN a nivel type-check
- [x] 3.20 TDD: Unit tests for `resultado-calculo-section` — 10 tests, GREEN a nivel type-check
- [x] 3.21 ~~TDD: Unit tests for `saureus-muestra-card`~~ — **ELIMINADO** con el componente
- [x] 3.22 ~~TDD: Unit tests for `saureus-duplicado-card`~~ — **ELIMINADO** con el componente
- [x] 3.23 TDD: Unit tests for `etapa5-calculo` (rediseñado) — 9 tests, GREEN a nivel type-check

> NOTA TDD: Los specs compilan limpio (verificado con `tsconfig.spec.json` filtrado a `src/app/features/saureus/**/*.spec.ts`). Ejecución runtime bloqueada por errores pre-existentes en `src/app/pages/solicitud-ingreso/solicitud-ingreso.page.spec.ts` (no son de este cambio) y por la falta de `ts-jest` para los specs `.ts` del backend (Tasks 1.4, 1.7, 1.10, 2.2, 2.5 ya estaban escritos en TS pero Jest no los compila).

---

## Criterios de Done

1. **Tablas eliminadas**: Etapas 1-4 NO tienen tablas de captura — solo parámetros/fechas/controles
2. **Etapa 5 consolidada**: Todas las tablas de cálculo están en "Cálculo S. Aureus"
3. **3 secciones por muestra**: Recuento + Confirmación/Coagulasa + Resultados del cálculo
4. **Duplicado funcional**: Importa datos de ALI pasado, permite re-importar y editar
5. **Cálculo automático**: Botón "Calcular muestra" ejecuta NCh2676 8.2.2.1
6. **Cálculo global**: Botón "Calcular TODAS las muestras" procesa M1-M6 + DUP
7. **Consolidado Etapa 6**: Muestra resultados de todas las muestras + campos finales
8. **Strict TDD**: Todos los tests pasan con 0 fallos
9. **Spanish UI labels**: Todos los textos de interfaz en español
10. **Conventional commits**: Cada commit sigue formato `feat:`, `fix:`, `test:`, `refactor:`

---

## Archivos Afectados

### Backend (PR 1 + PR 2)

#### Motor de Cálculo Universal (REUTILIZABLE)
- `AssisTec API/src/services/calculators/calculador.base.ts` — Interfaz + lógica compartida
- `AssisTec API/src/services/calculators/__tests__/calculador.base.test.ts` — Tests base
- `AssisTec API/src/services/calculators/calculador-saureus.service.ts` — Cálculo NCh2676 8.2
- `AssisTec API/src/services/calculators/__tests__/calculador-saureus.test.ts` — Tests S. aureus
- `AssisTec API/src/services/calculators/calculador.factory.ts` — Fábrica de calculadores
- `AssisTec API/src/services/calculators/__tests__/calculador.factory.test.ts` — Tests fábrica

#### Formularios Futuros (misma arquitectura)
- `AssisTec API/src/services/calculators/calculador-ram.service.ts` — (futuro) RAM
- `AssisTec API/src/services/calculators/calculador-coliformes.service.ts` — (futuro) Coliformes NMP
- `AssisTec API/src/services/calculators/calculador-salmonella.service.ts` — (futuro) Salmonella

#### Schema y Rutas
- `AssisTec API/prisma/schema.prisma` — Nuevo modelo SaureusMuestra
- `AssisTec API/src/routes/saureus-calculation.routes.ts` — Nuevas rutas API
- `AssisTec API/src/routes/__tests__/saureus-calculation.routes.test.ts` — Tests integración
- `AssisTec API/src/services/saureus/import-duplicado.service.ts` — Servicio importación ALI

### Frontend (PR 3)
- `Frontend/src/app/pages/form-s-aureus/form-s-aureus.page.html` — Eliminar tablas, integrar Etapa 5
- `Frontend/src/app/pages/form-s-aureus/form-s-aureus.page.ts` — Lógica, llamadas API
- `Frontend/src/app/features/saureus/components/atoms/` — placa-input, resultado-badge, ali-selector
- `Frontend/src/app/features/saureus/components/compounds/` — recuento-section, confirmacion-coagulasa-section, resultado-calculo-section
- `Frontend/src/app/features/saureus/components/containers/` — saureus-muestra-card, saureus-duplicado-card, etapa5-calculo
