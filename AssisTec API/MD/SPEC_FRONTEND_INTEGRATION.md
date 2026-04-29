# Especificaciones de Integración Frontend (Delta Spec)

## ADDED Requirements

### Requirement: frontend-auth-jwt (Autenticación Angular)

El frontend de Angular MUST comunicarse con el nuevo endpoint `/api/auth/login` y MUST almacenar de forma segura el token JWT recibido para su posterior uso en todas las llamadas autenticadas hacia el backend Node.js.

#### Scenario: Login Exitoso y Almacenamiento de Token
- GIVEN que el usuario se encuentra en la pantalla de Login
- WHEN ingresa credenciales válidas y hace click en "Entrar"
- THEN el frontend almacena el JWT en el `localStorage` (o capacitor storage)
- AND redirige al usuario a su dashboard principal correspondiente a su rol.

#### Scenario: Intercepción HTTP
- GIVEN que el usuario tiene una sesión activa (token válido en storage)
- WHEN realiza cualquier petición HTTP mediante los servicios de Angular (ej: GET `/api/catalogo`)
- THEN el `JwtInterceptor` adjunta el header `Authorization: Bearer <token>` automáticamente.
- AND si el token expiró (backend devuelve 401), el interceptor purga la sesión y redirige al Login.

---

### Requirement: local-db-seeding (Datos Maestros Locales)

El backend MUST contar con un script de inserción SQL (`seeds.sql`) que alimente las tablas maestras de la base de datos (Diluyentes, Equipos, Instrumentos, etc.) y provea un set de usuarios predeterminados para asegurar la operatividad de los roles sin dependencia externa.

#### Scenario: Inicialización de Entorno Local
- GIVEN una base de datos PostgreSQL vacía pero con esquema Prisma sincronizado
- WHEN el desarrollador ejecuta el script `seeds.sql`
- THEN la base de datos se puebla con los catálogos provistos
- AND se insertan 4 usuarios pre-definidos: Ingreso, Analista, Coordinadora y Jefe de Área (con sus contraseñas hasheadas y Ruts asociados).

---

## MODIFIED Requirements

### Requirement: solicitud-service (Adaptación Payload Prisma)

El servicio `SolicitudService` de Angular MUST ser adaptado para enviar los payloads de creación y lectura alineados al nuevo formato de respuesta JSON del backend Node.js, abandonando la estructura del legacy.
*(Previously: El servicio se comunicaba mediante un bridge asíncrono y devolvía arrays planos no anidados).*

#### Scenario: Envío de Formulario Nueva Solicitud
- GIVEN que el rol Ingreso llena el formulario de nueva solicitud
- WHEN presiona guardar
- THEN Angular emite un HTTP POST a `/api/solicitud` con los Ids normalizados de categoría y cliente
- AND recibe el `id_solicitud` y `numero_ali` asignados para la creación del batch de submuestras.

#### Scenario: Lectura de Catálogos Dinámicos
- GIVEN que un componente de formulario necesita llenar un `<select>` (ej: Equipos Lab)
- WHEN inicializa el componente (`ngOnInit`)
- THEN el servicio consume GET `/api/catalogo/equipos_lab`
- AND renderiza la lista usando las keys exactas del nuevo JSON (`idEquipo` en lugar del ID antiguo).
