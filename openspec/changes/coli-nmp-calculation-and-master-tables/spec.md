# Especificación: Cálculo NMP de Coliformes e Integración con Tablas Maestras

## Resumen

Conecta el frontend `form-coliformes` con el backend existente: reemplaza mocks por llamadas HTTP reales (`coliformes-api.service`), carga catálogos desde tablas maestras, dispara el cálculo NMP McCrady al completar las lecturas 24h y 48h, e incorpora auto-guardado con indicador visual y botón de borrador. Cubre las HU-04-01 a HU-04-04 de la Épica 4 del ERS v3.0 sobre ISO 7218 (NMP).

## Capacidades

| ID | Capacidad | Tipo |
|----|-----------|------|
| CFI | `coli-form-integration` | Nueva |
| CDS | `catalog-driven-selects` | Nueva |
| DSI | `draft-save-with-indicator` | Nueva |

---

## Capacidad: `coli-form-integration`

### Requisito: CFI-01 — Carga inicial desde `ColiFormulario`

El sistema SHALL poblar el wizard con los datos del `ColiFormulario` y sus `ColiMuestra` al inicializar la página, reemplazando el mock `MOCK_SOLICITUD`.

#### Escenario: Carga inicial con muestras existentes
- GIVEN el analista abre `form-coliformes` con `idFormulario` válido
- WHEN se ejecuta `ngOnInit`
- THEN el sistema SHALL invocar `GET /coliformes/:id`
- AND SHALL poblar `muestras` con los registros `ColiMuestra` (no con entradas locales)

#### Escenario: Formulario inexistente
- GIVEN el `idFormulario` no existe
- WHEN el backend responde 404
- THEN el sistema SHALL mostrar error y SHALL NOT inicializar el wizard

### Requisito: CFI-02 — Guardado multi-fase secuencial

El sistema SHALL persistir el avance mediante `PUT /coliformes/:id/fase/:n` para fases 1, 2, 3, 3.5 y 4, respetando progresión secuencial y `updated_at` para optimistic locking.

#### Escenario: Avance de fase con éxito
- GIVEN el analista completó la fase N y todas las N-1 están `completada: true`
- WHEN presiona "Siguiente" o envía la fase
- THEN el sistema SHALL enviar `PUT` con `completada: true`
- AND SHALL habilitar la fase N+1 únicamente tras 2xx del backend

#### Escenario: Conflicto de concurrencia (409)
- GIVEN otro analista modificó el formulario entre el GET y el PUT
- WHEN el backend responde 409 `CONCURRENCY_ERROR`
- THEN el sistema SHALL mostrar "El formulario fue modificado por otro usuario. Recargue y vuelva a intentar."
- AND SHALL NOT avanzar de etapa ni sobrescribir datos locales

#### Escenario: Error de red
- GIVEN el endpoint no responde (timeout, 5xx, sin conexión)
- WHEN falla la petición
- THEN el sistema SHALL mostrar mensaje de error, SHALL reintentar una vez tras 2s
- AND SHALL preservar los datos no persistidos en memoria

### Requisito: CFI-03 — Lectura de tubos 24h y 48h con tabs separados

El sistema SHALL mantener tablas separadas para las lecturas de 24h y 48h, cada una con toggle de 3 estados (`sin_registrar | positivo | negativo`) por muestra, dilución y tubo, mapeando a `presencia: Boolean` en `ColiFase3Submuestra`.

#### Escenario: Marcado de tubo positivo en 24h
- GIVEN la tabla 24h está activa
- WHEN el analista marca un tubo como `positivo` para una muestra y dilución dadas
- THEN el sistema SHALL persistir `presencia: true` con `tipoLectura` (totales | fecales | ecoli) y `tiempoLectura: 24`

#### Escenario: Marcado de tubo negativo en 48h
- GIVEN la tabla 48h está activa
- WHEN el analista marca un tubo como `negativo`
- THEN el sistema SHALL persistir `presencia: false` con `tiempoLectura: 48`

#### Escenario: Transición de 24h a 48h
- GIVEN todas las lecturas 24h están marcadas
- WHEN el analista activa la pestaña 48h
- THEN SHALL mostrar los datos de 48h independientes de los de 24h
- AND SHALL permitir modificar 24h sin afectar 48h (y viceversa)

### Requisito: CFI-04 — Cálculo NMP al completar ambas tablas

El sistema SHALL habilitar el botón "Calcular" sólo cuando ambas tablas (24h y 48h) estén completas para todas las muestras y tubos, y SHALL disparar el cálculo mediante `PUT /coliformes/:id/fase/4`.

#### Escenario: Cálculo exitoso
- GIVEN todas las lecturas 24h y 48h están marcadas
- WHEN el analista presiona "Calcular"
- THEN SHALL enviar `PUT /coliformes/:id/fase/4` con todas las submuestras
- AND SHALL recibir `ColiFase4Resultado` con `coliformesTotales`, `coliformesFecales`, `eColi` (NMP/100ml, tabla McCrady)

#### Escenario: Tablas incompletas
- GIVEN falta al menos una lectura
- WHEN se renderiza la etapa de resultados
- THEN el botón "Calcular" SHALL estar deshabilitado
- AND SHALL mostrarse el conteo de tubos pendientes

### Requisito: CFI-05 — Visualización de resultados NMP

El sistema SHALL mostrar los valores NMP de CT, CF y E. coli devueltos por el backend en la etapa "Resultados", con su unidad (NMP/100ml).

#### Escenario: Resultados disponibles
- GIVEN el backend devolvió `ColiFase4Resultado` no nulo
- WHEN el sistema carga la etapa 5
- THEN SHALL poblar la tabla de resultados con los 3 valores
- AND SHALL permitir navegar a "Inicio" sin re-enviar datos

---

## Capacidad: `catalog-driven-selects`

### Requisito: CDS-01 — Carga paralela de catálogos al iniciar

El sistema SHALL cargar `EquipoIncubacion`, `Micropipeta` y `Usuario` (analistas) en paralelo al inicializar, vía `forkJoin` con `CatalogosService` (patrón `reporte-ram.page.ts`).

#### Escenario: Carga exitosa de los 3 catálogos
- GIVEN el analista abre el formulario
- WHEN se ejecuta `ngOnInit`
- THEN SHALL invocar en paralelo `getEquiposIncubacion()`, `getMicroPipetas()`, `getResponsables()`
- AND SHALL poblar `listaEquiposIncubacion`, `listaPipetas`, `listaResponsables` con la respuesta

#### Escenario: Fallo parcial de un catálogo
- GIVEN uno de los 3 endpoints falla
- WHEN se completa `forkJoin`
- THEN SHALL continuar con los catálogos exitosos
- AND SHALL mostrar advertencia específica del catálogo fallido

### Requisito: CDS-02 — Binding a `<ion-select>` con IDs del backend

El sistema SHALL reemplazar radios hardcodeados (estufas) e inputs de texto (analistas, micropipetas) por `<ion-select>` cuyas opciones provengan de los catálogos, persistiendo el ID (`idIncubacion`, `idPipeta`, `rutUsuario`) al guardar la fase.

#### Escenario: Selección de estufa de incubación
- GIVEN `listaEquiposIncubacion` está poblada
- WHEN el analista selecciona una opción
- THEN SHALL almacenar `idIncubacion` en el form control
- AND SHALL mostrar `nombreEquipo` como etiqueta visible

#### Escenario: Selección de analista
- GIVEN `listaResponsables` está poblada (filtrada por rol analista)
- WHEN el analista selecciona uno
- THEN SHALL almacenar `rutUsuario` y mostrar `nombreApellidoUsuario`

#### Escenario: Reutilización del patrón
- GIVEN el sistema implementa `catalog-driven-selects` para coliformes
- WHEN otras páginas (S. aureus, Salmonella, Enterobacterias) necesiten el mismo patrón
- THEN SHALL poder reutilizar el mismo servicio y mecanismo de binding

---

## Capacidad: `draft-save-with-indicator`

### Requisito: DSI-01 — Auto-guardado con debounce

El sistema SHALL auto-guardar el estado del formulario como borrador (`completada: false`) cuando hayan transcurrido 30 segundos desde el último cambio, sin requerir acción explícita.

#### Escenario: Auto-guardado tras inactividad
- GIVEN el analista modificó uno o más controles
- WHEN transcurren 30s sin nuevos cambios
- THEN SHALL invocar `PUT` de la fase actual con `completada: false`
- AND SHALL actualizar el indicador visual tras 2xx

#### Escenario: Cambio durante el debounce
- GIVEN el debounce de 30s está armado
- WHEN el analista modifica otro control antes de cumplirse
- THEN SHALL rearmar el debounce (cancelar y reiniciar el contador)

#### Escenario: Sin cambios pendientes
- GIVEN no hubo modificaciones desde el último guardado
- WHEN se cumple el debounce
- THEN SHALL NOT invocar el endpoint (no-op)

### Requisito: DSI-02 — Indicador "Guardado hace X segundos"

El sistema SHALL mostrar el texto "Guardado hace X segundos" en la UI tras cada persistencia exitosa, actualizándose dinámicamente cada segundo sin nuevas llamadas al backend.

#### Escenario: Indicador tras guardado exitoso
- GIVEN el backend confirmó un PUT (2xx)
- WHEN se recibe la respuesta
- THEN SHALL mostrar "Guardado hace 0 segundos"
- AND SHALL incrementar el contador cada 1s localmente

#### Escenario: Indicador tras error de guardado
- GIVEN el backend devolvió error (4xx, 5xx, timeout)
- WHEN falla la persistencia
- THEN SHALL mostrar "Guardado fallido — intente nuevamente"
- AND SHALL NOT avanzar el contador

### Requisito: DSI-03 — Botón "Guardar Borrador"

El sistema SHALL exponer un botón "Guardar Borrador" que persiste el estado actual como borrador sin avanzar la etapa del wizard.

#### Escenario: Pausar trabajo
- GIVEN el analista está en cualquier fase
- WHEN presiona "Guardar Borrador"
- THEN SHALL enviar `PUT` con `completada: false`
- AND SHALL permanecer en la misma fase
- AND SHALL mostrar toast "Borrador guardado"

#### Escenario: Retomar borrador existente
- GIVEN existe un borrador previo para el `idFormulario`
- WHEN el analista vuelve a abrir el formulario
- THEN SHALL cargar el estado desde el backend
- AND SHALL mostrar los datos tal como estaban al pausar
