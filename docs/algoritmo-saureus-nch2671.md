# Algoritmo de Recuento de S. aureus — NCh 2671.Of2002

**Sistema:** AssisTec API  
**Módulo:** Análisis microbiológico — Fase 5 (Cálculo de resultado)  
**Norma:** NCh 2671.Of2002 — Microbiología de alimentos, método de recuento de *Staphylococcus aureus* coagulasa positiva

---

## 1. Fundamento del método

El método cuantifica las colonias presuntivas de *S. aureus* en agar Baird-Parker (etapa 1), selecciona una cantidad representativa para traspasar al caldo BHI (etapa 3), y confirma cuántas son realmente *S. aureus* mediante la prueba de coagulasa (etapa 4).

El resultado final se expresa en **UFC/g** (Unidades Formadoras de Colonias por gramo).

---

## 2. Variables del modelo

| Símbolo | Nombre | Descripción |
|---|---|---|
| C | Colonias presuntivas | Recuento de colonias en agar Baird-Parker (se prefiere lectura 48 h; si no hay, se usa 24 h) |
| A | Colonias a confirmar | Cantidad traspasada al tubo de coagulasa por placa (máximo **5** por placa) |
| b | Colonias confirmadas | `coag4a6h + coag24h` — suma incremental (no excluyente) |
| n₁ | Placas dilución 1 | Número de placas de la dilución más concentrada |
| n₂ | Placas dilución 2 | Número de placas de la segunda dilución (si se usa) |
| d | Factor de dilución | `10^(−|dil|)` — por ejemplo dil=2 → d=0,01 |
| V | Volumen inoculado | mL por placa (por defecto 1 mL) |

---

## 3. Cálculo paso a paso

### Paso 1 — Cálculo de `a` por cada placa individual

```
a = C × (b / A)
```

Este valor representa la estimación de colonias realmente positivas en esa placa.

**Validaciones previas a cada placa:**

| Condición | Motivo | Acción |
|---|---|---|
| A > 5 | La norma limita el traspaso a 5 colonias máximo | Placa rechazada |
| A > C | No se puede traspasar más de lo que se contó | Placa rechazada |
| b > A | Imposible confirmar más de lo traspasado | Placa rechazada |
| C > 0 y A = 0 | Hay colonias pero no se realizó el traspaso | Placa rechazada |
| C = 0 | Sin desarrollo | a = 0 (placa válida, aporta cero) |

### Paso 2 — Suma de aportes

```
Σa = a_placa1 + a_placa2 + ... (todas las placas válidas de ambas diluciones)
```

### Paso 3 — Cálculo del resultado final N

```
N = Σa / (V × (n₁ + 0,1 × n₂) × d)
```

**Casos especiales → resultado "SD" (Sin Desarrollo):**

| Condición | Caso |
|---|---|
| Sin datos ingresados | `SIN_DATOS` |
| Σcolonias ≤ 0 | `SIN_DESARROLLO` |
| Σa ≤ 0 (colonias presentes pero sin confirmación) | `SIN_CONFIRMACION` |
| Todas las placas fueron rechazadas por error | Falla en validación → `SIN_CONFIRMACION` |

---

## 4. Ejemplo numérico — caso Excel oficial

**Entrada:**

| Placa | colonias 48h (C) | A (traspaso) | coag 4-6h | coag 24h | b |
|---|---|---|---|---|---|
| A | 23 | 5 | 3 | 0 | 3 |
| B | 45 | 4 | 4 | 0 | 4 |

Dilución: 10⁻² (dil = 2), V = 1 mL, n₁ = 2 placas, n₂ = 0

**Cálculo:**

```
a_A = 23 × (3/5) = 13,8
a_B = 45 × (4/4) = 45,0
Σa  = 58,8

d   = 10^(-2) = 0,01

N = 58,8 / (1 × (2 + 0,1×0) × 0,01)
N = 58,8 / 0,02
N = 2.940 UFC/g
```

**Resultado reportado:** `2,9 × 10³ UFC/g`

---

## 5. Formato del reporte

El sistema redondea a **2 cifras significativas** y expresa el resultado en notación científica con superíndices unicode:

| N calculado | Texto de reporte |
|---|---|
| 2.940 | `2,9 × 10³ UFC/g` |
| 116 | `1,2 × 10² UFC/g` |
| Sin datos | `SD` |

---

## 6. Flujo del sistema (API)

### Vía ruta de cálculo (`POST /api/saureus/calcular-muestra`)

El frontend envía las placas con sus datos de laboratorio:

```json
{
  "solicitudAnalisisId": "...",
  "muestraId": "M1",
  "placas": [
    {
      "dil": 2,
      "colonias24h": 22,
      "colonias48h": 23,
      "aConfirmar": 5,
      "coag4a6h": 3,
      "coag24h": 0
    },
    {
      "dil": 2,
      "colonias24h": 40,
      "colonias48h": 45,
      "aConfirmar": 4,
      "coag4a6h": 4,
      "coag24h": 0
    }
  ]
}
```

El sistema responde con el resultado calculado:

```json
{
  "ufc": 2940,
  "textoReporte": "2,9 × 10³ UFC/g",
  "esSd": false,
  "casoAplicado": "NCh2671_porPlaca",
  "sumaA": 58.8,
  "n1": 2,
  "n2": 0,
  "d": 0.01,
  "detalle": [
    { "dil": 2, "colonias": 23, "A": 5, "b": 3, "a": 13.8, "tiempo": "4-6h", "error": null },
    { "dil": 2, "colonias": 45, "A": 4, "b": 4, "a": 45,   "tiempo": "4-6h", "error": null }
  ],
  "advertencias": []
}
```

### Vía CRUD (guardado de etapa 5)

Cuando el sistema guarda los resultados de la etapa 5, recalcula automáticamente usando los datos almacenados en las etapas 1, 3 y 4 de la base de datos.

| Etapa | Datos utilizados |
|---|---|
| Etapa 1 | Recuento de colonias presuntivas (conteo24h, conteo48h) |
| Etapa 3 | Colonias traspasadas a coagulasa (aConfirmar por placa) |
| Etapa 4 | Resultado de coagulasa (4-6h y 24h) por placa |

---

## 7. Diferencia con el algoritmo anterior (NCh 2676)

El sistema anterior aplicaba incorrectamente la NCh 2676, que es una norma distinta. Las diferencias principales son:

| Aspecto | NCh 2676 (anterior — incorrecto) | NCh 2671 (actual — correcto) |
|---|---|---|
| Coagulasa | Se usaba **solo** la lectura 4-6h **o** solo la de 24h | Ambas se suman: `b = coag4a6h + coag24h` |
| Regla 80% | Si b/A ≥ 80%, se inflaba el resultado a C completo | No existe esta regla en NCh 2671 |
| Denominador | `n₁` fijo, sin n₂ | `n₁ + 0,1·n₂` según la norma |
| Reproducción del Excel | No reproducía el resultado del Excel oficial | Reproduce exactamente `2,9 × 10³ UFC/g` |

---

## 8. Casos de borde y advertencias

El sistema registra advertencias sin bloquear el cálculo cuando:

- Se ingresan más de 2 diluciones (la norma usa máximo 2; el sistema toma las dos más concentradas)
- Una placa es rechazada por validación (A > 5, b > A, etc.) pero otras placas sí aportan

Las advertencias quedan registradas en el campo `advertencias[]` de la respuesta y en el campo `observacionIncongruencia` del resultado persistido.

---

*Documento generado para presentación a supervisión técnica — AssisTec / Proyecto Práctica 2025.*
