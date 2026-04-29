# Design: AssisTec API

## Arquitectura General

```mermaid
graph TB
    subgraph "Frontend (Ionic/Angular)"
        FE[Ionic App :8100]
    end

    subgraph "AssisTec API (NUEVO) :3001"
        R[Routes] --> C[Controllers]
        C --> S[Services]
        S --> RP[Repositories]
        RP --> PC[Prisma Client]
        MW[Middleware: Auth + Authorize]
        MW --> R
    end

    subgraph "Backend Legacy :3000"
        LR[Legacy Routes] --> LC[Controllers]
        LC --> LM[Models: SQL directo]
        LM --> DB2[pg Pool]
    end

    subgraph "PostgreSQL :5432"
        NEW_T["Tablas Nuevas (BD_NEW)"]
        LEG_T["Tablas Legacy (TPA/RAM/MUESTRAS_ALI)"]
        MASTER["Tablas Maestras (compartidas)"]
    end

    FE --> MW
    FE --> LR
    PC --> NEW_T
    PC --> LEG_T
    PC --> MASTER
    DB2 --> LEG_T
    DB2 --> MASTER
```

**Decisión**: Ambos backends comparten la misma BD pero acceden a tablas distintas. Las tablas maestras son compartidas. El nuevo backend accede a 3 tablas legacy via Prisma `@@map` solo para el bridge de reportes.

---

## Estructura de Directorios

```
AssisTec API/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   ├── prisma.js          ← Singleton PrismaClient
│   │   └── roles.js           ← Constantes ROL_ANALISTA=0, etc.
│   ├── middleware/
│   │   ├── auth.js            ← verifyToken + authorize()
│   │   └── optimisticLock.js  ← Middleware de concurrencia
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── solicitud.routes.js
│   │   ├── muestra.routes.js
│   │   ├── analisis.routes.js
│   │   ├── reporte.routes.js
│   │   └── catalogo.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── solicitud.controller.js
│   │   ├── muestra.controller.js
│   │   ├── analisis.controller.js
│   │   ├── reporte.controller.js
│   │   └── catalogo.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── solicitud.service.js
│   │   ├── muestra.service.js
│   │   ├── analisis.service.js
│   │   ├── reporte.service.js
│   │   └── catalogo.service.js
│   └── repositories/
│       ├── usuario.repository.js
│       ├── solicitud.repository.js
│       ├── muestra.repository.js
│       ├── analisis.repository.js
│       ├── reporte.repository.js
│       └── catalogo.repository.js
├── app.js
├── package.json
└── .env.example
```

---

## Flujos Clave

### Login (REQ-01)

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant MW as Auth Middleware
    participant CT as AuthController
    participant SV as AuthService
    participant RP as UsuarioRepository
    participant DB as PostgreSQL

    FE->>CT: POST /api/auth/login {correo, contrasena}
    CT->>CT: Validar campos
    CT->>SV: login(correo, contrasena)
    SV->>RP: findByCorreo(correo)
    RP->>DB: SELECT * FROM usuarios WHERE correo_usuario = $1
    DB-->>RP: usuario row
    RP-->>SV: usuario
    SV->>SV: bcrypt.compare(contrasena, hash)
    alt Contraseña válida
        SV->>SV: jwt.sign({id: rut, role: rol})
        SV-->>CT: {token, usuario}
        CT-->>FE: 200 {token, usuario}
    else Inválida
        SV-->>CT: throw UnauthorizedError
        CT-->>FE: 401
    end
```

### Crear Solicitud + Submuestras (REQ-02 + REQ-03)

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant MW as Authorize(ROL_INGRESO)
    participant CT as SolicitudController
    participant SV as SolicitudService
    participant RP as SolicitudRepository
    participant DB as PostgreSQL

    FE->>MW: POST /api/solicitud (JWT)
    MW->>MW: Verificar token + rol=3
    MW->>CT: req.user = {rut, rol}
    CT->>CT: Validar body
    CT->>SV: crearSolicitud(datos, rutUsuario)
    SV->>SV: Calcular numero_ali (max+1 del año)
    SV->>RP: create(solicitudData)
    RP->>DB: prisma.$transaction: INSERT solicitud_ingreso + N solicitud_muestra
    DB-->>RP: solicitud + muestras
    RP-->>SV: resultado
    SV-->>CT: {id_solicitud, numero_ali, muestras[]}
    CT-->>FE: 201
```

**Decisión**: La solicitud y sus submuestras se crean en la MISMA transacción. El frontend envía `cantidad_muestras` y el service crea N registros en `solicitud_muestra`.

### Generación de Reportes — Bridge Legacy (REQ-05)

```mermaid
sequenceDiagram
    participant CT as ReporteController
    participant SV as ReporteService
    participant RP as ReporteRepository
    participant DB as PostgreSQL

    CT->>SV: generarReportes(id_solicitud)
    SV->>RP: getSolicitudConAnalisis(id_solicitud)
    RP->>DB: SELECT solicitud + análisis + formularios
    DB-->>RP: datos
    RP-->>SV: solicitud con análisis

    SV->>SV: Evaluar qué formularios se necesitan
    SV->>SV: ¿algún formulario tiene genera_tpa_default=true? → necesita TPA
    SV->>SV: ¿algún análisis es tipo RAM? → necesita RAM

    SV->>RP: generarEnTransaccion(datos)
    RP->>DB: BEGIN TRANSACTION
    RP->>DB: INSERT INTO muestras_ali (codigo_ali) VALUES (numero_ali)
    opt TPA requerido
        RP->>DB: INSERT INTO tpa_reporte (codigo_ali, estado) VALUES (ali, 'NO_REALIZADO')
    end
    opt RAM requerido
        RP->>DB: INSERT INTO ram_reporte (codigo_ali, estado) VALUES (ali, 'Borrador')
    end
    RP->>DB: UPDATE solicitud_ingreso SET estado='reportes_generados'
    RP->>DB: COMMIT
    DB-->>RP: OK
    RP-->>SV: {tpa_generado, ram_generado}
    SV-->>CT: resultado
```

**Decisión**: Todo en UNA transacción Prisma. Si falla cualquier paso, rollback completo.

---

## Diseño del Optimistic Locking (NF-04)

```javascript
// Patrón en el repository
async update(id, data, expectedUpdatedAt) {
  const result = await prisma.solicitudIngreso.updateMany({
    where: {
      id_solicitud: id,
      updated_at: expectedUpdatedAt  // ← Clave del optimistic lock
    },
    data: { ...data, updated_at: new Date() }
  });

  if (result.count === 0) {
    throw new ConflictError('Registro modificado por otro usuario');
  }
  return result;
}
```

**Frontend envía**: `{ ...campos, updated_at: "2026-04-29T..." }` (el timestamp que leyó).
**Backend verifica**: Si `updated_at` en BD ≠ el enviado → 409 Conflict.

---

## Diseño de Autorización

```javascript
// src/config/roles.js
const ROLES = {
  ANALISTA: 0,
  COORDINADORA: 1,
  JEFE_AREA: 2,
  INGRESO: 3
};

// src/middleware/auth.js
const authorize = (allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ mensaje: 'No autenticado' });
  if (!allowedRoles.includes(req.user.rol)) {
    return res.status(401).json({ mensaje: 'No tienes permiso' });
  }
  next();
};

// Uso en rutas:
router.post('/solicitud', verifyToken, authorize([ROLES.INGRESO]), controller.crear);
router.post('/solicitud/:id/validar', verifyToken, authorize([ROLES.COORDINADORA, ROLES.JEFE_AREA]), controller.validar);
```

---

## Diseño de Validación de Documentos (REQ-06)

```mermaid
stateDiagram-v2
    [*] --> borrador: Ingreso crea solicitud
    borrador --> enviada: Ingreso envía a validación
    enviada --> validada: Coordinadora/Jefe valida
    enviada --> devuelta: Coordinadora devuelve con motivo
    devuelta --> borrador: Ingreso corrige
    validada --> reportes_generados: Se generan TPA/RAM

    note right of borrador: Ingreso puede editar
    note right of enviada: Solo lectura para Ingreso
    note right of validada: Bloqueada. Coord solo campos parciales
```

**Regla de escritura**: El service verifica el `estado` antes de permitir UPDATE:
- `borrador` → Ingreso puede editar todo
- `enviada` → Nadie edita (en revisión)
- `validada` → Coordinadora edita campos parciales, Ingreso solo lee
- `devuelta` → Ingreso puede editar (corregir)

---

## Prisma Schema — Estrategia

### Tablas nuevas
Prisma genera las migraciones. Representación 1:1 con `BD_NEW.sql`.

### Tablas legacy (solo 3)
Se definen en el schema con `@@map` apuntando a las tablas existentes. **Sin migraciones** — Prisma NO toca estas tablas, solo las lee/escribe.

```prisma
// Ejemplo: Bridge a tabla legacy
model MuestraAli {
  codigoAli              BigInt    @id @map("codigo_ali")
  codigoOtros            String?   @map("codigo_otros")
  observacionesCliente   String?   @map("observaciones_cliente")
  observacionesGenerales String?   @map("observaciones_generales")
  fechaCreacion          DateTime  @default(now()) @map("fecha_creacion")

  tpaReporte TpaReporte?
  ramReporte RamReporte?

  @@map("muestras_ali")
}
```

**Decisión**: Se usa `prisma migrate` solo para tablas nuevas. Para las legacy se usa `@@ignore` en las migraciones o `prisma db pull` selectivo.

---

## Decisiones de Arquitectura

| # | Decisión | Rationale |
|---|----------|-----------|
| AD-01 | Express 5 + CommonJS | Consistencia con backend legacy, misma versión de Express |
| AD-02 | Prisma 6 como ORM | Elimina SQL manual, type-safety, migraciones automáticas |
| AD-03 | Mismo JWT_SECRET que legacy | Un solo token funciona en ambos backends |
| AD-04 | Repositorios encapsulan Prisma | Si se cambia ORM en el futuro, solo cambian repositories |
| AD-05 | Optimistic locking via `updated_at` | Simple, no requiere columna `version` extra, funciona con Prisma |
| AD-06 | Bridge `MUESTRAS_ALI` directo | Evita HTTP inter-service, misma BD, misma transacción |
| AD-07 | Estados como strings (no enum PG) | Más flexible para agregar estados futuros sin migración |
