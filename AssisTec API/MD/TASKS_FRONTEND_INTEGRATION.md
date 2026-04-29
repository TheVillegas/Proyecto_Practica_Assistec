# Tasks: frontend-integration

## Phase 1: Base de Datos & Configuración Base

- [x] 1.1 Crear `BD/postgres/seeds.sql` con los sentencias `INSERT` originales provistas por el usuario para todos los catálogos.
- [x] 1.2 Añadir al final de `BD/postgres/seeds.sql` el script de `INSERT INTO usuarios` con 4 usuarios prueba pre-hasheados mediante `bcrypt` ("123456"): Rol 0 (Analista), Rol 1 (Coordinadora), Rol 2 (Jefe de Área), Rol 3 (Ingreso).
- [x] 1.3 Modificar `Frontend/src/environments/environment.ts` (y `environment.prod.ts`) actualizando `apiUrl` hacia `http://localhost:3001/api`.

## Phase 2: Core Auth & Interceptors (Angular)

- [x] 2.1 Modificar `Frontend/src/app/services/auth.service.ts`: cambiar método `login()` para realizar POST a `/api/auth/login` y extraer `response.token`.
- [x] 2.2 Modificar `Frontend/src/app/services/auth.service.ts`: agregar métodos `getToken()`, `saveToken(token)`, `clearToken()`.
- [x] 2.3 Crear `Frontend/src/app/interceptors/jwt.interceptor.ts`: implementar `HttpInterceptor` que lea `AuthService.getToken()` y clone el request añadiendo el header `Authorization: Bearer <token>`.
- [x] 2.4 Modificar `Frontend/src/app/app.module.ts`: proveer `JwtInterceptor` en el arreglo de `providers` mediante `HTTP_INTERCEPTORS`.

## Phase 3: Integración de Módulos (Angular)

- [x] 3.1 Modificar `Frontend/src/app/services/solicitud.service.ts`: adaptar tipado del payload de creación de solicitud para que haga match con el `Req` de Prisma (ej: remover campos legacy).
- [x] 3.2 Modificar `Frontend/src/app/services/solicitud.service.ts` y/o catálogo services para apuntar a la ruta genérica `GET /api/catalogo/:tipo`.

## Phase 4: Verificación y Pruebas Manuales

- [ ] 4.1 Levantar backend localmente (`npm run dev`) y correr `psql` para inyectar `seeds.sql`.
- [ ] 4.2 Levantar frontend (`ionic serve` o `ng serve`).
- [ ] 4.3 Loguearse en la UI con credenciales del usuario Rol Ingreso y observar Application Storage para comprobar almacenamiento del JWT.
- [ ] 4.4 Navegar a crear solicitud y comprobar en la pestaña Network del navegador que la petición GET de catálogos lleva el header `Bearer Token`.
- [ ] 4.5 Enviar formulario de solicitud y validar que la respuesta devuelva el nuevo `numero_ali`.
