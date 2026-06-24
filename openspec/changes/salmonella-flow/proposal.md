# Proposal: Salmonella Flow

## Intent

Cerrar el flujo Salmonella del ERS v3.0. El backend `sal_*` está completo, pero el frontend `form-salmonella` es un stub sin API, y un bug de ruteo envía al usuario a la página equivocada. También integramos la calculadora UFC/g a Enterobacterias.

## Scope

### In Scope
- **LAB-48**: Fix de ruteo en `muestraAli.repository.js:93`.
- **LAB-62**: Auto-asignación de `caldoAsignadoAuto` por `tipoMatriz` + validación de hidratación.
- **LAB-63**: Cálculo de `minutosHomoAEstufa` y flag `alertaTiempo25min`.
- **LAB-64**: Frontend rebuild — API service + interfaces + `form-salmonella.page.ts` para 10 sub-fases.
- **Extra**: Clonar `ufcSau.calculator.js` → `ufcEnt.calculator.js`, test, integrar con adapter en `enterobacterias.service.js`.

### Out of Scope
Schema Prisma, `presenciaSal.calculator.js`, refactor UI de Enterobacterias.

## Capabilities

> `openspec/specs/`: sólo existe `enterobacterias-flow`.

### New Capabilities
- `salmonella-frontend`: API service, interfaces, 10 sub-fases.
- `salmonella-phase-rules`: reglas Fase 1 (matrices/hidratación) y Fase 2a (alerta 25 min).
- `enterobacterias-ufc-calc`: calculadora UFC/g wired vía adapter.

### Modified Capabilities
- `enterobacterias-flow`: cálculo UFC/g en etapa 2/3.

## Approach

LAB-48 primero (fix aislado). LAB-62/63 agregan `_asignarCaldoPorMatriz()` y `_calcularAlerta25min()`. LAB-64 sigue el patrón enterobacterias: API service con `obtener()`/`guardarFase()`, optimistic concurrency con `updatedAt`, wizard local de 10 sub-pasos. UFC Ent es clon 1:1 de Sau; el adapter convierte `dilucion`/`coloniasContadas` simples al array `diluciones: [{ dil, colonias: [c1, c2] }]`.

## Affected Areas

| Area | Impact |
|------|--------|
| `AssisTec API/src/repositories/muestraAli.repository.js` | Modified (LAB-48) |
| `AssisTec API/src/services/salmonella.service.js` | Modified (LAB-62/63) |
| `AssisTec API/src/calculators/ufcEnt.calculator.js` | New (UFC Ent) |
| `AssisTec API/src/services/enterobacterias.service.js` | Modified (UFC wiring) |
| `AssisTec API/__tests__/unit/ufcEnt.calculator.test.js` | New (tests) |
| `Frontend/src/app/pages/form-salmonella/` | Rewritten (LAB-64) |

## Risks

| Risk | Like | Mitigation |
|------|------|------------|
| PR > 400 líneas (frontend ~400 LOC) | High | `size:exception` confirmado para single PR |
| Adapter UFC rompe cálculo manual Ent | Low | Tests + feature flag en service |
| Mismatch 10 sub-fases ↔ UI 5 etapas | Med | Wizard local, patrón Enterobacterias |
| Auth guard Salmonella sólo roles [0,4] | Low | Documentar restricción |

## Rollback Plan

Revertir PR. Backend aditivo. Si UFC Ent causa regresión: quitar import/llamada en `enterobacterias.service.js`. Frontend stub restaurable desde git.

## Dependencies

Backend `sal_*` desplegado. Patrones `enterobacterias-api.service.ts` y `presenciaSal.calculator.js` como referencia; `ufcSau.calculator.js` como clon base.

## Success Criteria

- [ ] Navegación Salmonella Muestra ALI → `/form-salmonella`.
- [ ] `tipoMatriz = Chocolate` → `caldoAsignadoAuto = "Leche descremada"`.
- [ ] Delta tiempo > 25 min → `alertaTiempo25min = true` con alerta visual.
- [ ] Frontend persiste 10 sub-fases con optimistic locking.
- [ ] UFC/g en Enterobacterias retorna `ufcPorG` consistente con cálculo manual.
- [ ] Tests verdes: `ufcEnt.calculator.test.js` + suite salmonella.
- [ ] Lint frontend sin warnings nuevos.
