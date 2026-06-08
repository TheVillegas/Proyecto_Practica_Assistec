# Propuesta Visual — Fase 5: Cálculo de Resultados S. aureus

> Documento no técnico para revisión con supervisora.
> El diseño técnico detallado está en `design.md` (mismo directorio).

---

## 1. Reglas de Negocio (lenguaje simple)

### ¿Qué hace la Fase 5?

Es la pantalla donde el analista **ingresa los datos de las placas** y el sistema **calcula automáticamente** las UFC/g de S. aureus, usando el mismo método ISO 7218 que ya usamos para RAM pero con pasos extra de confirmación por coagulasa.

### Flujo por muestra

```
① El analista cuenta colonias en las placas → ingresa dilución y recuento
       │
       ▼
② De esas colonias, selecciona cuántas va a confirmar
       │
       ▼
③ Hace prueba de coagulasa a las 4-6 horas → anota cuántas dieron positivo
       │
       ▼
④ Vuelve a las 24 horas → anota cuántas más dieron positivo
       │
       ▼
⑤ Sistema calcula:
   • Ratio = colonias confirmadas ÷ colonias seleccionadas
   • Aplica ese ratio al recuento original
   • Calcula UFC/g según ISO 7218
   • Si ningún tiempo dio positivo → SD (Sin Desarrollo)
```

### Regla del Duplicado

El duplicado en S. aureus **NO es una siembra duplicada**. Es un **dato histórico**:

- En el Excel actual aparece como *"Duplicado ALI 5"* — significa que hay que ir a buscar los datos de la Muestra 1 de ese ALI pasado.
- El sistema debe permitir **seleccionar un ALI anterior** y **auto-importar** los datos de su Muestra 1.
- El analista puede editar manualmente si necesita corregir algo.

### ¿Qué pasa si no hay desarrollo?

Si a las 24h y 48h no se observan colonias características → se salta toda la confirmación y coagulasa → el resultado es **SD** (Sin Desarrollo). Esto ya se maneja en etapas anteriores; la Fase 5 solo procesa lo que llegó con datos.

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
│  │  Confirmación                                         │    │
│  │  ┌──────────────┬─────────┬─────────┐                │    │
│  │  │              │ Placa A │ Placa B │                │    │
│  │  ├──────────────┼─────────┼─────────┤                │    │
│  │  │ A confirmar  │   15    │   10    │                │    │
│  │  │ Coagulasa 4h │   12    │    8    │                │    │
│  │  │ Coagulasa 24h│    3    │    2    │                │    │
│  │  └──────────────┴─────────┴─────────┘                │    │
│  │                                                       │    │
│  │  Resultados del cálculo                               │    │
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │  a (suma placas):    58                     │     │    │
│  │  │  Ʃa (total):         58                     │     │    │
│  │  │  d (dilución):       0,01  (10⁻²)           │     │    │
│  │  │  ─────────────────────────────────────      │     │    │
│  │  │  N S. Aureus:        1,9 x 10⁴ UFC/g   ✓   │     │    │
│  │  │  NE S. Aureus:       1,9 x 10⁴ UFC/g       │     │    │
│  │  │  ─────────────────────────────────────      │     │    │
│  │  │  4h: 1,9 x 10⁴   ·   24h: SD               │     │    │
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
│  │  │  4h: SD  ·  24h: SD                         │     │    │
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
│  │  Confirmar: PA: 15  │ PB: 10                     │    │
│  │  Coag 4h:  PA: 12  │ PB: 8                       │    │
│  │  Coag 24h: PA: 3   │ PB: 2                       │    │
│  │  ─────────────────────────────────────            │    │
│  │  a: 58  │  Ʃa: 58  │  d: 0,01                   │    │
│  │  N S. Aureus:  1,9 x 10⁴ UFC/g  (ref)           │    │
│  │  NE S. Aureus: 1,9 x 10⁴ UFC/g                  │    │
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
| **N S. Aureus** | Resultado final en UFC/g, aplicando el ratio de confirmación | `(Ʃa / (V × (n₁ + 0,1×n₂) × d)) × ratio_confirmación` |
| **NE S. Aureus** | Expresión alternativa del resultado (para informes con distinta norma) | Mismo cálculo pero con redondeo distinto si aplica |

### ¿Qué hace el botón "Calcular"?

1. Toma los datos de la muestra (diluciones, colonias, confirmación, coagulasa 4h y 24h)
2. Calcula el ratio de confirmación para cada tiempo
3. Aplica el ratio al recuento de colonias
4. Ejecuta el algoritmo ISO 7218 (clasificación por prioridades)
5. Devuelve: `a`, `Ʃa`, `d`, `n₁`, `n₂`, `N`, `NE` y el texto formateado
6. Si ambos tiempos (4h y 24h) dieron 0 confirmaciones → resultado = **SD**

---

## 4. Árbol de Decisión (para mostrar el flujo completo)

```
                    ┌──────────────────┐
                    │  ¿Hay colonias   │
                    │  en 24h o 48h?   │
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
    │ ¿Confirma por    │
    │ coagulasa?       │
    └────────┬─────────┘
             │
      ┌──────┴──────┐
      │ Sí           │ No (bajo umbral)
      ▼              ▼
  ┌──────────┐  ┌──────────────────┐
  │ Ingresa  │  │ Calculo directo  │
  │ colonias │  │ ISO 7218 sin     │
  │ a confir │  │ ajuste           │
  └────┬─────┘  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ Coagulasa 4-6h   │
  │ ¿positivo?       │
  └────────┬─────────┘
           │
    ┌──────┴──────┐
    │ Sí           │ No
    ▼              ▼
  ┌──────────┐  ┌──────────────────┐
  │ Ratio 4h │  │ Coagulasa 24h   │
  │ calcular │  │ ¿positivo?       │
  └────┬─────┘  └────────┬─────────┘
       │                 │
       │          ┌──────┴──────┐
       │          │ Sí           │ No
       │          ▼              ▼
       │    ┌──────────┐  ┌──────────────────┐
       │    │ Ratio 24h│  │  SD por          │
       │    │ calcular │  │  confirmación    │
       │    └────┬─────┘  └──────────────────┘
       │         │
       └────┬────┘
            ▼
    ┌──────────────────┐
    │ ¿Ambos SD?       │
    └────────┬─────────┘
             │
    ┌────────┴────────┐
    │ Sí               │ No
    ▼                  ▼
  ┌──────────┐  ┌──────────────────┐
  │ Resultado│  │ Tomar el mayor   │
  │ = SD     │  │ entre 4h y 24h   │
  └──────────┘  └──────────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  N = Ʃa /        │
              │  (V × n × d)     │
              │  × ratio         │
              └──────────────────┘
```

---

## 5. Reglas de UI (para que se vea limpio)

| Elemento | Comportamiento |
|---|---|
| Tarjetas de muestra | Colapsables/expandibles para no saturar la pantalla. Por defecto M1 expandida, las demás colapsadas. |
| Campos de resultado (`a`, `Ʃa`, `d`, `N`, `NE`) | **Solo lectura** — los calcula el sistema. El analista no los toca. |
| Inputs de recuento y confirmación | Editables. Si se cambia un valor, el resultado se marca como "desactualizado" hasta que se recalcula. |
| Botón "Calcular TODAS" | Ejecuta el cálculo para todas las muestras con datos en paralelo. |
| Duplicado | El selector de ALI busca solo ALIs que tengan datos de S. aureus. Si no hay datos, muestra advertencia. |
| Resultado SD | Se muestra con badge gris y texto "SD". No como cero. |

---

## 6. Preguntas pendientes para la supervisora

- [ ] **Umbral de confirmación**: ¿a partir de cuántas UFC/g se debe hacer confirmación por coagulasa? ¿O es decisión del analista siempre?
- [ ] **Expresión final**: cuando el resultado es `<10`, ¿se deja como `<10 UFC/g` o se usa otra expresión?
- [ ] **NE S. Aureus**: ¿se usa siempre o solo para ciertos mercados/destinos?
- [ ] **Resultado consolidado**: cuando hay múltiples muestras con resultado, ¿se informa el **máximo**, el **promedio** o **cada muestra por separado**?

---

> 📎 El detalle técnico (modelo de datos, endpoints, componentes) está en `design.md` en este mismo directorio.
