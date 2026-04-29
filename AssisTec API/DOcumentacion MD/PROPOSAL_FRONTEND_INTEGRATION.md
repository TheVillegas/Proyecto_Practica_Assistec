# Proposal: frontend-integration

## Intent

Conectar el frontend actual (Ionic/Angular) con el nuevo backend Node.js (AssisTec API) y proveer un entorno local funcional con datos reales. Esto permitirá al equipo de diseño UI/UX acceder al sistema con distintos roles (Ingreso, Analista, Coordinadora, Jefe) y maquetar los dashboards sin depender del sistema legacy.

## Scope

### In Scope
- **Database Seeding**: Crear un script o mecanismo de seed (Prisma seed o archivo SQL) que inserte los catálogos proporcionados (Diluyentes, Equipos, Instrumentos, etc.) y cree 4 usuarios de prueba (uno para cada rol).
- **Integración Auth**: Modificar el `AuthService` del frontend para golpear `/api/auth/login`, manejar el token JWT devuelto y almacenarlo.
- **Interceptors JWT**: Asegurar que las peticiones HTTP del frontend adjunten el token `Bearer` en los headers hacia el backend.
- **Integración de Módulos Base**: Conectar los servicios de Angular para creación de solicitudes y listado de catálogos hacia la nueva API (`/api/solicitud`, `/api/catalogo/:tipo`).

### Out of Scope
- Rediseño visual o maquetación de pantallas (responsabilidad del equipo UX/UI).
- Modificación profunda de componentes visuales que no estén rotos por el cambio de JSON.

## Capabilities

### New Capabilities
- `frontend-auth-jwt`: Integración del sistema de roles y tokens JWT en Angular.
- `local-db-seeding`: Capacidad de levantar la base de datos local pre-cargada con catálogos y usuarios de prueba.

### Modified Capabilities
- `solicitud-service`: Modificar payloads y mapeos del JSON antiguo al nuevo modelo de Prisma.

## Approach

1. **Seeds**: Agregaremos un archivo `seed.sql` en la carpeta de base de datos que ejecute los `INSERT` que proveíste, y además agregaremos contraseñas hasheadas para 4 usuarios fijos (ej. rut 1-9 (Analista), 2-7 (Coord), 3-5 (Jefe), 4-3 (Ingreso)).
2. **Frontend Interceptor**: En Angular, inyectaremos un `HttpInterceptor` que lea el token de `localStorage` y lo mande en `Authorization: Bearer <token>`.
3. **Endpoint Refactor**: Cambiaremos la `environment.apiUrl` del frontend a `http://localhost:3001/api` y adaptaremos los modelos de las interfaces de TypeScript a la nueva respuesta del backend.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `BD/postgres/seeds.sql` | New | Script de carga de datos iniciales |
| `Frontend/src/environments/` | Modified | Apuntar variables de entorno a localhost:3001 |
| `Frontend/src/app/core/interceptors/` | New | Inyección de JWT en peticiones |
| `Frontend/src/app/services/` | Modified | Refactorización de servicios REST (Auth, Solicitud) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Incompatibilidad de modelos de datos (Frontend espera X, Backend manda Y) | High | Usar consola del navegador para debuggear el payload y adaptar las interfaces `.ts` de Angular. |
| CORS bloqueando peticiones en local | Low | Ya configurado en el backend, verificar en Angular proxies si aplica. |

## Rollback Plan

Mantener el código legacy del frontend en un branch separado (`legacy-backend`). Si la integración rompe la UI crítica, el equipo de diseño puede usar ese branch temporalmente con la API antigua mientras se repara `develop`.

## Dependencies

- API Node.js operativa (Completado en `asistec-api-bootstrap`).
- Base de datos PostgreSQL levantada en local.

## Success Criteria

- [ ] Se ejecuta el script de seed y la BD local contiene los catálogos y usuarios.
- [ ] El frontend compila sin errores.
- [ ] Es posible hacer login desde el formulario de Angular y recibir el JWT.
- [ ] Se pueden consumir catálogos y crear una solicitud exitosamente desde la UI hacia Node.js.
