# Design: Salmonella Flow

## Technical Approach

Four independent work units layered bottom-up. LAB-48 fixes a routing constant first (safest). LAB-62/63 add three private methods to `SalService.guardarFase` — auto-assignment/validation hooks called before Prisma persistence, following the existing `_assertStageProgression` pattern. LAB-64 rebuilds the frontend by cloning the Enterobacterias page pattern, adapting from 8 sub-pasos (3 etapas) to 10 sub-pasos (10 fases backend). UFC Ent is a 1:1 calculator clone wired through an adapter in `EnterobacteriasService`.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| Private methods for phase rules | (A) Inline in `guardarFase` switch, (B) Private methods `_asignarCaldoPorMatriz` / `_validarHidratacion` / `_calcularAlerta25min` | (A) shorter but untestable; (B) follows existing `_assertStageProgression` pattern, testable in isolation | **B** — consistent with codebase conventions |
| Frontend wizard pattern | (A) Component-per-subfase like Enterobacterias, (B) Single page with wizard state | (A) matches existing pattern, colocated templates; (B) simpler for 10 sub-pasos but deviates from project conventions | **B** — 10 components would balloon the PR; single-page wizard with `pasoActual` signal and `*ngSwitch` per paso |
| UFC Ent calculator | (A) Clone `ufcSau.calculator.js`, (B) Make a generic `ufc.calculator.js` with parameter | (A) safe, 0 refactor risk; (B) introduces regression risk on SAU | **A** — clone with `nEnterobacterias` rename |
| Adapter: single value → array | (A) `_adaptarParaUfcEnt` in service, (B) Change Prisma schema to arrays | (B) out of scope per proposal | **A** — `dilucion` → `Math.log10(dilucion)`, `coloniasContadas` → `[c, c]` duplicated as both plates |

## Data Flow

```
┌──────────────────────────────────────────────────┐
│  Frontend (wizard 10 sub-pasos)                  │
│  ┌─────┐  ┌──────┐  ┌──────┐      ┌──────────┐  │
│  │Paso1│─→│Paso2 │─→│Paso3 │ ... →│ Paso10   │  │
│  │local│  │PUT /2│  │PUT /3│      │PUT/10    │  │
│  └─────┘  └──┬───┘  └──┬───┘      └────┬─────┘  │
│              │PUT /fase/2              │         │
└──────────────┼────────────────────────┼─────────┘
               │  { fase2a,             │
               │    updated_at }        │
               ▼                        ▼
┌──────────────────────────────────────────────────┐
│  SalmonellaService.guardarFase(id, fase, body)   │
│  ┌─ _assertStageProgression                     │
│  │  fase=1: _asignarCaldoPorMatriz(tipoMatriz)  │
│  │          _validarHidratacion(hInicio,hTermino)│
│  │  fase=2: _calcularAlerta25min(hTermino,hEstufa)│
│  └─ mapFase*Payload → salRepository.upsert*     │
└──────────────────────────────────────────────────┘

Enterobacterias UFC flow:
  PUT /ent/:id/etapa/2 { dilucion, coloniasContadas }
       → _adaptarParaUfcEnt → calcularUfcEnt()
       → persistir ufcPorG + include in GET responses
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `AssisTec API/src/repositories/muestraAli.repository.js` | Modify | L93: `SALMONELLA: '/form-enterobacterias'` → `'/form-salmonella'` |
| `AssisTec API/src/services/salmonella.service.js` | Modify | Add `_asignarCaldoPorMatriz`, `_validarHidratacion`, `_calcularAlerta25min`; call from `guardarFase` cases 1-2 |
| `AssisTec API/src/calculators/ufcEnt.calculator.js` | Create | Clone of `ufcSau.calculator.js`; rename `calcularUfcSau`→`calcularUfcEnt`, `nSAureus`→`nEnterobacterias` |
| `AssisTec API/src/services/enterobacterias.service.js` | Modify | Add `_adaptarParaUfcEnt` adapter; wire `calcularUfcEnt` into `guardarEtapa` case 2; expose `ufcPorG` in `serializeFormulario`; feature flag `ENT_UFC_CALC_ENABLED` |
| `AssisTec API/__tests__/unit/ufcEnt.calculator.test.js` | Create | Clone test from `ufcSau.calculator.test.js` with 8 cases per spec UEC-02 |
| `Frontend/src/app/services/salmonella-api.service.ts` | Create | Follow `enterobacterias-api.service.ts` pattern; endpoints `/formulario/sal` |
| `Frontend/src/app/interfaces/salmonella.interfaces.ts` | Create | 10 `SalFase*Payload` interfaces + `SalFormularioCompleto`, `SalMuestra`, `SalLecturaFase3c`, `SalLecturaFase4b` |
| `Frontend/src/app/pages/form-salmonella/form-salmonella.page.ts` | Rewrite | Single-page wizard: `pasoActual` signal, 10 `*ngSwitch` cases, API integration via `SalmonellaApiService`, optimistic locking |
| `Frontend/src/app/pages/form-salmonella/form-salmonella.page.html` | Rewrite | 10-step card wizard with `ion-card` per paso, `alertaTiempo25min` banner, "Guardar Borrador" button |
| `Frontend/src/app/pages/form-salmonella/form-salmonella.page.scss` | Modify | Wizard styles, alert banner, progress bar |
| `Frontend/src/app/pages/form-salmonella/form-salmonella.page.spec.ts` | Modify | 10-paso wizard tests |

## Interfaces / Contracts

```typescript
// SalmonellaApiService (new)
interface SalmonellaApiService {
  obtenerPorAnalisis(idAnalisis: number): Observable<{ existe: boolean; formulario: SalFormularioCompleto | null }>;
  obtener(idFormulario: number): Observable<SalFormularioCompleto>;
  guardarFase(id: number, fase: number, payload: SalFasePayload, updatedAt: string): Observable<SalFormularioCompleto>;
}
```

```javascript
// SalmonellaService private methods (new)
_asignarCaldoPorMatriz(tipoMatriz) → 'Leche descremada' | 'Caldo APT'
_validarHidratacion(horaInicio, horaTermino) → { hidratacionValida: boolean }
_calcularAlerta25min(horaTerminoHomo, horaIngresoEstufa) → { minutosHomoAEstufa, alertaTiempo25min }
_adaptarParaUfcEnt(etapa2) → { volumen: 1, diluciones: [{ dil, colonias: [c1, c2] }] }
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (backend) | `_asignarCaldoPorMatriz`, `_validarHidratacion`, `_calcularAlerta25min` | Jest: Chocolate→Leche descremada, delta<5→false, delta>25→true |
| Unit (backend) | `calcularUfcEnt` 8 cases | Jest: clone `ufcSau.calculator.test.js` structure |
| Integration (backend) | `guardarFase` cases 1-2 with matrix/hydration/alert | Supertest: `PUT /sal/:id/fase/1` with `tipoMatriz: 'Chocolate'` |
| Unit (frontend) | `SalmonellaApiService` methods | Jasmine: mock `HttpClient`, verify URL patterns |
| Unit (frontend) | Wizard navigation state | Jasmine: `pasoActual` signal transitions, `guardarFase` called on paso boundaries |

## Migration / Rollout

No migration required for Salmonella (backend additive). UFC Ent `ufcPorG` column: per spec option A recommendation, coordinate DB migration separately. Feature flag `ENT_UFC_CALC_ENABLED=false` for instant rollback.

## Open Questions

- [ ] `ent_etapa3.ufcPorG` column migration: who owns the Prisma schema change? (Out of scope per proposal)
- [ ] Should `caldoAsignadoAuto` override be server-authoritative (current) or client-suggested with server fallback?
