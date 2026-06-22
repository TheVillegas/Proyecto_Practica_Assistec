# Design: Cálculo NMP de Coliformes e Integración con Tablas Maestras

## Technical Approach

Integración solo frontend: se crea `ColiformesApiService` (cliente HTTP para endpoints coliformes usando `inject()`/`HttpClient`), se cargan catálogos vía `forkJoin` en `ngOnInit` (patrón `reporte-ram.page.ts`), se reemplazan radios hardcodeados por `<ion-select>` basados en catálogos, se conecta el avance del wizard a `PUT /coliformes/:id/fase/:n`, y se implementa auto-guardado con debounce de 30s + indicador "Guardado hace X segundos". Cero cambios en backend.

## Architecture Decisions

| Decisión | Opciones | Tradeoffs | Decisión |
|----------|---------|-----------|----------|
| **DI pattern** | `inject()` vs constructor injection | `inject()` es el estándar Angular moderno; el proyecto ya lo usa en `reporte-ram` y `CatalogosService` | `inject()` — consistencia con el ecosistema existente |
| **Standalone component** | standalone vs NgModule | El proyecto usa `standalone: false` en todas las páginas existentes; migrar una sola página introduciría inconsistencia | Mantener `standalone: false` — alinear con el módulo `FormColiformesModule` existente |
| **Estufas: single vs array** | Un solo `<ion-select>` value vs múltiple | Backend espera `estufas[]` (`ColiFase2Estufa[]` con `{idIncubacion}`). El formulario actual usa un radio button único | `<ion-select multiple="true">` → array de `{idIncubacion}`. Mapeo en el servicio al guardar |
| **Auto-save mechanism** | `Subject` + `debounceTime` vs `setInterval` polling | `debounceTime` se rearma con cada cambio (spec DSI-01); `setInterval` generaría requests innecesarios | `Subject<void>` + `debounceTime(30000)` + `switchMap` — cancela y rearma automáticamente |
| **3-state to Boolean** | Mapeo en template vs mapeo en servicio | La spec requiere `sin_registrar` → `null`, `positivo` → `true`, `negativo` → `false`. Centralizar en el servicio evita duplicación | Mapeo en `ColiformesApiService.mapPresencia()` — reutilizable en fase 3 y fase 3.5 |
| **NMP calculation trigger** | `PUT fase/4` (backend calcula) vs cálculo local | Backend cuenta `ColiFase3Submuestra.presencia` desde la DB y aplica McCrady. Cálculo local divergiría | `PUT fase/4` — backend ya tiene `_calcularResultadosFase4()` completo |
| **Error retry** | `retry(1)` RxJS vs manual `catchError` | `retry(1)` reintenta inmediatamente; la spec pide 2s de espera | `catchError` manual + `delay(2000)` + `retry(1)` — cumple spec CFI-02 |

## Data Flow

```
ngOnInit()
  │
  ├─ forkJoin({ catalogos, formulario })
  │     ├─ CatalogosService.getEquiposIncubacion()  ──→ listaEquiposIncubacion[]
  │     ├─ CatalogosService.getMicroPipetas()        ──→ listaPipetas[]
  │     ├─ CatalogosService.getResponsables()         ──→ listaResponsables[]
  │     └─ ColiformesApiService.getFormulario(id)     ──→ formulario (ColiMuestra[])
  │
  ├─ Wizard Stage Advance (avanzarEtapa)
  │     └─ ColiformesApiService.saveFase{N}(id, payload) ──→ PUT /coliformes/:id/fase/:n
  │           ├─ 200: avanzar etapa, actualizar lastSaveTime
  │           ├─ 409: mostrar alerta concurrencia, NO avanzar
  │           └─ 5xx/timeout: retry 1× tras 2s, mostrar error si falla
  │
  ├─ Auto-save (Subject + debounceTime 30s)
  │     └─ ColiformesApiService.saveFase{N}(id, {completada: false}) ──→ PUT silencioso
  │           └─ actualizar indicador "Guardado hace 0 segundos"
  │
  └─ NMP Calculation (stage 5 "Calcular")
        └─ ColiformesApiService.saveFase4(id) ──→ PUT /coliformes/:id/fase/4
              └─ response.fase4Resultado[] ──→ poblar tabla CT/CF/E.coli
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `Frontend/src/app/services/coliformes-api.service.ts` | **Create** | Cliente HTTP: `getFormulario()`, `saveFase1..4()`, `saveFase35()`. Usa `inject(HttpClient)`. Mapea payloads frontend→backend (camelCase→snake_case aceptado por `resolvePayloadSection`). Método `mapPresencia()` para 3-state→Boolean. |
| `Frontend/src/app/interfaces/coliformes.interfaces.ts` | **Create** | Interfaces: `ColiFormulario`, `ColiMuestra`, `ColiFase1..4`, `ColiFase35Controles`, `ColiFase3Submuestra`, `ColiFase4Resultado`. Payloads tipados: `SaveFase1Payload`..`SaveFase4Payload`. |
| `Frontend/src/app/pages/form-coliformes/form-coliformes.page.ts` | **Modify** | Inyectar `CatalogosService` + `ColiformesApiService`. Reemplazar `MOCK_SOLICITUD` por carga real. Migrar radios→`<ion-select>`. Agregar `Subject<void>` para auto-save, `lastSaveTime`, `lastSaveText`. Reemplazar `calcularNMP()` mock por `saveFase4()`. Reemplazar `enviarFormulario()` mock por guardado multi-fase real. Agregar `guardarBorrador()`. Manejar errores 409 y de red. |
| `Frontend/src/app/pages/form-coliformes/form-coliformes.page.html` | **Modify** | Reemplazar radios estufa por `<ion-select multiple>`. Reemplazar radios micropipeta por `<ion-select>`. Reemplazar inputs de analista por `<ion-select>` con `listaResponsables`. Agregar indicador "Guardado hace Xs" en toolbar. Agregar botón "Guardar Borrador". Actualizar etapa 5: botón "Calcular" + tabla resultados desde `fase4Resultado`. |

## Interfaces / Contracts

```typescript
// coliformes.interfaces.ts (extracto de tipos clave)
interface ColiFormulario {
  idColiFormulario: number; faseActual: number; estado: string;
  updatedAt: string; muestras: ColiMuestra[];
  fase1?: ColiFase1; fase2?: ColiFase2; fase3?: ColiFase3;
  fase35Controles?: ColiFase35Controles; fase4Resultado?: ColiFase4Resultado[];
}
interface ColiMuestra {
  idColiMuestra: number; numeroMuestra: string;
  esDuplicado: boolean; pesoMuestraTipo: string; orden: number;
}
interface ColiFase3Submuestra {
  idColiMuestra: number; tipoLectura: 'totales'|'fecales'|'ecoli';
  dilucion: string; numeroTubo: number; presencia: boolean | null;
}
interface ColiFase4Resultado {
  idColiMuestra: number; coliformesTotales: number;
  coliformesFecales: number; eColi: number;
}
interface SaveFase2Payload {
  codigoCaldoLauril: string; codigoTween80?: string;
  estufas: {idIncubacion: number}[];
  micropipetas: {idPipeta: number; capacidad: string}[];
  completada: boolean;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `ColiformesApiService.mapPresencia()` | Test 3-state→Boolean mapping: `sin_registrar→null`, `positivo→true`, `negativo→false` |
| Unit | `mapSubmuestrasToPayload()` | Convierte `BloqueTabla[]` → `ColiFase3Submuestra[]` con `tipoLectura`, `dilucion`, `numeroTubo` |
| Integration | `forkJoin` catalog loading | Simular fallo parcial de un catálogo — verificar que los otros 2 continúan |
| Integration | Auto-save debounce | `fakeAsync` + `tick(30000)` — verificar que se dispara PUT solo si hay cambios |
| E2E | Flujo completo wizard | Navegar 5 etapas, guardar cada fase, calcular NMP, verificar resultados mostrados |

## Migration / Rollout

No migration required. Cambio solo frontend. Rollback: revertir los 4 archivos afectados — el formulario mock se restaura completamente.

## Open Questions (Resueltas)

- [x] **Creación del formulario**: `solicitud-ingreso` ya crea `ColiFormulario` automáticamente cuando la solicitud es validada por Jefa + Coordinadora. `formularioMicrobiologico.service.js` mapea los 3 códigos (`COLIFORMES_TOTALES`, `COLIFORMES_FECALES`, `ECOLI_NCH3056`) a `coli`. El frontend recibe `idFormulario` por ruta/parámetro y carga el formulario existente con `GET /coliformes/:id`.
- [x] **Filtro de analistas**: El backend filtra por rol. `CatalogosService.getResponsables()` llama a `GET /catalogo/usuarios?rol=ANALISTA`. El frontend nunca debe filtrar por rol — consume la lista ya filtrada del backend.
