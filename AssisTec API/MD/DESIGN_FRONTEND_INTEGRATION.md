# Design: frontend-integration

## Technical Approach

El objetivo técnico es doble:
1. **Poblar la Base de Datos Local**: A través de un script SQL (`seeds.sql`) que se debe ejecutar después de hacer `prisma migrate dev`, insertando los catálogos legacy en el formato que Prisma espera, junto con la creación de 4 usuarios con contraseñas hasheadas estáticas para la demostración de Auth en el frontend.
2. **Refactorización del Frontend**: Usar `environment.ts` para que Angular (Ionic) hable con el backend en Node (`http://localhost:3001/api`), reescribir el `AuthService` para recibir y almacenar el JWT emitido por la API de Node, e inyectar dicho JWT vía un `HttpInterceptor` (`jwt.interceptor.ts`).

## Architecture Decisions

### Decision: Almacenamiento Seguro del JWT
**Choice**: Usar Capacitor Storage o el nativo `localStorage` mediante un servicio en Angular.
**Alternatives considered**: Usar cookies HTTP-Only.
**Rationale**: Como esto es una app en Angular con Ionic (pensada para móvil/PWA), el manejo nativo de `localStorage` o el plugin de Storage de Capacitor es el estándar y evita las complicaciones de CORS y cookies en webviews de iOS/Android.

### Decision: Formato y Hasheo de Passwords de Prueba
**Choice**: Crear los usuarios en el script SQL (o Prisma Seed) insertando hashes generados previamente por `bcrypt` (ej. hash de la palabra "123456").
**Alternatives considered**: Insertar las claves en texto plano y hacer un endpoint especial que las encripte.
**Rationale**: Mantener la seguridad de la API intacta. El endpoint de login de Node.js ya utiliza `bcrypt.compare`, por lo tanto, la base de datos debe contener el hash válido desde el principio para que el sistema opere normalmente.

### Decision: Carga Inicial de Datos (Seeds)
**Choice**: Crear `BD/postgres/seeds.sql` e integrarlo en un npm script.
**Alternatives considered**: Usar el `seed.ts` de Prisma.
**Rationale**: El equipo ya cuenta con los `INSERT INTO` puros provenientes de la migración. Usar SQL directo es más rápido y compatible con las rutinas legacy que los desarrolladores ya conocen.

## Data Flow

```ascii
[Angular UI] ──> (AuthService) ──> POST /api/auth/login
                                          │
                                   [Node.js API] ──> Valida Bcrypt / Crea JWT
                                          │
[Angular Storage] <── Guarda JWT <────────┘
        │
        ▼
[JwtInterceptor] ──> Inyecta Header ──> (SolicitudService) ──> POST /api/solicitud
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `BD/postgres/seeds.sql` | Create | Archivo con sentencias `INSERT` para catálogos y usuarios fijos. |
| `Frontend/src/environments/environment.ts` | Modify | Cambiar variable `apiUrl` apuntando a `http://localhost:3001/api`. |
| `Frontend/src/app/interceptors/jwt.interceptor.ts` | Create | Interceptor HTTP que adosa `Authorization: Bearer <token>` si existe sesión. |
| `Frontend/src/app/app.module.ts` | Modify | Registrar y proveer el `JwtInterceptor`. |
| `Frontend/src/app/services/auth.service.ts` | Modify | Cambiar estructura del método `login()` para manejar el JWT devuelto por Node.js. |
| `Frontend/src/app/services/solicitud.service.ts` | Modify | Ajustar payloads y firmas de los métodos para alinear con la API Prisma. |

## Interfaces / Contracts

**Respuesta esperada del backend al hacer Login:**
```typescript
interface LoginResponse {
  token: string;
  usuario: {
    rut: string;
    nombre: string;
    rol: number;
    foto?: string;
  };
}
```

**Payload esperado del backend al POST `/api/solicitud`:**
```typescript
interface CrearSolicitudPayload {
  categoriaId: number;
  idCliente: number;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `JwtInterceptor` | Verificar que si hay token en `localStorage`, la petición clona el request e incluye el header. |
| Integration | `AuthService` | Verificar que el token se guarda tras un login exitoso. |
| E2E | Flujo de Login y Dashboards | Probar con el backend levantado que ingresar con Rut "1-9" permite ver el dashboard de Analista, mientras que "2-7" muestra el de Coordinadora. |

## Migration / Rollout

No se requiere migración estructural de base de datos. Solo ejecutar:
1. `npx prisma migrate dev`
2. `psql -U postgres -d asistec -f BD/postgres/seeds.sql` (o mediante DBeaver/PGAdmin).
Luego, arrancar el backend Node.js (`npm run dev`) y el frontend Angular (`npm start`).

## Open Questions

- [ ] ¿El equipo de UI requerirá que el JWT guarde más claims adentro, como la URL de la foto, o con lo que trae el body es suficiente para el Storage de la sesión?
- [ ] ¿Deseamos mover el archivo de `seeds.sql` al sistema nativo de `prisma/seed.ts` para que se auto-ejecute en los `migrate reset`?
