# Tasks: Cálculo NMP de Coliformes e Integración con Tablas Maestras

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350-450 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (4 files: 2 new, 2 modified) |
| Delivery strategy | single-pr-default |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Interfaces + API service + page modifications + HTML updates | PR 1 | Single PR; ~4 files; tests included |

## Phase 1: Foundation — Types & Interfaces

- [x] 1.1 Crear `Frontend/src/app/interfaces/coliformes.interfaces.ts` con interfaces: `ColiFormulario`, `ColiMuestra`, `ColiFase1`..`ColiFase4`, `ColiFase35Controles`, `ColiFase3Submuestra`, `ColiFase4Resultado`, y payloads `SaveFase1Payload`..`SaveFase4Payload`.
- [x] 1.2 Crear `Frontend/src/app/services/coliformes-api.service.spec.ts` con tests unitarios para `mapPresencia()` (3-state→Boolean: `sin_registrar→null`, `positivo→true`, `negativo→false`).

## Phase 2: Core — API Service

- [ ] 2.1 Crear `Frontend/src/app/services/coliformes-api.service.ts` usando `inject(HttpClient)`. Implementar `getFormulario(id)`, `saveFase1..4(id, payload)`, `saveFase35(id, payload)`.
- [ ] 2.2 Implementar `mapPresencia(valor: string): boolean | null` y `mapSubmuestrasToPayload(tabla: BloqueTabla, tiempo: number): ColiFase3Submuestra[]` en el servicio.
- [ ] 2.3 Agregar manejo de errores con `catchError` + `delay(2000)` + `retry(1)` en métodos save (spec CFI-02).
- [ ] 2.4 Completar tests de `coliformes-api.service.spec.ts`: verificar URLs correctas, payloads mapeados, y retry en error de red.

## Phase 3: Integration — Page Component & Template

- [ ] 3.1 Modificar `form-coliformes.page.ts`: migrar de constructor a `inject()` para `FormBuilder`, `Router`, `AlertController`, `ToastController`, `ActivatedRoute`. Inyectar `CatalogosService` y `ColiformesApiService`.
- [ ] 3.2 Reemplazar `MOCK_SOLICITUD` y `crearEntradas()` por carga real: `forkJoin({ catalogos, formulario })` en `ngOnInit` — cargar `getEquiposIncubacion()`, `getMicroPipetas()`, `getResponsables()`, y `getFormulario(id)` (specs CFI-01, CDS-01).
- [ ] 3.3 Agregar propiedades de catálogo: `listaEquiposIncubacion`, `listaPipetas`, `listaResponsables`, `muestras` (desde backend).
- [ ] 3.4 Implementar `avanzarEtapa()` con guardado real: llamar `saveFase{N}()` según etapa, manejar 409 (concurrencia) y errores de red (spec CFI-02).
- [ ] 3.5 Agregar auto-save: `Subject<void>` + `debounceTime(30000)` + `switchMap` → `saveFase{N}(id, {completada: false})`. Track `hasChanges` para no-op sin cambios (spec DSI-01).
- [ ] 3.6 Agregar `lastSaveTime: Date | null` y `lastSaveText: string` con contador incremental cada 1s (spec DSI-02).
- [ ] 3.7 Reemplazar `calcularNMP()` mock por `saveFase4(id)` real; poblar `resultadosFinales` desde `response.fase4Resultado` (specs CFI-04, CFI-05).
- [ ] 3.8 Reemplazar `enviarFormulario()` mock por flujo real multi-fase; agregar `guardarBorrador()` con `PUT` + `completada: false` + toast (spec DSI-03).
- [ ] 3.9 Modificar `form-coliformes.page.html`: reemplazar radios de estufa por `<ion-select multiple>` con `listaEquiposIncubacion`.
- [ ] 3.10 Reemplazar radios de micropipetas por `<ion-select>` con `listaPipetas` (mostrar `nombrePipeta` + `capacidad`).
- [ ] 3.11 Reemplazar inputs de analista por `<ion-select>` con `listaResponsables` (mostrar `nombreApellido`).
- [ ] 3.12 Agregar indicador "Guardado hace X segundos" en toolbar y botón "Guardar Borrador" en nav-footer.
- [ ] 3.13 Actualizar etapa 5: botón "Calcular" (deshabilitado si tablas incompletas) + tabla de resultados desde `fase4Resultado` con unidad "NMP/100ml".

## Phase 4: Testing & Verification

- [ ] 4.1 Actualizar `form-coliformes.page.spec.ts`: configurar providers para `CatalogosService`, `ColiformesApiService`, `ActivatedRoute` con mock `idFormulario`.
- [ ] 4.2 Test: `ngOnInit` carga catálogos vía forkJoin y formulario desde backend (spec CFI-01).
- [ ] 4.3 Test: 409 muestra alerta de concurrencia y NO avanza etapa (spec CFI-02).
- [ ] 4.4 Test: auto-save dispara PUT tras 30s con `fakeAsync` + `tick(30000)` (spec DSI-01).
- [ ] 4.5 Test: `guardarBorrador()` envía PUT con `completada: false` (spec DSI-03).
- [ ] 4.6 Verificar que no hay `console.log`, `any` types, ni constructor injection en archivos modificados.
