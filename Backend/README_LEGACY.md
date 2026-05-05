# ADVERTENCIA: Backend Legacy

**Este directorio contiene el backend DEPRECATED del proyecto AssisTec.**

No uses este backend para desarrollo nuevo. Esta aqui como referencia historica y porque el nuevo backend aun depende de algunas de sus tablas via bridge Prisma.

---

## Backend activo

El backend activo es `AssisTec API/`:
- Node.js + Express 5
- Prisma 6 como ORM (no SQL directo)
- Puerto 3001
- Arquitectura en capas: Routes → Controllers → Services → Repositories

Para levantar el proyecto, seguir `docs/environment-setup.md` desde la raiz.

---

## Por que existe este directorio

- Fue el backend original del proyecto (Express + pg directo, puerto 3000).
- El nuevo backend (`AssisTec API/`) fue desarrollado en paralelo con Prisma.
- Las tablas legacy (TPA, RAM, MUESTRAS_ALI) aun son accedidas por el nuevo backend via `@@map` en el schema Prisma.
- Se conserva para entender la logica original y como referencia en caso de regresion.

---

## Problemas conocidos (auditoria marzo 2026)

1. `.env.example` documenta variables con nombres incorrectos (`DB_NAME`, `DB_PASSWORD`), pero el codigo lee `NOMBRE_DB` y `MI_CLAVE_POSTGRES`.
2. Funcion `obtenerReporteRAM` duplicada en `models/reporteRAMModel.js`.
3. Endpoint de upload de imagenes sin autenticacion.
4. Ruta `/AsisTec/Exportar` con mayuscula en el backend vs `/AsisTec/exportar` en el frontend — falla en Linux (produccion).
5. `CORS_ORIGIN` vacio si no esta definido en `.env` — bloquea todos los requests del browser.

Para el detalle completo, ver `docs/architecture.md`.
