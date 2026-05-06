# Arquitectura — AssisTec

## Vision General

AssisTec es una plataforma de gestion de laboratorio microbiologico. El sistema registra muestras de alimentos, ejecuta analisis RAM (Recuento en Agar Mesofilico) y TPA (Tratamiento Post-Analisis), y emite reportes para los clientes.

---

## Stack Tecnologico

| Capa | Tecnologia |
|---|---|
| Frontend | Angular 20 + Ionic |
| Backend activo | Node.js + Express 5 + Prisma 6 (`AssisTec API/`) |
| Backend legacy | Node.js + Express + pg directo (`Backend/`) — **deprecated** |
| Base de datos | PostgreSQL 16 (Docker) |
| Autenticacion | JWT (mismo `JWT_SECRET` en ambos backends) |

---

## Diagrama de Componentes

```
[Angular + Ionic (Frontend) :4200 / :8100]
         |
         | HTTP + JWT Bearer
         |
[AssisTec API :3001]          [Backend legacy :3000] — DEPRECATED
   Routes                          Routes
   Controllers                     Controllers
   Services                        Models (SQL directo)
   Repositories                    pg Pool
   Prisma Client
         |                              |
         +----------+-------------------+
                    |
            [PostgreSQL :5432]
             Tablas nuevas (BD_NEW)
             Tablas legacy (TPA/RAM/MUESTRAS_ALI)
             Tablas maestras (compartidas)
```

**Importante:** ambos backends comparten la misma base de datos. El nuevo backend accede a tablas legacy via Prisma `@@map` unicamente para el bridge de reportes.

---

## Estructura de Directorios — AssisTec API (backend activo)

```
AssisTec API/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   ├── prisma.js          # Singleton PrismaClient
│   │   └── roles.js           # Constantes: ROL_ANALISTA=0, COORDINADORA=1, JEFE_AREA=2, INGRESO=3
│   ├── middleware/
│   │   ├── auth.js            # verifyToken + authorize()
│   │   └── optimisticLock.js  # Middleware de concurrencia
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── repositories/
├── app.js
└── .env.example
```

---

## Flujo de Autenticacion

```
POST /api/auth/login {correo, contrasena}
  -> AuthController -> AuthService -> UsuarioRepository
  -> bcrypt.compare(contrasena, hash)
  -> jwt.sign({id: rut, role: rol}, JWT_SECRET)
  <- 200 { token, usuario }

Requests subsiguientes:
  Authorization: Bearer <token>
  -> auth.js: verifyToken -> req.user = { rut, rol }
  -> authorize([roles]) -> 401 si rol no permitido
```

---

## Flujo de Solicitud de Ingreso

```
POST /api/solicitud (JWT, rol=INGRESO)
  -> SolicitudController -> SolicitudService
  -> Calcular numero_ali (max+1 del ano)
  -> prisma.$transaction: INSERT solicitud_ingreso + N solicitud_muestra
  <- 201 { id_solicitud, numero_ali, muestras[] }
```

La solicitud y sus submuestras se crean en la misma transaccion. Si falla cualquier INSERT, rollback completo.

---

## Flujo de Generacion de Reportes (Bridge Legacy)

```
POST /api/solicitud/:id/reportes (JWT, rol=COORDINADORA|JEFE_AREA)
  -> ReporteService -> ReporteRepository
  -> BEGIN TRANSACTION
     INSERT muestras_ali (codigo_ali = numero_ali)
     INSERT tpa_reporte (si formulario requiere TPA)
     INSERT ram_reporte (si analisis es tipo RAM)
     UPDATE solicitud_ingreso SET estado='reportes_generados'
  -> COMMIT
```

Todo en una transaccion Prisma. Si falla cualquier paso, rollback completo.

---

## Flujo de Comunicacion Frontend-Backend (Legacy)

> Esta seccion describe el backend `Backend/` (legacy, puerto 3000). Se conserva como referencia para entender el sistema existente.

```
[Angular + Ionic]
  HTTP + JWT en header Authorization: Bearer
[Express.js (Backend/) - Puerto 3000]
  Pool de conexiones pg
[PostgreSQL - Puerto 5432]
```

URLs base:
- Desarrollo: `http://localhost:3000/AsisTec`
- Produccion: `http://3.208.28.45:3000/AsisTec`

---

## Optimistic Locking (NF-04)

```javascript
async update(id, data, expectedUpdatedAt) {
  const result = await prisma.solicitudIngreso.updateMany({
    where: { id_solicitud: id, updated_at: expectedUpdatedAt },
    data: { ...data, updated_at: new Date() }
  });
  if (result.count === 0) throw new ConflictError('Registro modificado por otro usuario');
}
```

El frontend envia `updated_at` con el timestamp que leyo. El backend compara — si difiere, responde 409 Conflict.

---

## Diseno de Autorizacion

```javascript
// src/config/roles.js
const ROLES = { ANALISTA: 0, COORDINADORA: 1, JEFE_AREA: 2, INGRESO: 3 };

// Uso en rutas:
router.post('/solicitud', verifyToken, authorize([ROLES.INGRESO]), controller.crear);
router.post('/solicitud/:id/validar', verifyToken, authorize([ROLES.COORDINADORA, ROLES.JEFE_AREA]), controller.validar);
```

---

## Estados de una Solicitud

```
borrador -> enviada -> [Jefa de Area]  -> devuelta -> borrador (Ingreso corrige)
                                       -> validada_jefe -> [Coordinadora] -> reportes_generados
```

El flujo de validacion es secuencial: primero Jefa de Area, luego Coordinadora.
No se puede saltar etapas. La devolucion siempre regresa a `borrador` para que Ingreso corrija.

Reglas de escritura:
- `borrador`: Ingreso puede editar todo
- `enviada`: Nadie edita (en revision por Jefa)
- `validada_jefe`: En revision por Coordinadora, Ingreso solo lee
- `devuelta`: Ingreso puede editar (corregir y re-enviar)
- `reportes_generados`: Formularios de analisis creados, aparecen en busqueda-ali para Analistas

---

## Decisiones de Arquitectura

| # | Decision | Razon |
|---|----------|-------|
| AD-01 | Express 5 + CommonJS | Consistencia con backend legacy |
| AD-02 | Prisma 6 como ORM | Elimina SQL manual, type-safety, migraciones automaticas |
| AD-03 | Mismo JWT_SECRET que legacy | Un solo token funciona en ambos backends durante la transicion |
| AD-04 | Repositorios encapsulan Prisma | Si se cambia ORM en el futuro, solo cambian repositories |
| AD-05 | Optimistic locking via `updated_at` | Simple, no requiere columna `version` extra |
| AD-06 | Bridge `MUESTRAS_ALI` directo | Evita HTTP inter-service, misma BD, misma transaccion |
| AD-07 | Estados como strings (no enum PG) | Mas flexible para agregar estados futuros sin migracion |

---

## Problemas Conocidos en el Backend Legacy

> Documentados en auditoria de marzo 2026. Relevantes para quien mantenga `Backend/`.

1. **CORS_ORIGIN vacio**: si no esta en `.env`, el backend rechaza todos los requests del browser.
2. **Desalineacion de variables de entorno**: `.env.example` usa `DB_NAME`/`DB_PASSWORD`, pero el codigo lee `NOMBRE_DB`/`MI_CLAVE_POSTGRES`.
3. **DELETE sin validar payload vacio**: en `guardarReporteRAM`, si `etapa3_repeticiones` llega vacio, se borran todas las muestras sin error visible.
4. **Funcion `obtenerReporteRAM` duplicada**: la segunda definicion pisa a la primera.
5. **Ruta `/Exportar` con mayuscula incorrecta**: frontend llama `/exportar` (minuscula), Express falla en Linux.
6. **Endpoint de upload sin autenticacion**: cualquier persona puede subir archivos a S3.

Ver `docs/database.md` para problemas relacionados con la base de datos.
