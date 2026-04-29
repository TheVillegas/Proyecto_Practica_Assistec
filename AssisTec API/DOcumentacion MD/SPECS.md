# Spec: asistec-api-bootstrap

## Roles del Sistema

| Rol | ID | Alcance |
|-----|----|---------|
| Analista | 0 | Trabaja sobre ALI/reportes asignados |
| Coordinadora | 1 | Valida solicitudes, modifica datos parciales, busca ALI e Ingreso |
| Jefe de Área | 2 | Valida formularios, busca ALI e Ingreso |
| Ingreso (Secretaria) | 3 | Crea y edita solicitudes de ingreso, solo ve Ingreso |

## Matriz de Permisos

| Permiso | Descripción | Roles | Restricciones |
|---------|-------------|-------|---------------|
| **Lectura** | Ver registros históricos | Todos | Ingreso: solo solicitudes. Jefe/Coord: ALI + Ingreso. Analista: ALI |
| **Escritura** | Modificar documentos NO validados | Ingreso, Coordinadora, Analista | Ingreso: no puede editar solicitud validada. Analista: no puede editar análisis enviado/validado. Coordinadora: solo ciertos campos de solicitud |
| **Validación** | Marcar formulario como validado | Coordinadora, Jefe | Acción irreversible para escritura (bloquea edición) |

---

## REQ-01: Autenticación y Login

El sistema DEBE permitir login por correo + contraseña usando la tabla `usuarios` del esquema nuevo.

### Escenarios

**SC-01.1: Login exitoso**
- **Given**: Usuario existe en `usuarios` con correo `ana@lab.cl` y contraseña hasheada
- **When**: POST `/api/auth/login` con `{ correo, contrasena }`
- **Then**: 200 con `{ token, usuario: { rut, nombre, rol } }`

**SC-01.2: Credenciales inválidas**
- **When**: Correo no existe o contraseña incorrecta
- **Then**: 401 `"Credenciales inválidas"`

**SC-01.3: Campos faltantes**
- **When**: POST sin correo o sin contraseña
- **Then**: 400

---

## REQ-02: CRUD Solicitud de Ingreso

### Escenarios

**SC-02.1: Crear solicitud**
- **Given**: Usuario con rol Ingreso (3)
- **When**: POST `/api/solicitud` con datos válidos
- **Then**: 201 con `{ id_solicitud, numero_ali }`

**SC-02.2: Rol no autorizado para crear**
- **Given**: Usuario con rol ≠ Ingreso (3)
- **When**: POST `/api/solicitud`
- **Then**: 401

**SC-02.3: Listar solicitudes**
- **Given**: Usuario autenticado
- **When**: GET `/api/solicitud`
- **Then**: 200, filtrado según rol (Ingreso ve solo ingreso, Coord/Jefe ven todo)

**SC-02.4: Editar solicitud no validada**
- **Given**: Solicitud con estado ≠ "validada"
- **When**: PUT `/api/solicitud/:id` por Ingreso
- **Then**: 200

**SC-02.5: Editar solicitud validada**
- **Given**: Solicitud con estado = "validada"
- **When**: PUT `/api/solicitud/:id` por Ingreso
- **Then**: 403 `"Solicitud ya validada, no se puede modificar"`

**SC-02.6: Coordinadora edita campos parciales**
- **Given**: Solicitud existe, usuario es Coordinadora
- **When**: PUT `/api/solicitud/:id` con campos permitidos
- **Then**: 200, solo actualiza campos autorizados para Coordinadora

---

## REQ-03: Gestión de Submuestras (Batch)

El sistema DEBE permitir crear 1 a N submuestras en una sola petición.

### Escenarios

**SC-03.1: Crear batch de submuestras**
- **Given**: Solicitud `id_solicitud = 5` existe
- **When**: POST `/api/solicitud/5/muestra` con `{ cantidad: 3 }`
- **Then**: 201 con array de `[{ id_solicitud_muestra }, ...]` (3 registros)

**SC-03.2: Listar submuestras**
- **When**: GET `/api/solicitud/5/muestra`
- **Then**: 200 con array de submuestras + análisis asignados a cada una

---

## REQ-04: Asignación de Análisis

### Escenarios

**SC-04.1: Asignar análisis a submuestra**
- **When**: POST `/api/muestra/:id/analisis` con `{ id_alcance_acreditacion, id_formulario_analisis, acreditado, metodologia_norma }`
- **Then**: 201

**SC-04.2: Análisis con formulario TPA**
- **Given**: `formulario_analisis.genera_tpa_default = true`
- **When**: Se asigna
- **Then**: Se marca internamente que la solicitud requiere TPA al generar reportes

---

## REQ-05: Generación de Reportes (Bridge Legacy)

### Escenarios

**SC-05.1: Generar reportes**
- **Given**: Solicitud con análisis asignados
- **When**: POST `/api/solicitud/:id/generar`
- **Then**: En una transacción:
  1. Crea `MUESTRAS_ALI` con `codigo_ali = numero_ali`
  2. Si requiere TPA → `TPA_REPORTE` con `estado = 'NO_REALIZADO'`
  3. Si requiere RAM → `RAM_REPORTE` con `estado = 'Borrador'`
- **And**: 200 `{ tpa_generado, ram_generado }`

**SC-05.2: Sin análisis**
- **Then**: 400 `"No hay análisis asignados"`

**SC-05.3: Ya generados**
- **Then**: 409 `"Reportes ya generados"`

---

## REQ-06: Validación de Documentos

### Escenarios

**SC-06.1: Coordinadora valida solicitud**
- **Given**: Usuario Coordinadora (1), solicitud en estado "pendiente"
- **When**: POST `/api/solicitud/:id/validar`
- **Then**: 200, estado cambia a "validada", se bloquea edición para Ingreso

**SC-06.2: Jefe valida formulario**
- **Given**: Usuario Jefe (2), formulario en estado "enviado"
- **When**: POST `/api/formulario/:id/validar`
- **Then**: 200, formulario queda validado y bloqueado

---

## REQ-07: Lectura de Catálogos

- **When**: GET `/api/catalogo/:tipo`
- **Then**: 200 con array de la tabla maestra correspondiente

---

## Requisitos No Funcionales

### NF-01: Seguridad
- TODAS las rutas excepto login DEBEN requerir JWT
- Autorización por rol DEBE validarse por endpoint
- Contraseñas hasheadas con bcrypt (salt 10)
- NUNCA loguear contraseñas ni tokens

### NF-02: Arquitectura
- Route → Controller → Service → Repository (capas estrictas)
- Controllers NUNCA importan Prisma
- Services NUNCA acceden a `req`/`res`
- Operaciones multi-tabla DEBEN usar `$transaction`

### NF-03: Trazabilidad (Auditoría)
- Toda mutación (create/update/delete) DEBE registrar `created_by`/`updated_by` con el `rut_usuario` del token
- Toda mutación DEBE actualizar `updated_at` automáticamente
- Las validaciones DEBEN registrar quién validó y cuándo

### NF-04: Condición de Carrera (Optimistic Locking)
- Las operaciones de UPDATE DEBEN implementar **optimistic locking** usando `updated_at`
- Flujo: el frontend envía `updated_at` del registro que leyó. El backend verifica que `updated_at` en BD coincida antes de actualizar. Si no coincide → 409 `"El registro fue modificado por otro usuario"`
- Esto aplica a: solicitudes, análisis, y cualquier formulario editable
