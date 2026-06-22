# Auditoría Sprint 1 — AssisTec Lab

> Documento de bugs conocidos, deuda técnica y observaciones para refinamiento.
> Generado: Junio 2026

---

## 🐛 Backend

### 1. Archivos TypeScript no cargables
**Archivos**: `calculador.base.ts`, `calculador.factory.ts`, `calculador-saureus.service.ts`, `import-duplicado.service.ts`
**Problema**: El backend usa CommonJS (`require()`) y `node app.js`. Estos `.ts` no pueden ejecutarse.
**Impacto**: Código muerto. La lógica de cálculo hubo que copiarla inline en `saureus-calculation.routes.js`.
**Solución**: Convertir a `.js` o eliminar.

### 2. Ruta duplicada
**Archivos**: `saureus-calculation.routes.ts` y `saureus-calculation.routes.js`
**Problema**: Coexisten ambas versiones. Solo la `.js` se usa.
**Solución**: Eliminar `saureus-calculation.routes.ts`.

### 3. Tests backend no ejecutables
**Problema**: Faltan `ts-jest` y configuración TypeScript en `AssisTec API/package.json`. Los tests `.ts` en `__tests__/` no pueden ejecutarse.
**Solución**: Agregar `ts-jest` y configurar jest.

### 4. Migración Prisma con shadow DB
**Problema**: `prisma migrate dev` falla porque la shadow DB no puede aplicar migraciones base. Solo funciona `prisma db push`.
**Solución**: Investigar shadow DB o migrar a `db push` como estándar.

---

## 🐛 Frontend

### 5. solicitud-ingreso.page.spec.ts bloquea todo el suite
**Archivo**: `Frontend/src/app/pages/solicitud-ingreso/solicitud-ingreso.page.spec.ts`
**Problema**: ~20 errores de TypeScript (métodos faltantes como `reviewMode`, `canTakeReviewAction`).
**Impacto**: **BLOQUEANTE** — impide ejecutar `ng test` y por ende correr los 48 tests nuevos de S. aureus.
**Solución**: Corregir los métodos faltantes o actualizar el spec.

### 6. Mock data sin reemplazar
- `solicitudAnalisisId` hardcodeado como `'current-id'` en `etapa5-calculo.component.ts`
- `cargarAliList()` con datos quemados
- `onEditar()` con solo `console.log`

### 7. ngModel dentro de formGroup
**Problema**: El componente `etapa5-calculo` está dentro de `<form [formGroup]="form">` del padre. Todos los `[(ngModel)]` requieren `[ngModelOptions]="{standalone: true}"`.
**Estado**: ✅ Corregido.

### 8. API devolvía estructura anidada
**Problema**: El endpoint devolvía `{muestraId, resultado}` pero el frontend esperaba `ResultadoCalculo` plano.
**Estado**: ✅ Corregido.

---

## 🏗️ Deuda Técnica

### 9. SDD artifacts desactualizados
Los specs/design/tasks no reflejan el estado actual del código después de las iteraciones de rediseño.

### 10. Sin CI/CD
No hay GitHub Actions para tests automáticos ni linting.

### 11. Docker entrypoint lento
Cada `docker compose restart` ejecuta migraciones + seeds completos.

### 12. size:exception activo
El cambio `saureus-phase5-calculation` excede 400 líneas. Se aprobó con `exception-ok`.

---

## 📋 Próximos Pasos (Refinamiento Mes 2)

| Prioridad | Tarea | Área |
|-----------|-------|------|
| 🔴 | Corregir `solicitud-ingreso.page.spec.ts` | Frontend Tests |
| 🔴 | Eliminar archivos TS muertos del backend | Backend |
| 🟡 | Reemplazar mock data (ALI list, solicitudAnalisisId) | Frontend |
| 🟡 | Agregar `ts-jest` al backend | Backend Tests |
| 🟢 | Limpiar `saureus-calculation.routes.ts` | Backend |
| 🟢 | Actualizar SDD artifacts | Documentación |
