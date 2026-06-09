# Propuesta Visual — Fase 5: Cálculo de Resultados S. aureus

> Documento no técnico para revisión con supervisora.
> El diseño técnico detallado está en `design.md` (mismo directorio).

---

## 1. Reglas de Negocio (lenguaje simple)

### ¿Qué hace la Fase 5?

Es la pantalla donde el analista **ingresa los datos validados del flujo S. aureus** y el sistema **calcula automáticamente** las UFC/g. La regla corregida es: desde las colonias posibles S. aureus se toman hasta 5 colonias características, luego se evalúa coagulasa a 4 hrs/24 horas, se calcula un recuento previo y ese valor alimenta la fórmula general.

### Flujo por muestra

```
① El analista cuenta colonias posibles S. aureus
       │
       ▼
② Toma hasta 5 colonias características para coagulasa
       │
       ▼
③ Hace coagulasa a las 4 hrs
   • Si sale positiva → se calcula altiro
   • Si no sale positiva → se espera hasta 24 horas
       │
       ▼
⑤ Sistema calcula:
   • Ratio = colonias coagulasa positivas ÷ colonias traspasadas
   • Colonias previas = ratio × colonias posibles S. aureus totales
   • Aplica la fórmula general con ese resultado previo
   • Si 4 hrs y 24 horas no dan positivo → SD por coagulasa
```

### Regla del Duplicado

El duplicado en S. aureus **NO es una siembra duplicada**. Es un **dato histórico**:

- En el Excel actual aparece como *"Duplicado ALI 5"* — significa que hay que ir a buscar los datos de la Muestra 1 de ese ALI pasado.
- El sistema debe permitir **seleccionar un ALI anterior** y **auto-importar** los datos de su Muestra 1.
- El analista puede editar manualmente si necesita corregir algo.

### ¿Qué pasa si no hay desarrollo?

Si a las 24 horas y 48 horas no se observan colonias características → se salta toda la confirmación y coagulasa → el resultado es **SD** (Sin Desarrollo). Esto ya se maneja en etapas anteriores; la Fase 5 solo procesa lo que llegó con datos.

---

## 2. Mockup Visual — Pantalla de Resultados

### Sección por muestra (M1 a M6)

Cada muestra se muestra en una tarjeta independiente. El layout es el mismo para todas, solo cambian los datos.

```
┌──────────────────────────────────────────────────────────────┐
│  ● 5. Resultados S. Aureus                                   │
│                                                              │
│  ┌───────────── MUESTRA 1 ──────────────────────────────┐    │
│  │                                                       │    │
│  │  Recuento                                             │    │
│  │  ┌──────┬─────────┬─────────┐                        │    │
│  │  │ Dil  │ Placa A │ Placa B │                        │    │
│  │  ├──────┼─────────┼─────────┤                        │    │
│  │  │ 10⁻² │   28    │   30    │   ← inputs editables   │    │
│  │  │ 10⁻³ │   —     │   —     │   ← opcional           │    │
│  │  └──────┴─────────┴─────────┘                        │    │
│  │                                                       │    │
│  │  Confirmación y coagulasa                             │    │
│  │  ┌──────────────┬─────────┬─────────┐                │    │
│  │  │              │ Placa A │ Placa B │                │    │
│  │  ├──────────────┼─────────┼─────────┤                │    │
│  │  │ A confirmar  │    3    │    2    │ ← máx. 5       │    │
│  │  │ Coag. 4 hrs  │    1    │    1    │ ← positivo     │    │
│  │  │ Coag. 24 h   │    —    │    —    │ ← no aplica    │    │
│  │  └──────────────┴─────────┴─────────┘                │    │
│  │                                                       │    │
│  │  Resultados del cálculo                               │    │
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │  a (suma placas):    58                     │     │    │
│  │  │  Ʃa (total):         58                     │     │    │
│  │  │  d (dilución):       0,01  (10⁻²)           │     │    │
│  │  │  ─────────────────────────────────────      │     │    │
│  │  │  Previas:            (2 ÷ 5) × 58 = 23,2  │     │    │
│  │  │  N S. Aureus:        1,2 x 10³ UFC/g   ✓   │     │    │
│  │  │  NE S. Aureus:       1,2 x 10³ UFC/g       │     │    │
│  │  │  ─────────────────────────────────────      │     │    │
│  │  │  Lectura usada: 4 hrs · 24 horas: no aplica │     │    │
│  │  └─────────────────────────────────────────────┘     │    │
│  │                                                       │    │
│  │  [🧮 Calcular muestra]                                │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌───────────── MUESTRA 2 ──────────────────────────────┐    │
│  │  (mismo layout, datos distintos)                      │    │
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │  a (suma placas):    0                      │     │    │
│  │  │  Ʃa:                 0                      │     │    │
│  │  │  d:                  —                      │     │    │
│  │  │  ─────────────────────────────────────      │     │    │
│  │  │  N S. Aureus:        SD                 ⚠  │     │    │
│  │  │  NE S. Aureus:       SD                     │     │    │
│  │  │  ─────────────────────────────────────      │     │    │
│  │  │  4 hrs: SD  ·  24 horas: SD                 │     │    │
│  │  └─────────────────────────────────────────────┘     │    │
│  │                                                       │    │
│  │  [🧮 Calcular muestra]                                │    │
│  └───────────────────────────────────────────────────────┘    │
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│  (M3, M4, M5, M6 — misma estructura)                       │
└──────────────────────────────────────────────────────────────┘
```

### Sección Duplicado (referencia a ALI pasado)

```
┌───────────── DUPLICADO (Referencia a ALI anterior) ──────┐
│                                                           │
│  ALI de referencia:  [ALI-2025-00421  ▼]                 │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Datos importados de Muestra 1 del ALI-421       │    │
│  │                                                   │    │
│  │  Recuento:  Dil -2  │ PA: 28 │ PB: 30            │    │
│  │  Posibles S.a: PA: 28 │ PB: 30                   │    │
│  │  A confirmar: PA: 3  │ PB: 2   (máx. 5)          │    │
│  │  Coag 4 hrs: PA: 1 │ PB: 1  · 24 horas: no aplica│    │
│  │  ─────────────────────────────────────            │    │
│  │  a: 58  │  Ʃa: 58  │  d: 0,01                   │    │
│  │  Previas: 23,2                                  │    │
│  │  N S. Aureus:  1,2 x 10³ UFC/g  (ref)           │    │
│  │  NE S. Aureus: 1,2 x 10³ UFC/g                  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
│  [🔄 Re-importar]  [✏️ Editar manualmente]                │
└───────────────────────────────────────────────────────────┘
```

### Resumen Consolidado (visible en Etapa 6)

Cuando ya están todas las muestras calculadas, la Etapa 6 muestra el consolidado:

```
┌──────────────────────────────────────────────────────┐
│  RESULTADOS POR MUESTRA                               │
│                                                       │
│  ┌──────┬──────────────────────┬──────────┐          │
│  │  M1  │  1,9 x 10⁴ UFC/g    │  ✓       │          │
│  │  M2  │  SD                  │  —       │          │
│  │  M3  │  9,2 x 10³ UFC/g    │  ✓       │          │
│  │  M4  │  < 10 UFC/g         │  ⚠       │          │
│  │  M5  │  4,5 x 10⁴ UFC/g    │  ✓       │          │
│  │  M6  │  SD                  │  —       │          │
│  │  DUP │  1,9 x 10⁴ UFC/g    │  ref     │          │
│  ├──────┼──────────────────────┼──────────┤          │
│  │      │  Máximo: 4,5 x 10⁴  │          │          │
│  │      │  UFC/g              │          │          │
│  └──────┴──────────────────────┴──────────┘          │
│                                                       │
│  Desfavorable:  [Sí] / [No]    según normativa       │
│  Límite:        [______________]                      │
│  Tabla/Página:  [______________]                      │
│  Fecha entrega: [____]  Hora: [____]                  │
└──────────────────────────────────────────────────────┘
```

---

## 3. Explicación de los campos de resultado

| Campo | Qué significa | Cómo se calcula |
|---|---|---|
| **a** | Suma de colonias contadas en las placas seleccionadas de la dilución óptima | Placa A + Placa B (ej: 28 + 30 = 58) |
| **Ʃa** | Sumatoria total de colonias considerando todas las placas óptimas de todas las diluciones | Si hay 1 dilución: Ʃa = a. Si hay 2 diluciones: Ʃa = suma de ambas |
| **d** | Factor de dilución usado para el cálculo | 10 elevado a la -|dilución| (ej: 10⁻² = 0,01) |
| **n₁** | Número de placas contables en la primera dilución | 1 o 2 placas |
| **n₂** | Número de placas contables en la segunda dilución | 0, 1 o 2 placas |
| **Colonias previas** | Recuento ajustado antes de aplicar la fórmula general | `(coagulasa positivas ÷ colonias traspasadas) × colonias posibles S. aureus totales` |
| **N S. Aureus** | Resultado final en UFC/g, usando las colonias previas | `colonias_previas / (V × (n₁ + 0,1×n₂) × d)` |
| **NE S. Aureus** | Expresión alternativa del resultado (para informes con distinta norma) | Mismo cálculo pero con redondeo distinto si aplica |

### ¿Qué hace el botón "Calcular"?

1. Toma los datos de la muestra: colonias posibles S. aureus, colonias características traspasadas y coagulasa.
2. Valida que las colonias traspasadas para coagulasa no superen 5.
3. Si coagulasa 4 hrs tiene positivos, usa esa lectura y no espera 24 horas para calcular.
4. Si coagulasa 4 hrs no tiene positivos, usa la lectura 24 horas.
5. Calcula `colonias_previas = (coagulasa positivas ÷ colonias traspasadas) × colonias posibles S. aureus totales`.
6. Ejecuta la fórmula general con ese recuento previo.
7. Si 4 hrs y 24 horas dieron 0 positivos → resultado = **SD** por coagulasa.

---

## 4. Árbol de Decisión (para mostrar el flujo completo)

```
                    ┌──────────────────┐
                    │  ¿Hay colonias   │
                    │  en 24 h o 48 h? │
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              │ Sí                           │ No
              ▼                              ▼
    ┌──────────────────┐          ┌──────────────────┐
    │ Ingresa dilución │          │  SD (Sin         │
    │ y recuento       │          │  Desarrollo)     │
    │ Placa A y B      │          │  → Fin           │
    └────────┬─────────┘          └──────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Tomar hasta 5    │
    │ colonias caract. │
    └────────┬─────────┘
             │
      ┌──────┴──────┐
      │ Válido       │ > 5
      ▼              ▼
  ┌──────────┐  ┌──────────────────┐
  │ Coagulasa│  │ Corregir selección│
  │ 4 hrs    │  │ antes de calcular │
  └────┬─────┘  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
   │ Coagulasa 4 hrs  │
  │ ¿positivo?       │
  └────────┬─────────┘
           │
    ┌──────┴──────┐
    │ Sí           │ No
    ▼              ▼
  ┌──────────┐  ┌──────────────────┐
   │ Usar 4hrs│  │ Coagulasa 24 h  │
   │ altiro   │  │ ¿positivo?       │
  └────┬─────┘  └────────┬─────────┘
       │                 │
       │          ┌──────┴──────┐
       │          │ Sí           │ No
       │          ▼              ▼
        │    ┌──────────┐  ┌──────────────────┐
        │    │Usar 24 h│  │  SD por          │
        │    │          │  │  coagulasa       │
       │    └────┬─────┘  └──────────────────┘
       │         │
       └────┬────┘
            ▼
    ┌──────────────────┐
    │ Calcular previas │
    └────────┬─────────┘
             │
             │
             ▼
    ┌──────────────────┐
    │ previas =        │
    │ positivas /      │
    │ confirmadas ×    │
    │ posibles S.a     │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Fórmula general  │
    │ con previas      │
    └──────────────────┘
```

---

## 5. Reglas de UI (para que se vea limpio)

| Elemento | Comportamiento |
|---|---|
| Tarjetas de muestra | Colapsables/expandibles para no saturar la pantalla. Por defecto M1 expandida, las demás colapsadas. |
| Campos de resultado (`a`, `Ʃa`, `d`, `N`, `NE`) | **Solo lectura** — los calcula el sistema. El analista no los toca. |
| Inputs de recuento y confirmación | Editables. La toma para coagulasa debe permitir máximo 5 colonias características. Si se cambia un valor, el resultado se marca como "desactualizado" hasta que se recalcula. |
| Coagulasa 24 horas | Se habilita solo si la lectura de 4 hrs no fue positiva. |
| Botón "Calcular TODAS" | Ejecuta el cálculo para todas las muestras con datos en paralelo. |
| Duplicado | El selector de ALI busca solo ALIs que tengan datos de S. aureus. Si no hay datos, muestra advertencia. |
| Resultado SD | Se muestra con badge gris y texto "SD". No como cero. |

---

## 6. Preguntas pendientes para la supervisora

- [ ] **Expresión final**: cuando el resultado es `<10`, ¿se deja como `<10 UFC/g` o se usa otra expresión?
- [ ] **NE S. Aureus**: ¿se usa siempre o solo para ciertos mercados/destinos?
- [ ] **Resultado consolidado**: cuando hay múltiples muestras con resultado, ¿se informa el **máximo**, el **promedio** o **cada muestra por separado**?

---

> 📎 El detalle técnico (modelo de datos, endpoints, componentes) está en `design.md` en este mismo directorio.
