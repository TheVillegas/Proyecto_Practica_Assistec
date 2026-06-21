# Matriz de Trazabilidad ERS v3.0 → Estado Real

**Proyecto**: ASISTEC — Digitalización de Formularios de Análisis del Laboratorio de Microbiología
**ERS**: v3.0 (26/03/2026)
**Fecha de corte**: 21 de junio de 2026
**Elaborado por**: VIMU DEVS (Matías Villegas)

---

## Dashboard Consolidado

| Épica | HUs | ✅ Completas | 🟡 Parciales | 🔲 Pendientes | % Real |
|-------|-----|-------------|-------------|--------------|--------|
| Épica 6 — S. Aureus | 6 | 6 | 0 | 0 | **100%** |
| Épica 4 — Coliformes | 4 | 4 | 0 | 0 | **90%** ⚠️ |
| Épica 1 — Solicitud de Ingreso | 9 | 2+ | 7 | 0 | **~70%** * |
| Épica 3 — Dashboards | 6 | 3+ | 3 | 0 | **~60%** * |
| Épica 5 — Enterobacterias | 14 | 0 | 7 | 7 | **~15%** |
| Épica 4.1–4.4 — Salmonella | 8 | 0 | 1 | 7 | **~10%** |
| Épica 2 — Notificaciones | 1 | 0 | 0 | 1 | **0%** |
| Épica 7 — Mohos y Levaduras | — | 0 | 0 | 1 | **0%** |

> ⚠️ Coliformes: código completo y verificado (SDD verify PASS), falta prueba en vivo.
> \* Épicas 1 y 3 requieren auditoría HU por HU para precisar porcentajes.

---

## Épica 6: S. Aureus (Staphylococcus aureus) — 100% ✅

| ID | Historia de Usuario | Estado | Evidencia |
|----|---------------------|--------|-----------|
| HU-06-01 | Etapa 1 — Registro inicial de incubación y siembra | ✅ Done | LAB-7 Done. Captura fecha/hora inicio, controles de calidad, importación datos RM. |
| HU-06-02 | Etapa 2 — Recuento y lecturas de S. Aureus | ✅ Done | LAB-8 Done. Bloqueo por tiempo de espera, controles de rutina obligatorios. |
| HU-06-03 | Etapa 3 — Confirmación con trazabilidad temporal | ✅ Done | LAB-8 Done. Cálculo automático diferencia traspaso-lectura, observaciones por muestra. |
| HU-06-04 | Etapa 4 — Prueba de Coagulasa | ✅ Done | LAB-9 Done. Tiempos de espera validados, selectores predefinidos (reacción, aspecto). |
| HU-06-05 | Cálculo automático de UFC/g | ✅ Done | LAB-9 Done. Fórmula NCh2676 8.2.2.1 implementada. Campo Resultado Final solo lectura. Detección de incongruencias. |
| HU-06-06 | Confirmación y cierre con verificación normativa | ✅ Done | Comparación automática contra límites Sernapesca. Checkbox revisión Controles de Calidad. Firma digital. |

**Backend**: `calculador-saureus.service.ts`, endpoints `POST /api/saureus/calcular-muestra`, `POST /api/saureus/calcular-todo`, `GET /api/saureus/importar-duplicado`
**Frontend**: Feature module con arquitectura atómica (containers, compounds, atoms). Componente `etapa5-calculo`.
**Linear**: 9 issues Done (Sprint 1 cerrado el 11-jun-2026).
**Build**: Docker ✅. Tests: 127 pasando.

---

## Épica 4: Coliformes Totales, Fecales y E. coli — 90% ⚠️

| ID | Historia de Usuario | Estado | Evidencia |
|----|---------------------|--------|-----------|
| HU-04-01 | Importación automática de datos del alimento | ✅ Implementado | `forkJoin` carga 3 catálogos en `ngOnInit`. Código ALI, fecha, hora y responsable de incubación automáticos. |
| HU-04-02 | Registro de datos de siembra | ✅ Implementado | Código medio homogeneización, checkbox estufas, lista micropipetas, código muestra según naturaleza. |
| HU-04-03 | Marcado positivo/negativo de submuestras | ✅ Implementado | Dos tablas (24h y 48h) con checkbox pos/neg por submuestra y serie. Fecha (DD/MM), hora y analista. Tolerancia ±2h. |
| HU-04-04 | Ingreso de datos finales y cálculo de resultados | ✅ Implementado | Campos numéricos por muestra. Sistema calcula NMP McCrady real via backend `saveFase4()`. |

**SDD**: Ciclo completo — proposal → spec → design → tasks (18) → apply → verify.
**Verify**: PASS WITH WARNINGS. 18/18 tasks, 21 tests ✅, build limpio.
**Commits**: 4 commits (`feat(coli): ...`) en branch `feature/enterobacterias-E.Coli-Coliformes-Totales`.
**Linear**: LAB-37 y LAB-20 Done (21-jun-2026).

### ⚠️ Warnings pendientes

| ID | Issue | Severidad |
|----|-------|-----------|
| CDS-01 | `forkJoin` falla por completo si un catálogo falla. No hay carga parcial con advertencia. | WARNING |
| DSI-02 | Sin indicador de "Guardado fallido" cuando auto-save recibe 4xx/5xx. | WARNING |
| CFI-01 | Sin prevención estricta de inicialización del wizard en caso de 404. | PARTIAL |

### 🔲 Falta

- Prueba en vivo (live testing) con datos reales.
- LAB-22: Preparar dataset mínimo de prueba (pendiente, due 26-jun).

---

## Épica 1: Gestión de Solicitud de Ingreso — ~70% *

| ID | Historia de Usuario | Estado Aprox. | Notas |
|----|---------------------|---------------|-------|
| HU-01-01 | Conservación de notas y código externo | 🟡 Verificar | Campos presentes en UI. |
| HU-01-02 | Selección de formularios y categoría | 🟡 Verificar | Catálogo `FALLBACK_FORMULARIOS` con todos los códigos. Categoría Sernapesca/Otro. |
| HU-01-03 | Generación automática de TPA y selección de adicionales | 🟡 Verificar | Lógica de generación automática en backend. |
| HU-01-04 | Indicador de muestra compartida con Química | 🟡 Verificar | Checkbox preparatorio en formulario. |
| HU-01-05 | Tabla maestra de Equipos de Almacenamiento | 🟡 Verificar | Tabla con valores iniciales (Refrigerador 2-I, Congelador 4-1, Mueble 1, Gabinete Microbiología). |
| HU-01-06 | Cálculo de tiempos de entrega | 🟡 Verificar | Cálculo automático desde tabla de configuración. |
| HU-01-07 | Tabla maestra de formularios de análisis | 🟡 Verificar | CRUD para administrador con campos: Id, Nombre, Categorías, Metodología, Acreditación INN. |
| HU-01-08 | Múltiples muestras y formularios por solicitud | ✅ Implementado | PR #7. Muestra ALI original consolida todos los formularios. |
| HU-01-09 | Registro automático de fecha/hora de envío a validación | ✅ Implementado | PR #6. Trazabilidad del flujo de trabajo visible en detalle de solicitud. |

**Evidencia parcial**: PR #6 (validation flow con per-submuestra analysis), PR #7 (auto-generar MuestraAli + endpoint + formularios navegables), Judgment Day fixes (N+1 batch prefetch, race condition).
**Nota**: \* Los porcentajes marcados con asterisco requieren auditoría HU por HU para confirmación exacta.

---

## Épica 3: Gestión de Dashboards — ~60% *

| ID | Historia de Usuario | Estado Aprox. | Notas |
|----|---------------------|---------------|-------|
| HU-03-01 | Dashboard de perfil Ingreso | 🟡 Verificar | Creación de nuevas solicitudes, asociación de muestras ALI y análisis. |
| HU-03-02 | Búsqueda de solicitudes | 🟡 Verificar | Filtro por nombre del cliente. |
| HU-03-03 | Dashboard de Jefe de Área | ✅ Implementado | PR #6. Lista solicitudes confirmadas, revisar detalle, botón Validar/Devolver con motivo obligatorio. |
| HU-03-04 | Exportación a Excel | 🟡 Verificar | Botón de exportación en dashboards de Jefe e Ingreso. |
| HU-03-05 | Dashboard de Coordinadora | ✅ Implementado | Muestra solicitudes validadas por Jefa. Registro de hora de recepción. |
| HU-03-06 | Conversión de solicitudes en muestras por dossier | ✅ Implementado | PR #7. Muestras y formularios organizados por dossier. Analistas visualizan sus análisis. |

**Nota**: \* Requiere auditoría para confirmar estado exacto de HUs con "Verificar".

---

## Épica 5: Enterobacterias — ~15% (solo frontend)

| ID | Historia de Usuario | Estado | Notas |
|----|---------------------|--------|-------|
| HU-05-01-01 | Formulario dividido por etapas secuenciales | 🟡 Frontend | Wizard 8 pasos (Preparación → Análisis → Confirmación). Etapas inactivas visualmente. Sin backend. |
| HU-05-01-02 | Campos obligatorios en todas las etapas | 🟡 Parcial | Validación frontend solamente. Sin persistencia. |
| HU-05-01-03 | Validación de formatos de fecha y hora | 🟡 Parcial | Formato DD-MM-AA y HH:MM en wizard. Sin validación backend. |
| HU-05-01-04 | Autocompletado de número de muestra | 🔲 No implementado | Mixta/Homogénea no conectados a backend. |
| HU-05-02-01 | Subetapas secuenciales de Preparación | 🟡 Frontend | Pesado → Homogeneización → Sembrado → Incubación en wizard. Bloqueo secuencial visual. |
| HU-05-02-02 | Selección de equipo de incubación | 🔲 No implementado | Estufa 73-M / 2-M no conectados a catálogo. |
| HU-05-02-03 | Registro de códigos de insumos | 🟡 Parcial | Validación formato Reactivo Oxidasa (R69-AA-NN) en frontend. Sin backend. |
| HU-05-02-04 | Selección de placas y micropipetas | 🔲 No implementado | Listas checkbox no conectadas a datos reales. |
| HU-05-03-01 | Habilitación automática de etapa Análisis | 🔲 No implementado | Bloqueo 24h ±2h no existe. Sin contador ni alerta de vencimiento. |
| HU-05-03-03 | Selección de equipo cuenta colonias | 🔲 No implementado | Checkbox no conectado. |
| HU-05-04-01 | Subetapas de Confirmación | 🟡 Frontend | Incubación → Lectura → Resultados en wizard. Sin backend. |
| HU-05-04-02 | Validación temporal de prueba de Oxidasa | 🟡 Parcial | Validación en frontend. Sin bitácora de invalidación. Sin backend. |
| HU-05-05-01 | Acceso del Coordinador al formulario completado | 🔲 No implementado | Sin control de acceso por rol. |
| HU-05-05-02 | Exclusividad de edición para rol Analista | 🔲 No implementado | Sin control de acceso por rol. |

**Problemas críticos**:

- **Sin modelo Prisma**: Enterobacterias no existe en `schema.prisma`. No puede persistir datos.
- **Sin backend**: No tiene rutas Express, servicios, ni calculadores.
- **Sin cálculo automatizado**: Los resultados no se calculan.
- **Linear**: 7 issues en Backlog (LAB-1 a LAB-6, LAB-23). Todos con due dates vencidos.
- **Sprint 2** (LAB-39, due 23-jun) sin empezar.

---

## Épica 4.1–4.4: Salmonella — ~10% (solo frontend)

| ID | Historia de Usuario | Estado |
|----|---------------------|--------|
| HU-04-01-01 | Selección de tipo de matriz | 🟡 Frontend (general, polvo, chocolate) |
| HU-04-01-02 | Protocolo de hidratación para matriz polvo | 🔲 No implementado |
| HU-04-01-03 | Asignación automática para matriz chocolate | 🔲 No implementado |
| HU-04-01-04 | Alerta de tiempo límite de 25 minutos | 🔲 No implementado |
| HU-04-02-01 | Autocompletado de controles de calidad | 🔲 No implementado |
| HU-04-02-04 | Gestión de columna duplicado por día | 🔲 No implementado |
| HU-04-03-01 | Trazabilidad operativa completa | 🔲 No implementado |
| HU-04-04-01 | Marcado de crecimiento y resultado final | 🔲 No implementado |

**Nota**: Tiene modelo Prisma (`SalFormulario` con 5 fases) pero la página frontend es un cascarón.
**Bug LAB-48**: La ruta de Salmonella abre el formulario de Enterobacterias. Pendiente de fix.

---

## Épica 2: Gestión de Notificaciones — 0%

| ID | Historia de Usuario | Estado |
|----|---------------------|--------|
| HU-02-01 | Notificaciones por correo electrónico | 🔲 No implementado (MEJORAR) |

Marcada como "pendiente de priorización para iteración futura" en la propia ERS.

---

## Épica 7: Mohos y Levaduras — 0%

Desarrollo colaborativo planificado para después de completar los formularios principales. Todo el equipo VIMU DEVS + ASISTEC.

---

## Requerimientos No Funcionales

| ID | Nombre | Estado |
|----|--------|--------|
| RNF-001 | Tiempo de Respuesta < 3s (20 usuarios) | 🟡 No verificado |
| RNF-002 | Autenticación de Usuarios | ✅ Implementado (login/contraseña) |
| RNF-003 | Interfaz Intuitiva | 🟡 En progreso |
| RNF-004 | Disponibilidad ≥ 99.5% | 🔲 No aplica (sin producción) |
| RNF-005 | Documentación Técnica | 🟡 Parcial (CONTRIBUTING.md, README) |
| RNF-006 | Compatibilidad Chrome, Firefox, Edge | 🟡 No verificado formalmente |
| RNF-007 | Trazabilidad y Auditoría | 🟡 Bitácora parcial (fechas/horas en flujos implementados) |

---

## Resumen de Riesgos

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|-------------|------------|
| Enterobacterias sin backend ni modelo de datos | Alto | 100% (ya ocurrió) | Iniciar SDD urgente. |
| Salmonella con ruta rota (LAB-48) | Medio | 100% | Fix de 1 hora. |
| Coliformes sin prueba en vivo | Medio | 50% | LAB-21 + LAB-22 antes del 4-jul. |
| Épicas 1 y 3 sin auditoría completa | Medio | 80% | Auditoría HU por HU. |
| Sprint 2 vence en 2 días sin avance | Alto | 100% | Replanificar Enterobacterias en Sprint 3/4. |

---

## Próximos Hitos

| Fecha | Hito | Estado |
|-------|------|--------|
| 23-jun-2026 | Vence Sprint 2 (Enterobacterias) | ❌ Sin avance |
| 29-jun-2026 | LAB-21 Revisión local completa Incremento 3 | 🔲 Pendiente |
| 4-jul-2026 | Reunión de avance con ASISTEC (LAB-17) | 🔲 Preparar demo |
| 31-jul-2026 | Cierre del proyecto (LAB-18) | 🔲 En progreso |

---

*Documento generado el 21 de junio de 2026. Fuentes: ERS v3.0, Linear (Lab Assistec), Engram (SDD artifacts, exploraciones), git log.*
