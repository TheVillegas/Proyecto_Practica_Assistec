# Sprint 2 — Planificación

> Issues creados en GitHub para seguimiento.

---

## Issue #9 — refactor(ram): cargar datos desde tablas maestras

**Link**: https://github.com/TheVillegas/Proyecto_Practica_Assistec/issues/9

### Objetivo
Reestructurar el formulario RAM (Aerobios) para que los datos críticos provengan desde tablas maestras del sistema, evitando ingreso manual. Reemplazar validaciones tipo checklist por registros de fecha/hora con cálculo automático.

### Tablas maestras disponibles

| Tabla | Campos | Uso actual en RAM |
|-------|--------|-------------------|
| `EquipoIncubacion` | idIncubacion, nombreEquipo, temperaturaRef | ✅ ion-select (listaEquiposIncubacion) |
| `Micropipeta` | idPipeta, nombrePipeta, codigoPipeta, capacidad | ⚠️ ion-select sin código visible |
| `MaterialSiembra` | idMaterialSiembra, nombreMaterial, detalleMedida | ❌ No usado |
| `Instrumento` | idInstrumento, nombreInstrumento, codigoInstrumento | ❌ No usado |
| `Usuario` (rol analista) | rutUsuario, nombreApellidoUsuario | ❌ Texto libre |

### Checklist de tareas
- [ ] Cargar analistas desde `Usuario` con rol analista (select en vez de texto)
- [ ] Mejorar select de micropipetas con código visible
- [ ] Cargar puntas/tubos desde `MaterialSiembra` o `Instrumento`
- [ ] Reemplazar checkboxes de centrifugación/siembra por fecha/hora inicio + término
- [ ] Implementar cálculo automático de cumplimiento de tiempo
- [ ] Agregar campos a Control de Siembra
- [ ] Verificar bastón, asa, tubos estériles contra catálogos
- [ ] Endpoints API para catálogos si faltan

---

## Issue #10 — refactor(coliformes): cargar datos desde tablas maestras

**Link**: https://github.com/TheVillegas/Proyecto_Practica_Assistec/issues/10

### Objetivo
Mismos cambios que RAM pero aplicados al formulario de Enterobacterias (Coliformes). Actualmente usa radio buttons para estufa y micropipeta, y texto libre para analistas.

### Checklist de tareas
- [ ] Cambiar radio buttons de estufa a select desde `EquipoIncubacion`
- [ ] Cambiar radio buttons de micropipeta a select desde `Micropipeta`
- [ ] Cargar analistas desde `Usuario` con rol analista
- [ ] Reemplazar checkboxes por fecha/hora inicio + término
- [ ] Implementar cálculo automático de cumplimiento de tiempo
- [ ] Endpoints API para catálogos si faltan

---

## Progreso Sprint 1 (cerrado)

| PR | Descripción | Estado |
|----|-------------|--------|
| #8 | S. aureus Phase 5 calculation + backend fixes | En revisión |
