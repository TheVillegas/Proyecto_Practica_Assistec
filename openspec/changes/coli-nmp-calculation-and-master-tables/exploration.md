# Exploración: coli-nmp-calculation-and-master-tables

## Estado Actual

### Backend (AssisTec API/)

**Calculadora NMP existe y es real** (`AssisTec API/src/calculators/nmpColi.calculator.js`):
- Usa tabla McCrady estándar para diseño 3 diluciones × 3 tubos (3×3×3)
- `calcularNMP(tipoLectura, tubosPositivosPorDilucion)` — devuelve valor NMP/100ml único
- `calcularResultadosNMP({tubosPositivosTotales, tubosPositivosFecales, tubosPositivosEcoli})` — devuelve los 3
- La tabla McCrady es equivalente a ISO 7218 para MPN de 3 tubos; la fórmula Wilrich agrega SD/IC/rareza opcionales

**Backend de Coliformes completamente implementado:**
- `coliformes.service.js` (264 líneas): acceso por rol, guardia de progresión de fases, 5 fases (1, 2, 3, 3.5, 4)
- `_calcularResultadosFase4()`: cuenta submuestras presencia por dilución, llama `calcularResultadosNMP()`
- `guardarFase()`: upsert de cada fase con optimistic locking
- `coliformes.controller.js`: mapeo de errores, delega al servicio
- `coliformes.routes.js`: endpoints activos — `GET /:id`, `GET /por-analisis/:idAnalisis`, `PUT /:id/fase/:fase`

**Modelo Prisma completo** (`prisma/schema.prisma` líneas 687-851):
- `ColiFormulario` → `ColiMuestra` → `ColiFase1/2/3/35/4`
- `ColiFase3Submuestra` — almacena presencia (Boolean) por tipoLectura (totales/fecales/ecoli), dilución, numeroTubo
- `ColiFase4Resultado` — coliformesTotales, coliformesFecales, eColi (Decimal)
- Relaciones a `EquipoIncubacion`, `Micropipeta`, `Usuario` vía tablas de unión

**Tablas maestras con endpoints de catálogo:**
- `EquipoIncubacion`: idIncubacion, nombreEquipo, temperaturaRef → `GET /catalogo/equipos_incubacion`
- `Micropipeta`: idPipeta, nombrePipeta, codigoPipeta, capacidad → `GET /catalogo/micropipetas`
- `Usuario`: rutUsuario, nombreApellidoUsuario, rolUsuario → `GET /catalogo/usuarios` (filtrado por rol)

**Patrón de calculadoras (real):** Módulos CommonJS planos. Tres calculadoras:
- `nmpColi.calculator.js` — tabla McCrady
- `ufcSau.calculator.js` — UFC por prioridad de dilución (4 niveles)
- `presenciaSal.calculator.js` — OR booleano simple entre 8 lecturas de agar

### Frontend (Frontend/)

**form-coliformes.page.ts — COMPLETAMENTE MOCKEADO:**
- `calcularNMP()`: asigna valores hardcodeados (ct: "450", cf: "210", ecoli: "95") a TODAS las 7 muestras
- Sin llamadas HTTP, sin conectividad al backend
- `datosImportados` es una constante `MOCK_SOLICITUD`
- Las entradas se crean localmente con `crearEntradas()` — sin datos del servidor
- `enviarFormulario()`: muestra toast de éxito, navega a home — sin POST/PUT real

**form-coliformes.page.html — CATÁLOGOS HARDCODEADOS:**
- Estufas: radio buttons literales "Estufa 73-M" y "Estufa 2-M"
- Micropipetas: ngFor sobre arrays fijos ['22-M', '72-M', ...]
- Analistas: `<input>` de texto, tipeado manual
- Sin `<ion-select>` con opciones de catálogo en ninguna parte del formulario

**CatalogosService existe y está listo:**
- `getEquiposIncubacion()`, `getMicroPipetas()`, `getResponsables()` ya implementados
- Usado por `reporte-ram.page.ts`, `solicitud-ingreso.page.ts`, `validacion-solicitudes.page.ts`

**Patrón de carga de catálogos reutilizable** (de `reporte-ram.page.ts`):
```typescript
forkJoin({
  equiposIncubacion: this.catalogosService.getEquiposIncubacion(),
  pipetas: this.catalogosService.getMicroPipetas(),
  responsables: this.catalogosService.getResponsables(),
}).subscribe({ next: (res) => { this.listaEquiposIncubacion = res.equiposIncubacion; ... } });
```

## Hallazgos Clave

1. **El backend de coliformes ESTÁ completamente funcional** — servicio, controlador, rutas, calculadora y modelo Prisma existen. La brecha está únicamente en el frontend.

2. **La fórmula NMP ES real** en el backend — tabla McCrady (no Wilrich ISO 7218). McCrady es la implementación estándar para diseño MPN 3×3×3.

3. **No existe clase abstracta CalculadorBase** — la arquitectura usa módulos JS planos importados por los servicios.

4. **El frontend tiene cero integración con backend** — el formulario es un prototipo completo que necesita: servicio HTTP, carga de catálogos, y display de resultados NMP desde el servidor.

5. **Los catálogos de tablas maestras están listos** — endpoints del backend existen, CatalogosService del frontend tiene los métodos, y otras páginas ya demuestran el patrón exacto de integración.

## Áreas Afectadas

- `Frontend/src/app/pages/form-coliformes/form-coliformes.page.ts` — componente completo necesita integración con backend
- `Frontend/src/app/pages/form-coliformes/form-coliformes.page.html` — migrar radios hardcodeados a selects basados en catálogos
- `Frontend/src/app/services/` — puede necesitar nuevo `coliformes.service.ts` para llamadas API
- `Frontend/src/app/interfaces/` — puede necesitar interfaces específicas de coliformes

## Enfoques

1. **Integración solo frontend (Recomendado)** — Conectar formulario al backend existente. Cargar catálogos, enviar fases, obtener NMP real. Cero cambios en backend.
2. **Frontend con NMP local** — Duplicar tabla McCrady en frontend. Riesgo de divergencia lógica.
3. **Actualización completa ISO 7218/Wilrich** — Reemplazar McCrady con fórmula Wilrich. Esfuerzo alto, cambio separado.

## Recomendación

**Enfoque 1**: Integración solo frontend. Backend completo, catálogos servidos, calculadora NMP correcta. Cambio mínimo viable: servicio API + selects de catálogo + disparador NMP + flujo de guardado por fases + indicador de auto-guardado + botón borrador.

## Riesgos

- Desajuste de modelo de form controls (string vs array para estufas)
- Desajuste de nombres en fase 3.5 (frontend vs backend)
- Desajuste de cantidad de muestras (mocks locales vs registros ColiMuestra)

## Listo para Propuesta

Sí.
