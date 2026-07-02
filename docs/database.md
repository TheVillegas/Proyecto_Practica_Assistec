# Base de Datos — AssisTec

> Motor: PostgreSQL 16 (Docker)
> ORM: Prisma 6 (AssisTec API)
> Schema Prisma: `AssisTec API/prisma/schema.prisma`
> Schema SQL inicial: `BD/init/init_refined.sql`
> Seeds: `BD/seeds/`

---

## Dos schemas conviviendo

La base de datos tiene dos capas de tablas:

| Capa | Tablas | Gestionadas por |
|---|---|---|
| **Nueva** (activa) | clientes, usuarios, solicitud_ingreso, solicitud_muestra, solicitud_analisis, formularios_analisis, alcance_acreditacion, etc. | Prisma (AssisTec API) |
| **Legacy** (bridge) | muestras_ali, tpa_reporte, ram_reporte | Prisma via `@@map` — el nuevo backend las escribe al generar reportes |

El nuevo backend NO toca las tablas de etapas TPA/RAM (TPA_ETAPA*, RAM_ETAPA*). Esas siguen siendo manejadas por el `Backend/` legacy si corresponde.

---

## Diagrama del Esquema Nuevo

```
clientes
  ├── direcciones_cliente
  └── solicitud_ingreso ─┬─ solicitud_muestra ── solicitud_analisis
                         │                            └── formularios_analisis ── alcance_acreditacion
                         │                                                              └── accreditaciones_inn
                         ├── categorias_producto ─── tiempos_por_categoria
                         ├── usuarios (rut_responsable_ingreso, rut_jefa_area, rut_coordinarora_recepcion, created_by)
                         ├── equipos_lab (termometro)
                         └── lugares_almacenamiento

Catalogos (datos fijos):
  diluyentes · equipos_incubacion · equipos_lab · instrumentos
  lugares_almacenamiento · micropipetas · material_siembra
  maestro_checklist_limpieza · maestro_formas_calculo · maestro_tipos_analisis
  categorias_producto · formularios_analisis · accreditaciones_inn

Bridge legacy (escritura puntual al generar reportes):
  muestras_ali ── tpa_reporte
               └── ram_reporte
```

---

## Tablas Principales

### usuarios
Tabla nueva — reemplaza a `USUARIOS` del legacy. Gestionada por Prisma.

| Columna | Tipo | Descripcion |
|---|---|---|
| rut_usuario | VARCHAR PK | RUT chileno |
| nombre_apellido_usuario | VARCHAR | Nombre completo |
| correo_usuario | VARCHAR | Email de login |
| contrasena_usuario | VARCHAR | Hash bcrypt (salt 10) |
| rol_usuario | INT | 0=Analista, 1=Coordinadora, 2=Jefe de Area, 3=Ingreso |
| url_foto | VARCHAR | Key en S3 de la foto de perfil |

### clientes
| Columna | Descripcion |
|---|---|
| id_cliente | PK autoincremental |
| rut | RUT de la empresa cliente |
| nombre | Razon social |
| email / telefono | Contacto |
| activo | Estado del cliente |

### solicitud_ingreso
Tabla central del flujo de ingreso de muestras. Cada solicitud contiene N submuestras.

| Columna clave | Descripcion |
|---|---|
| id_solicitud | PK autoincremental |
| anio_ingreso + numero_ali | Identificador compuesto de la solicitud (ej: 2026-001) |
| estado | borrador → enviada → validada → reportes_generados / devuelta |
| categoria | FK a categorias_producto |
| id_cliente / id_direccion | Cliente y su direccion |
| fecha_recepcion | Cuando llego la muestra al laboratorio |
| temperatura_recepcion | Temperatura registrada al recibir |
| id_termometro | Equipo usado para medir temperatura (FK equipos_lab) |
| id_lugar | Donde se almacena (FK lugares_almacenamiento) |
| rut_responsable_ingreso | Usuario Ingreso que creo la solicitud |
| rut_jefa_area | Jefe de area asignado |
| rut_coordinarora_recepcion | Coordinadora asignada |
| created_by | RUT del usuario que creo el registro |
| updated_at | Usado para optimistic locking |

### solicitud_muestra
Cada solicitud tiene 1 a N submuestras (creadas en batch).

| Columna | Descripcion |
|---|---|
| id_solicitud_muestra | PK autoincremental |
| id_solicitud | FK a solicitud_ingreso |

### solicitud_analisis
Cada submuestra puede tener 1 o mas analisis asignados.

| Columna | Descripcion |
|---|---|
| id_solicitud_analisis | PK |
| id_solicitud_muestra | FK a solicitud_muestra |
| id_alcance_acreditacion | FK al alcance INN aplicable (nullable si no acreditado) |
| id_formulario_analisis | FK al tipo de analisis (RAM, TPA, Hongos, etc.) |
| acreditado | Si el analisis es bajo norma INN |
| metodologia_norma | Descripcion de la norma aplicada |
| dias_negativo_snapshot / dias_confirmacion_snapshot | Snapshot del tiempo al momento de asignar |

### formularios_analisis
Catalogo de tipos de analisis disponibles.

| Columna | Descripcion |
|---|---|
| id_formularios_analisis | PK |
| codigo | Codigo del formulario |
| nombre_analisis | Nombre descriptivo |
| area | Area del laboratorio |
| genera_tpa_default | Si true → al generar reportes se crea un TPA_REPORTE automaticamente |

### alcance_acreditacion
Cruza formularios_analisis con categorias_producto y accreditaciones_inn. Define que analisis estan acreditados para que categorias de productos.

### accreditaciones_inn
Acreditaciones vigentes del laboratorio ante el INN. Cada una tiene fecha de vigencia y URL del certificado.

### categorias_producto
Categorias de alimentos (ej: carnes frescas, lacteos, conservas). Determina los tiempos de entrega de resultados.

### tiempos_por_categoria
Dias habiles para entrega de resultado negativo/positivo, segun categoria y formulario de analisis.

---

## Tablas Legacy (Bridge)

Estas tablas pertenecen al sistema antiguo y son accedidas por el nuevo backend SOLO para el bridge de generacion de reportes. No se deben modificar via Prisma migrations.

| Tabla | Descripcion |
|---|---|
| muestras_ali | Registro central de muestras. El nuevo backend inserta aqui con `codigo_ali = numero_ali` al generar reportes |
| tpa_reporte | Cabecera del proceso TPA. Se crea con `estado='NO_REALIZADO'` si el formulario requiere TPA |
| ram_reporte | Cabecera del proceso RAM. Se crea con `estado='Borrador'` si el analisis es RAM |

Las tablas de etapas (TPA_ETAPA*, RAM_ETAPA*) no estan en el schema Prisma — las maneja el `Backend/` legacy directamente via pg.

---

## Ciclo de Vida de una Solicitud

```
[Usuario Ingreso crea solicitud]
  → estado: "borrador"
  → solicitud_ingreso + N solicitud_muestra (en una transaccion)
         ↓
[Asigna analisis a cada submuestra]
  → solicitud_analisis por submuestra
         ↓
[Ingreso envia a revision]
  → estado: "enviada"
         ↓
[Coordinadora/Jefe valida]
  → estado: "validada"
  → Ingreso ya no puede editar
         ↓  (o)
[Coordinadora devuelve con motivo]
  → estado: "devuelta"
  → Ingreso corrige → "enviada" de nuevo
         ↓
[Se generan reportes legacy]
  → INSERT en muestras_ali (codigo_ali = numero_ali)
  → INSERT en tpa_reporte si genera_tpa_default=true
  → INSERT en ram_reporte si analisis es RAM
  → estado: "reportes_generados"
```

---

## Archivos de Base de Datos

```
BD/
├── init/
│   └── init_refined.sql        # Schema completo legacy (PostgreSQL raw)
├── seeds/
│   ├── seeds.sql               # Catalogos base (diluyentes, equipos, usuarios)
│   ├── BD_NEW.sql              # Schema de tablas nuevas (solicitudes)
│   ├── 01_update_solicitud_analisis_snapshots.sql
│   └── 02_seed_solicitud_ingreso_asistec.sql
└── migrations/
    ├── 01_add_ali_images.sql
    └── 02_add_user_photo.sql
```

El nuevo backend gestiona el schema mediante Prisma Migrate (`prisma migrate dev` / `prisma migrate deploy`). El uso de `prisma db push` está **deprecado** para el flujo de trabajo del proyecto; ver la [Guía de Migraciones](database-migrations-guide.md) para el workflow oficial, la baseline migration y la reconciliación de bases de datos existentes. Los archivos SQL de `BD/init/` son de referencia y para el backend legacy.

---

## Optimistic Locking

El campo `updated_at` en `solicitud_ingreso` (y otros editables) implementa control de concurrencia:

1. Frontend lee el registro y guarda el `updated_at`.
2. Al hacer PUT, envia `updated_at` junto con los datos.
3. El backend hace `updateMany WHERE id = X AND updated_at = Y`.
4. Si `count = 0` → alguien modifico el registro entre medio → 409 Conflict.

Esto aplica a: solicitudes, analisis y cualquier formulario editable.

---

## Problemas Detectados (Auditoria Marzo 2026)

Estos problemas son del backend legacy (`Backend/`), no del nuevo:

| # | Problema | Severidad |
|---|---|---|
| 1 | `.env.example` usa `DB_NAME`/`DB_PASSWORD` pero el codigo lee `NOMBRE_DB`/`MI_CLAVE_POSTGRES` | Critico |
| 2 | DELETE sin validar payload vacio en `guardarReporteRAM` — puede borrar todas las muestras | Critico |
| 3 | `CORS_ORIGIN` vacio bloquea todos los requests del browser | Critico |
| 4 | Funcion `obtenerReporteRAM` duplicada en `reporteRAMModel.js` | Critico |
| 5 | Ruta `/Exportar` con mayuscula en backend vs `/exportar` en frontend — falla en Linux | Critico |
| 6 | Endpoint de upload de imagenes sin autenticacion | Advertencia |
| 7 | `MILILITROS` en `DILUYENTES` es VARCHAR en vez de numerico | Advertencia |

Ver `docs/architecture.md` para el detalle completo.
