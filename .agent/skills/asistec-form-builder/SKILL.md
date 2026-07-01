---
name: asistec-form-builder
description: >-
  Convierte registros de trazabilidad de laboratorio (Excel del sistema ASISTEC,
  formato R-PR-SVVM-M-*) en formularios Angular/Ionic estandarizados, y refactoriza
  formularios existentes para que todos sigan el mismo sistema de diseño y la misma
  estructura de datos. Úsala SIEMPRE que el usuario quiera: crear un formulario nuevo
  a partir de un Excel de trazabilidad; estandarizar, normalizar o "arreglar" un
  formulario de análisis microbiológico (S. Aureus, Salmonella, Enterobacterias,
  Coliformes, Mohos y Levaduras, E. coli NMP, confirmaciones, etc.); decidir qué
  campos deben ser tablas maestras del backend vs constantes del frontend; o cuando
  mencione "muestras y duplicado", "UFC/g", "NMP", "presencia/ausencia", "código de
  micropipeta/estufa", "ALI", "etapas del wizard", "form-card", o el sistema ASISTEC.
  Actívala incluso si el usuario solo adjunta un Excel de trazabilidad y pide "pásalo
  a formulario" o "mejóralo".
---

# ASISTEC Form Builder

Pipeline en **3 fases** para llevar un registro de trazabilidad (Excel) a un formulario
Angular/Ionic estandarizado, y para refactorizar formularios existentes al mismo estándar.

El laboratorio ASISTEC tiene una **familia** de análisis (S. Aureus, Salmonella,
Enterobacterias, Coliformes, Mohos y Levaduras, E. coli NMP, confirmaciones…). Todos
comparten el mismo "esqueleto" y solo cambian en el **bloque de resultados/cálculo**.
La meta es que cualquier formulario nuevo nazca estandarizado y los existentes converjan
a ese estándar, sin reinventar el diseño en cada uno.

## Cuándo NO asumir (regla central)

El error más caro es inventar estructura. **Nunca** decidas solo si un valor del Excel es
una tabla maestra, una constante o un campo libre. El procedimiento obligatorio:

> Para cada valor del Excel que parezca "opción + código" (estufas, micropipetas, baños,
> lotes de agar/caldo, instrumentos), **compáralo contra las tablas maestras conocidas**
> (`references/maestras.md`) y, si no calza con certeza, **pregúntale al usuario** si ese
> dato vive en la BD (tabla maestra), en el frontend (constante) o es captura libre.
> No avances con la generación hasta resolver las ambigüedades.

Ver el procedimiento completo de reconciliación en `references/maestras.md`.

---

## Las 3 fases

Trabaja una fase a la vez. Al cerrar cada fase, muestra el entregable y confirma antes de
seguir. No saltes a generar HTML sin haber cerrado Fase 1 y 2.

### Fase 1 — Análisis del Excel  → entregable: `analisis-<analisis>.md`

1. Lee la hoja de trazabilidad. Identifica:
   - **Cabecera**: título de trazabilidad, código de registro (`R-PR-SVVM-M-X-XX`),
     versión/fecha, Nº ALI.
   - **Secciones del esqueleto universal** (ver más abajo).
   - **Candidatos a tabla maestra**: todo lo que aparezca como "opción + código" o con
     marca de selección (`ü`, `√`). Lístalos sin clasificarlos todavía.
   - **Bloque de muestras**: confirma el invariante 1–5 muestras + 1 duplicado por ALI
     (columna marcada `1d`).
   - **Bloque de resultados/cálculo**: extrae las variables exactas que produce ESTE
     análisis (p. ej. `a, Ʃa, d, N, NE` para S. Aureus). Este bloque manda.
2. Marca cada candidato a maestra con su estado: `[maestra-conocida]`, `[maestra-nueva?]`,
   `[constante-frontend?]`, `[libre]`. Para los `?`, **pregunta** (regla central).
3. Detecta lo que rompe el esquema si es un refactor (checklist de normalización abajo).

### Fase 2 — Contrato / modelo  → entregable: `contrato-<analisis>.md`

Define, en este orden:
1. **Etapas del wizard** (numeradas, nombres consistentes). Una etapa por sección lógica;
   el cálculo va en su propia etapa al final.
2. **Form schema**: por cada campo → `formControlName` (convención `e<N>_camelCase`),
   tipo de control (input/select/date/time/radio), si es requerido, y de qué maestra
   se alimenta si aplica.
3. **Maestras consumidas**: lista de `lista*` que el componente necesita inyectar
   (nombres normalizados, ver `references/maestras.md`).
4. **Esquema de cálculo**: variables de entrada (recuentos por placa/dilución) y de salida
   (resultado final + unidad), según `references/calculo-por-analisis.md`.

### Fase 3 — Frontend  → entregables: `.page.html`, `.page.scss`, `-routing.module.ts`

Genera el formulario usando EXCLUSIVAMENTE el sistema de diseño canónico
(`references/design-system.md`). No inventes clases nuevas ni estilos inline salvo los
utilitarios Tailwind ya usados. El SCSS es prácticamente compartido entre formularios:
reutilízalo tal cual y solo añade lo específico del análisis.

---

## Esqueleto universal (todas las trazabilidades)

Respeta este orden. Algunos análisis omiten secciones, pero ninguno las reordena.

1. **Inicio Incubación / Término Análisis** — fecha · hora · analista (de `listaResponsables`).
2. **Siembra / Insumos** — agar o caldo + lote (maestra de lotes), estufas/baños (maestra
   de equipos), micropipetas (maestra de instrumentos). Aquí vive el patrón "opción + código".
3. **Controles de Calidad en ALI** — Duplicado · Control (+) y Blanco · Control de Siembra,
   cada uno con estado **Cumple / No Cumple** (patrón radio + badge, NO un `<select>`).
4. **Bloque de muestras** — 1–5 muestras + 1 duplicado (columna `1d`).
5. **Bloque de resultados/cálculo** — específico del análisis (ver reference).
6. **Conclusión** — Desfavorable SI/NO · Tabla/Página · Límite · Fecha-hora de entrega.

---

## Patrón "opción + código"

En el Excel se ve como una etiqueta con su código y un visto (`Estufa 2-M (35.5±0.5°C) ✓`,
`Micropipetas 1ml: 22-M 23-M …`). Significa **seleccionar un ítem de una tabla maestra**,
nunca escribirlo a mano. Implementación canónica: un `<select class="form-select">` con
`*ngFor` sobre la `lista*` correspondiente y `[ngValue]` al id de la maestra. El código se
muestra como parte del label (`{{ item.codigo }} - {{ item.nombre }}`), **no** como un
input de texto paralelo. Si encuentras un input manual de "código" duplicando una maestra
(p. ej. `e1_codigoMicropipeta`), elimínalo y deja solo el select.

Snippet exacto en `references/design-system.md` → sección "Opción + código".

---

## Invariante de muestras (1–5 + duplicado)

Toda trazabilidad maneja **hasta 5 muestras + 1 duplicado** del ALI. El duplicado referencia
la Muestra 1 (marca `1d`) y, idealmente, importa sus datos de un ALI anterior por código.
Renderiza como `tabla-submuestras` (columnas: M1 · Duplicado · M2 · M3 · M4 · M5) o como
tarjetas por muestra cuando el cálculo es denso (caso S. Aureus). El layout por muestra es
idéntico; solo cambian los datos. Ver `references/design-system.md` → "Tabla de muestras".

---

## Bloque de resultados por análisis

Es lo que diferencia un formulario de otro y **lo más importante** del registro. Cada análisis
produce su propio set de variables y unidad:

- S. Aureus → `a, Ʃa, d, N, NE` en UFC/g (NCh 2671)
- Enterobacterias → `b, a, Ʃa, d, n1, n2, m, RE, REES` en UFC/g (NCh 2676)
- Coliformes / E. coli → NMP (NCh 2635)
- Salmonella → Presencia / Ausencia por agar (cualitativo)

Detalle de variables, fórmulas y cómo agregar un análisis nuevo: `references/calculo-por-analisis.md`.

---

## Checklist de normalización (modo refactor)

Al refactorizar un formulario existente, corrige estos desvíos detectados en el código actual:

- Selects con `class="form-input"` → deben ser `class="form-select"`.
- "Cumple / No Cumple" como `<select>` hardcodeado → patrón **radio + badge**
  (`badge-presencia` / `badge-ausencia`).
- Selects con opciones hardcodeadas que corresponden a una maestra → reemplazar por `*ngFor`
  sobre la `lista*` (previa reconciliación de la regla central).
- Inputs de texto manuales que duplican una maestra (código de micropipeta/estufa) → eliminar.
- Nombres de maestras inconsistentes (`listaResponsable` vs `listaResponsables`,
  `listaEstufas` vs `listaEquiposIncubacion`) → normalizar según `references/maestras.md`.
- Títulos de etapa inconsistentes (unos numerados, otros no) → numerar todos `N. Título`.
- `[disabled]="modoLectura"` en controles → usar el patrón de solo-lectura del design system
  (`.input-locked` / `readonly`) en vez de `disabled`, para no perder el valor en el submit.

---

## Convenciones de salida

- Carpeta por formulario: `form-<analisis>/` con `form-<analisis>.page.html`,
  `form-<analisis>.page.scss`, `form-<analisis>-routing.module.ts`.
- `formControlName`: `e<etapa>_camelCase` (p. ej. `e1_horaSiembra`).
- Reutiliza el SCSS canónico; no dupliques tokens de color, defínelos una vez.
- Idioma de UI: español (es-CL). Comentarios de código, en español.

---

## Archivos de referencia

Léelos cuando los necesites, no todos de entrada:

- `references/design-system.md` — tokens de color, catálogo de clases y snippets HTML
  canónicos (form-card, control-card, opción+código, cumple/no-cumple, tabla de muestras,
  resultados, stepper, footer). **Léelo siempre antes de generar HTML/SCSS (Fase 3).**
- `references/calculo-por-analisis.md` — variables y fórmulas del bloque de resultados por
  análisis, y receta para agregar uno nuevo. **Léelo en Fase 1 y 2.**
- `references/maestras.md` — catálogo de tablas maestras, convención de nombres y el
  procedimiento de reconciliación (BD vs frontend). **Léelo en Fase 1.**
