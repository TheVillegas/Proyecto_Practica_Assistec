# Tablas maestras y reconciliación

El laboratorio tiene tablas maestras (catálogos en BD) que el formulario consume vía `lista*`.
Muchos valores que en el Excel parecen texto suelto (estufas, micropipetas, lotes) **deben**
salir de una maestra, no escribirse a mano. Esta referencia define el catálogo, la convención
de nombres y el procedimiento para decidir, sin asumir, qué va a BD y qué al frontend.

## Catálogo confirmado de maestras
Estas SÍ son tablas maestras del backend (confirmado con el usuario):

| Concepto | Variable Angular | Binding / label típico |
|---|---|---|
| Responsables / Analistas | `listaResponsables` | `[value]="r.rut"` → `{{ r.nombreApellido }}` |
| Equipos de incubación (estufas) | `listaEquiposIncubacion` | `[ngValue]="eq.idIncubacion"` → `{{ eq.nombreEquipo }}` |
| Baños térmicos | `listaBanos` | `[ngValue]="b.idBano"` → `{{ b.nombreEquipo }}` |
| Micropipetas / instrumentos | `listaPipetas` | `[ngValue]="p.idPipeta"` → `{{ p.codigoPipeta }} - {{ p.nombrePipeta }}` |
| Lotes de reactivo (agar/caldo) | `listaLotesReactivo` | `[value]="lote.idLoteReactivo"` → `{{ lote.codigoLote }}` |
| Medios de cultivo (agares/caldos) | `listaMediosCultivo` | `[ngValue]="m.idMedioCultivo"` → `{{ m.nombre }}` |
| Materiales de siembra (puntas, pipetas desechables) | `listaMaterialSiembra` | `[ngValue]="ms.idMaterialSiembra"` → `{{ ms.nombreMaterial }}` |

Notas:
- **Estufas y Baños son DOS maestras distintas** (`listaEquiposIncubacion` y `listaBanos`,
  tablas `equipos_incubacion` y `banos_termicos`), pese a jugar un rol similar (incubación).
  Excepción confirmada explícitamente con el usuario en el rediseño de Salmonella
  (2026-07-01): las estufas ya existían como su propio concepto en el sistema, por lo que
  Baños se modeló como tabla propia en vez de sumarse como filas de `equipos_incubacion`.
  Cuando un formulario ofrezca elegir equipo de incubación y el Excel muestre baños como
  alternativa a una estufa (p. ej. Selenito en Salmonella), renderiza dos `<select>`
  independientes y opcionales, uno por maestra — no un combo único.
- Las micropipetas de 1 ml y de 10 ml comparten maestra `listaPipetas` (distinguir por atributo,
  no por dos listas separadas).
- `listaMediosCultivo` y `listaMaterialSiembra` ya existen en BD (usadas por Enterobacterias,
  S. Aureus y Coliformes) pero no estaban documentadas aquí; se agregan en el rediseño de
  Salmonella (2026-07-01) para que el catálogo quede completo.

## Convención de nombres (normalización)
Unifica nombres inconsistentes encontrados en los formularios actuales:
- `listaResponsable` (singular) → **`listaResponsables`**.
- `listaEstufas` → **`listaEquiposIncubacion`**.
- Listas ad-hoc de etapas (`listaInicio`, `listaTermino`, `listaLectura`, `listaTraspaso`,
  `listaPrueba`, `listaLecturaCaldos`, `listaLecturaAPT`, `listaTraspasoAgares`…): son la
  **misma** maestra de responsables filtrada por momento. Preferir `listaResponsables` única
  y, si se necesita el momento, modelarlo como atributo, no como N listas distintas.
- Plural y `camelCase` para todas las `lista*`.

## Procedimiento de reconciliación (NO asumir)
Para cada valor del Excel que parezca "opción + código" o tenga marca de selección (`ü`, `√`):

1. **¿Calza con una maestra del catálogo confirmado?**
   - Sí, con certeza → usar el `lista*` correspondiente (select sobre maestra).
2. **¿No calza, o no estás seguro?** → **PREGUNTA** al usuario, ofreciendo 3 destinos:
   - **BD / tabla maestra existente** → ¿cuál? (se mapea a su `lista*`).
   - **BD / tabla maestra nueva** → proponer nombre `lista*` y campos (id, código, nombre…).
   - **Constante del frontend** → valor fijo no editable (p. ej. un rango de temperatura que
     siempre acompaña a un equipo y no se gestiona aparte).
   - **Captura libre** → input de texto que el analista llena cada vez.
3. No generes el formulario hasta resolver TODOS los `?`. Deja constancia de cada decisión en
   `analisis-<analisis>.md` (columna "destino").

Regla de oro: ante la duda entre maestra y constante, **siempre comparar primero contra las
maestras existentes y consultar**. Es preferible una pregunta extra a inventar un campo libre
que después rompe la integridad de los datos.

## Mini-formato para listar candidatos (Fase 1)
```
| Valor en Excel            | Sección   | Destino propuesto              | Estado    |
|---------------------------|-----------|--------------------------------|-----------|
| Estufa 2-M (35.5±0.5°C)   | Siembra   | listaEquiposIncubacion         | confirmar |
| Micropipeta 22-M          | Siembra   | listaPipetas                   | confirmar |
| Agar Baird Parker (lote)  | Siembra   | listaLotesReactivo             | confirmar |
| Tween 80                  | Siembra   | ¿constante o lote?             | PREGUNTAR |
```
