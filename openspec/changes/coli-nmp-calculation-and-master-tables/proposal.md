# Propuesta: Cálculo NMP de Coliformes e Integración con Tablas Maestras

## Intención

La página `form-coliformes` es un mock completo: valores NMP hardcodeados, radio buttons literales para equipos, y cero llamadas al backend. El backend (calculadora NMP, servicio coliformes, modelo Prisma, endpoints de catálogo) está completamente funcional. Este cambio conecta el frontend al backend existente, reemplazando todos los mocks con integración real a la API y selects basados en catálogos.

## Alcance

### Incluido
- Crear `coliformes-api.service.ts` — cliente HTTP para endpoints coliformes (GET/PUT fases 1-4)
- Reemplazar estufas/micropipetas/analistas hardcodeados por `<ion-select>` conectados a `CatalogosService`
- Reemplazar `calcularNMP()` mock por llamada `PUT /coliformes/:id/fase/4` que devuelve valores NMP reales (tabla McCrady)
- Reemplazar `enviarFormulario()` mock por flujo de guardado multi-fase (fases 1→2→3→3.5→4)
- Mapear toggles de 3 estados del frontend (sin_registrar/positivo/negativo) a Boolean `presencia` del backend
- Mostrar resultados NMP (CT, CF, E. coli) desde `ColiFase4Resultado` en la etapa de resultados
- **Indicador de auto-guardado**: texto "Guardado hace X segundos" visible en la UI tras cada guardado de fase
- **Botón "Guardar Borrador"**: permite al analista pausar el trabajo y retomar después sin perder datos

### Fuera de Alcance
- Hojas de confirmación bioquímica (Conf CT/CF, Conf E.coli)
- Fórmula Wilrich ISO 7218 avanzada (la tabla McCrady es suficiente para MPN 3 tubos)
- Cambios en backend — servicio, calculadora, rutas y modelo Prisma ya están completos
- Formularios de Enterobacterias, Salmonella, S. aureus

## Capacidades

### Nuevas Capacidades
- `coli-form-integration`: Integración formulario Coliformes ↔ API backend — flujo de guardado multi-fase, disparo de cálculo NMP, visualización de resultados, y carga de datos desde `ColiFormulario`/`ColiMuestra`
- `catalog-driven-selects`: Patrón de carga de catálogos desde tablas maestras para controles de formulario — `EquipoIncubacion`, `Micropipeta`, `Usuario` (analistas) vía `CatalogosService` con binding a `<ion-select>`
- `draft-save-with-indicator`: Auto-guardado de borrador con indicador visual de tiempo transcurrido y botón explícito para guardar y retomar

### Capacidades Modificadas
Ninguna — no existen especificaciones previas en el proyecto.

## Enfoque

**Integración solo frontend** (Enfoque 1 de la exploración). Cero cambios en backend.

1. Nuevo `coliformes-api.service.ts` envuelve los endpoints REST existentes
2. Inyectar `CatalogosService` + nuevo servicio coliformes en `FormColiformesPage`
3. Cargar catálogos vía `forkJoin` en `ngOnInit` (patrón de `reporte-ram.page.ts`)
4. Reemplazar arrays hardcodeados por componentes `<ion-select>` basados en catálogos
5. Conectar etapas del wizard a guardado de fases; etapa 5 "Calcular" dispara PUT de fase 4
6. Mostrar valores NMP devueltos en tabla de resultados
7. Agregar indicador "Guardado hace Xs" que se actualiza tras cada respuesta exitosa del backend
8. Agregar botón "Guardar Borrador" que persiste el estado actual sin avanzar de etapa

## Áreas Afectadas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `Frontend/src/app/services/coliformes-api.service.ts` | Nuevo | Cliente HTTP para endpoints coliformes |
| `Frontend/src/app/pages/form-coliformes/form-coliformes.page.ts` | Modificado | Reemplazar mocks por llamadas a servicios, carga de catálogos, auto-guardado |
| `Frontend/src/app/pages/form-coliformes/form-coliformes.page.html` | Modificado | Selects basados en catálogos, indicador de guardado, botón borrador, display de resultados |
| `Frontend/src/app/interfaces/coliformes.interfaces.ts` | Nuevo | Interfaces TypeScript para API coliformes |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Desajuste de modelo de form controls (string vs array para estufas) | Alta | Reestructurar form controls para coincidir con esquema del backend durante la integración |
| Desajuste de nombres de campos en fase 3.5 (frontend vs backend) | Media | Mapear nombres de campos explícitamente en capa de servicio |
| Desajuste de cantidad de muestras (6+1 local vs registros ColiMuestra) | Media | Cargar muestras desde ColiMuestra del backend al iniciar el formulario |
| Auto-guardado podría disparar requests innecesarios | Baja | Implementar con debounce (ej: guardar si pasaron >30s desde último cambio) |

## Plan de Rollback

Revertir solo cambios del frontend — el backend no fue modificado. El formulario mock puede restaurarse revirtiendo los 4 archivos afectados/nuevos.

## Dependencias

- `CatalogosService` existente (ya implementado y usado por otras páginas)
- Endpoints coliformes del backend existentes (ya desplegados)

## Criterios de Éxito

- [ ] Estufas, micropipetas y analistas se cargan desde tablas maestras (sin valores hardcodeados)
- [ ] El cálculo NMP devuelve valores McCrady reales desde el backend para CT, CF y E. coli
- [ ] El guardado multi-fase persiste todas las etapas del wizard en el backend
- [ ] El formulario carga datos de muestra desde registros `ColiMuestra`, no desde mocks locales
- [ ] El indicador de auto-guardado muestra "Guardado hace X segundos" tras cada persistencia exitosa
- [ ] El botón "Guardar Borrador" permite pausar y retomar sin perder datos
