# Exploration: Salmonella Flow

> **Date**: 2026-06-24
> **Status**: Complete — ready for proposal
> **Coverage**: LAB-48, LAB-62, LAB-63, LAB-64 + extra Enterobacterias calculator task

---

## 1. Current State

### 1.1 Backend — Salmonella (`sal_*`) — FULLY IMPLEMENTED

The Salmonella backend follows the established `sau_*` / `coli_*` / `ent_*` pattern and is *already complete*:

| Layer | File | Role |
|-------|------|------|
| Repository | `AssisTec API/src/repositories/salmonella.repository.js` | Prisma CRUD for `salFormulario` with 10-phase upserts, TOCTOU fix (`updateMany + count === 1`) |
| Service | `AssisTec API/src/services/salmonella.service.js` | 10 sub-phases (fase 1-10), optimistic concurrency, stage-progression gating, Presencia/Ausencia auto-calculation |
| Controller | `AssisTec API/src/controllers/salmonella.controller.js` | Error-mapped controller (`NOT_FOUND`, `UNAUTHORIZED_ROLE`, `CONCURRENCY_ERROR`, etc.) |
| Routes | `AssisTec API/src/routes/salmonella.routes.js` | `GET /:id`, `GET /por-analisis/:idAnalisis`, `PUT /:id/fase/:fase` (with dynamic `validateForm` per fase) |
| Calculator | `AssisTec API/src/calculators/presenciaSal.calculator.js` | Determina "Presencia" o "Ausencia" from 8 agar readings (XLD/SS × 24h/48h × Selenito/Rappaport) |
| Tests | `src/tests/unit/services/salmonella.service.test.js` | 6 test cases: auth, serialization, CRUD, fase-10 auto-calculation |
| Tests | `src/tests/unit/repositories/salmonella.repository.test.js` | Repository-level tests |
| Tests | `src/tests/unit/calculators/presenciaSal.calculator.test.js` | Calculator unit tests |

Phases (10 sub-fases mapped to 5 logical etapas):
- **Fase 1**: Inicio y Trazabilidad (tipoMatriz, pesoMuestra, caldoHomogeneizacion, caldoAsignadoAuto, hidratacion)
- **Fase 2-3**: Fase2a (siembra, homogeneización, alerta 25 min transporte a estufa) + Fase2b (insumos, estufa, pipetas)
- **Fase 4**: Fase2c (controles de calidad: ctrl análisis, ctrl positivo, ctrl siembra)
- **Fase 5-7**: Fase3a (traspaso a caldos) + Fase3b (estufa selenito, pipetas) + Fase3c (lecturas caldo APT/selenito/rappaport)
- **Fase 8-9**: Fase4a (traspaso a agares XLD/SS) + Fase4b (lecturas 24h/48h)
- **Fase 10**: Fase5 (cálculo automático Presencia/Ausencia → upsert resultados finales)

### 1.2 Frontend — Salmonella (`form-salmonella`) — STUB ONLY

The frontend salmonella page exists but is a **mock/stub** with no backend connectivity:

| File | Status |
|------|--------|
| `form-salmonella.page.ts` | Stub with mock data (`MOCK_SOLICITUD`), 5 logical etapas, no API injection |
| `form-salmonella.page.html` | HTML template exists (likely mock UI) |
| `form-salmonella.module.ts` | Module with `ReactiveFormsModule`, `ComponentsModule` |
| `form-salmonella-routing.module.ts` | Lazy-loaded route at `/form-salmonella` |
| `app-routing.module.ts` | Route registered: `path: 'form-salmonella'`, roles: `[0, 4]` (ANALISTA, ADMIN) |
| **No `salmonella-api.service.ts`** | **MISSING** — no HTTP service connecting to the backend |
| **No `salmonella.interfaces.ts`** | **MISSING** — no TypeScript interfaces for the 10-phase payloads |

Current page structure (5 logical etapas in the stub):
1. Inicio y Trazabilidad (incubación, tipoMatriz, peso, caldo, hidratación, siembra, homogeneización, ingreso estufa, analista)
2. Insumos y Calidad (lote caldo, Tween80, micropipetas, estufa, controles de calidad)
3. Traspaso a Caldos (fecha traspaso, lectura APT, lectura caldos, selenito, pipetas)
4. Resultados en Agar (traspaso agares XLD/SS, estufa, lecturas 24h/48h)
5. Conclusión Final (resultados Presencia/Ausencia por muestra + duplicado)

### 1.3 The Bug — LAB-48

**File**: `AssisTec API/src/repositories/muestraAli.repository.js`, line 93

```js
const mapa = {
    SAUREUS: '/form-s-aureus',
    COLIFORMES: '/form-coliformes',
    SALMONELLA: '/form-enterobacterias'   // ← BUG: should be '/form-salmonella'
};
```

**Impact**: When a user navigates from the "Muestra ALI" view and clicks on a Salmonella formulario, they are taken to `/form-enterobacterias` instead of `/form-salmonella`. The correct route `/form-salmonella` is registered in `app-routing.module.ts` (line 110).

**Fix**: Change `SALMONELLA: '/form-enterobacterias'` → `SALMONELLA: '/form-salmonella'`.

### 1.4 Enterobacterias Backend — No UFC/g Calculator

The Enterobacterias service (`enterobacterias.service.js`) collects `coloniasContadas` and `dilucion` in etapa 2 (Lectura 24h) but **does not calculate UFC/g**. The etapa 3 results section has fields like `sumaA`, `n1`, `n2`, `m`, `d` but no computation logic is wired.

### 1.5 S. Aureus Calculator Pattern (`ufcSau.calculator.js`)

Standalone calculator (not wired through the TypeScript `CalculadorFactory`) that:

```
Input: { volumen: 1, diluciones: [{ dil: -1, colonias: [c1, c2] }, ...] }
Logic: Classifies each dilution into RANGO_OPTIMO (15-300), RANGO_BAJO (<15), RANGO_EXCESO (>300), RANGO_SIN_CRECIMIENTO
Priority cascade: 1 (Óptimo) → 2 (Bajo) → 3 (Exceso) → 4 (Sin crecimiento)
Incongruencia detection: 0+>0 plate pair or max/min ratio > 2
Output: { nSAureus, ufcPorG, incongruenciaDetectada, observacionIncongruencia, operador, esEstimado, casoAplicado }
```

The calculator is **identical logic** to what Enterobacterias needs (UFC/g with dilution factor and optimal ranges).

---

## 2. Affected Areas

| # | File | Issue | Change Type |
|---|------|-------|-------------|
| LAB-48 | `AssisTec API/src/repositories/muestraAli.repository.js:93` | Wrong route for SALMONELLA | 1-line fix |
| LAB-62 | `AssisTec API/src/services/salmonella.service.js` (mapFase1Payload, lines 46-58) | Lógica de matrices (chocolate/polvo/hidratación) — fields exist but need validation/auto-assignment logic | Logic enhancement |
| LAB-63 | `AssisTec API/src/services/salmonella.service.js` (mapFase2aPayload, lines 61-74) | Alerta 25 min transporte homogeneización → estufa — `minutosHomoAEstufa` and `alertaTiempo25min` fields exist | Logic enhancement |
| LAB-64 | `AssisTec API/src/services/salmonella.service.js` (entire `guardarFase` flow) | Trazabilidad operativa, controles y resultado final — backend is complete but frontend needs wiring | Frontend implementation |
| LAB-64 | `Frontend/src/app/pages/form-salmonella/` (all files) | Frontend stub needs full API integration (API service, interfaces, reactive wiring to 10 phases) | Full frontend build |
| Extra | `AssisTec API/src/calculators/ufcEnt.calculator.js` (NEW) | Clone of `ufcSau.calculator.js` for Enterobacterias | New file |
| Extra | `AssisTec API/src/services/enterobacterias.service.js` | Wire `ufcEnt.calculator.js` into etapa 2/3 calculation flow | Logic integration |
| Extra | `AssisTec API/__tests__/unit/ufcEnt.calculator.test.js` (NEW) | Clone of `ufcSau.calculator.test.js` | New file |

---

## 3. Detailed Task Breakdown

### 3.1 LAB-48: Fix Salmonella Route (Bug)

**Single-line change**: `muestraAli.repository.js:93`
- Old: `SALMONELLA: '/form-enterobacterias'`
- New: `SALMONELLA: '/form-salmonella'`

**Risk**: None. The route `/form-salmonella` already exists and is registered in `app-routing.module.ts`.

### 3.2 LAB-62: Lógica de Matrices (Chocolate, Polvo, Hidratación)

**Current state**: The service maps `tipoMatriz`, `caldoHomogeneizacion`, `caldoAsignadoAuto`, `horaInicioHidratacion`, `horaTerminoHidratacion`, `hidratacionValida` in `mapFase1Payload`. The frontend stub has auto-assignment logic for chocolate products:

```ts
// form-salmonella.page.ts:182-188
this.form.get('e1_tipoMatriz')?.valueChanges.subscribe(val => {
    if (val === 'Normal' || val === 'Polvo') {
        this.form.get('e1_caldoAPT')?.setValue('Caldo APT');
    } else if (val === 'Chocolate') {
        this.form.get('e1_caldoAPT')?.setValue('Leche descremada');
    }
});
```

**What needs to happen**:
- Move matrix logic from frontend stub to backend service (or keep as frontend validation + backend validation)
- Ensure `caldoAsignadoAuto` is populated based on `tipoMatriz` value
- Validate hydration interval is ≥ minimum required for the matrix type

**Approach**: Add a `_asignarCaldoPorMatriz(tipoMatriz)` method in `salmonella.service.js` that auto-assigns `caldoAsignadoAuto` based on matrix type. Keep frontend display logic. Backend validates.

### 3.3 LAB-63: Alerta 25 Min (Transporte Homogeneización → Estufa)

**Current state**: The service already maps `horaInicioHomo`, `horaTerminoHomo`, `horaIngresoEstufa`, `minutosHomoAEstufa`, and `alertaTiempo25min` in `mapFase2aPayload`.

**What needs to happen**:
- Calculate `minutosHomoAEstufa` = difference between `horaTerminoHomo` and `horaIngresoEstufa`
- If `minutosHomoAEstufa > 25`, set `alertaTiempo25min = true`
- Display alert in frontend UI
- This is similar to Enterobacterias' 24h incubation lockout pattern

**Approach**: Add `_calcularAlerta25min(horaTerminoHomo, horaIngresoEstufa)` method in the service. The frontend should display a visual alert (yellow/red indicator) when the threshold is exceeded.

### 3.4 LAB-64: Trazabilidad Operativa, Controles y Resultado Final

**Current state**: Backend is complete. Frontend is a non-functional stub.

**What needs to happen**:
1. **Create `salmonella-api.service.ts`** — HTTP service with `obtener()`, `obtenerPorAnalisis()`, `guardarFase()` methods (follow `enterobacterias-api.service.ts` pattern)
2. **Create `salmonella.interfaces.ts`** — TypeScript interfaces for `SalFase1Payload`, `SalFase2aPayload`, ..., `SalFormularioCompleto` (follow `enterobacterias.interfaces.ts` pattern)
3. **Rebuild `form-salmonella.page.ts`** — Remove mock data, inject API service, wire 10 sub-fases (like enterobacterias' 8 subetapas pattern), implement:
   - Etapa 1 (Fase 1): Trazabilidad — codigoALI, tipoMatriz, peso, caldo auto-asignado, hidratación
   - Etapa 2 (Fase 2a): Siembra — fechas, homogeneización, alerta 25min, analista
   - Etapa 3 (Fase 2b): Insumos — caldo APT, Tween80, micropipetas, estufa
   - Etapa 4 (Fase 2c): Controles calidad — ctrl análisis, ctrl positivo, ctrl siembra
   - Etapa 5 (Fase 3a): Traspaso caldos — fecha, lectura APT, lectura caldos finales, analistas
   - Etapa 6 (Fase 3b): Estufa selenito + pipetas
   - Etapa 7 (Fase 3c): Lecturas caldo APT/selenito/rappaport + controles (S. Enteritidis, K. Pneumoniae, blanco)
   - Etapa 8 (Fase 4a): Traspaso agares XLD/SS — lotes, estufa, analistas
   - Etapa 9 (Fase 4b): Lecturas 24h/48h en agar — XLD/SS × Selenito/Rappaport + controles
   - Etapa 10 (Fase 5): Resultado final — auto-calculado (backend), display Presencia/Ausencia por muestra
4. **Optimistic concurrency**: Send `updatedAt` with every PUT, handle 409 responses (like enterobacterias page does)

### 3.5 Extra: Enterobacterias UFC/g Calculator

**Task**: Clone `ufcSau.calculator.js` → `ufcEnt.calculator.js` and integrate into Enterobacterias service.

**Steps**:
1. Copy `src/calculators/ufcSau.calculator.js` → `src/calculators/ufcEnt.calculator.js`
2. Rename exported function: `calcularUfcSau` → `calcularUfcEnt`
3. Adjust output field names: `nSAureus` → `nEnterobacterias` (or `ufcPorG` only)
4. Copy `__tests__/unit/ufcSau.calculator.test.js` → `__tests__/unit/ufcEnt.calculator.test.js`
5. Update test imports and describe blocks
6. Wire into `enterobacterias.service.js`:
   - In etapa 2 (`guardarEtapa` case 2), after saving, if `completada`, call `calcularUfcEnt()` with the etapa 2's `dilucion` and `coloniasContadas`
   - Store the result in etapa 3 or in the etapa 2 response
   - Alternatively, add a calculation step in etapa 3 (resultados) that reads etapa 2 data
7. The Enterobacterias model has `dilucion` (single value vs array) and `coloniasContadas` (single value vs array). The calculator expects `diluciones: [{ dil, colonias: [c1, c2] }]` — adapt the single-value fields to the array format.

**Pattern to follow**: `presenciaSal.calculator.js` integration in `salmonella.service.js` (Fase 10 auto-calculates from Fase 4b readings).

---

## 4. Approaches

### Approach A: Full Backend → Frontend (Recommended)

1. Fix LAB-48 first (1-line fix, no dependencies)
2. Add LAB-62/63 backend logic in salmonella.service.js
3. Build salmonella frontend from scratch (API service, interfaces, page)
4. Add ufcEnt.calculator.js and wire into enterobacterias.service.js
5. Run tests

| Pros | Cons |
|------|------|
| Backend is already 80% complete for Salmonella | Frontend build is the largest effort |
| Follows existing patterns exactly | Salmonella page currently a non-functional stub |
| Low regression risk | Must replicate enterobacterias' 8-subetapa reactive pattern with 10 phases |

### Approach B: Incremental Frontend on Existing Stub

1. Fix LAB-48 first
2. Modify the existing `form-salmonella.page.ts` stub to add API injection
3. Backend additions for LAB-62/63
4. ufcEnt.calculator.js

| Pros | Cons |
|------|------|
| Reuses existing 5-etapa UI | Stub has wrong structure (5 logical etapas vs backend's 10 sub-fases) |
| Less new code | Mixing mock data with real data is fragile |

### Recommendation: **Approach A**

The existing stub maps 5 logical etapas that don't align with the backend's 10 sub-fases. The enterobacterias page already demonstrates the correct pattern (8 sub-pasos mapped to 3 logical etapas). Building fresh follows the proven pattern.

---

## 5. Implementation Order

```
1. LAB-48 (1-line fix) — independent, no risk
2. LAB-62 + LAB-63 (backend logic) — add to salmonella.service.js
3. LAB-64 Phase 1: create salmonella-api.service.ts + salmonella.interfaces.ts
4. LAB-64 Phase 2: rebuild form-salmonella.page.ts (10 sub-etapas)
5. Extra: ufcEnt.calculator.js + wiring + tests
```

---

## 6. Risks

- **Frontend scope**: The form-salmonella rebuild is the largest effort (~400+ lines of TypeScript/HTML). Consider splitting into a chained PR.
- **Enterobacterias calculator mismatch**: The calculator expects array `diluciones: [{ dil, colonias: [c1, c2] }]` but Enterobacterias stores single `dilucion` and `coloniasContadas` values. An adapter layer is needed.
- **Auth guard**: The `/form-salmonella` route only allows roles `[0, 4]`. The Enterobacterias route allows `[0, 1, 2, 4]`. Verify with the team if COORDINADORA/JEFE_AREA should access Salmonella in read-only mode.
- **Backward compatibility**: The `sal_*` tables are already populated via the backend API. Frontend must not break existing data.

---

## 7. Ready for Proposal

**Yes**. All investigation points are covered:
- Bug location confirmed (LAB-48)
- Backend structure fully mapped
- Frontend stub gap documented
- Calculator patterns understood
- Affected files enumerated
