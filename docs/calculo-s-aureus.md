# Cálculo S. aureus Fase 5

Este documento describe el cálculo vigente de **S. aureus** para la Etapa 5 según `openspec/changes/saureus-phase5-calculation/spec.md`.

## Resumen

El backend calcula por **placa individual** y luego aplica la fórmula general:

```txt
a = (b / A) × C
N = Σa / ((n1 + 0,1 × n2) × d)
```

Donde:

| Campo | Significado |
|-------|-------------|
| `C` | Colonias posibles S. aureus de la placa. |
| `A` | Colonias traspasadas a confirmar de la placa. |
| `b` | Colonias coagulasa positivas de la placa. |
| `a` | Recuento ajustado por placa. |
| `Σa` | `aPlacaA + aPlacaB`. |
| `d` | Factor de dilución de la primera dilución válida. |
| `n1` | Cantidad de diluciones válidas en el primer nivel. Para la primera dilución válida vale `1`, aunque existan placas A y B. |
| `n2` | Segunda dilución válida. Vale `1` si existe, `0` si no existe. |

## Reglas aplicadas

### 1. Cálculo por placa

Cada placa se calcula por separado:

```txt
aPlaca = (b / A) × C
```

Si una placa no tiene `C` o no tiene `A`, aporta `0`.

### 2. Regla del 80%

Si `b / A >= 0.8`, no se ajusta y se usa el total de colonias posibles:

```txt
aPlaca = C
```

El resultado expone:

| Campo | Significado |
|-------|-------------|
| `proporcionA`, `proporcionB` | Proporción `b/A` por placa. |
| `regla80AplicadaA`, `regla80AplicadaB` | `true` si esa placa cayó en la regla del 80%. |

### 3. Lectura de coagulasa

La lectura usada se resuelve así:

1. Si 4 hrs tiene positivos, se usa `coagulasa4h`.
2. Si 4 hrs no tiene positivos, se usa `coagulasa24h`.
3. Si ambas son cero, el cálculo queda `SD` salvo el caso especial `sumaColonias = 0`.

### 4. Máximo 5 colonias a confirmar

La API bloquea el cálculo si:

```txt
colConfirmar[0] + colConfirmar[1] > 5
```

Esto aplica tanto para `POST /calcular-muestra` como para `POST /calcular-todo`, devolviendo `400`.

### 5. Menos de 15 colonias

Si `sumaColonias < 15`, el backend conserva `ufc` pero `textoReporte` pasa a ser:

```txt
NE
```

Si `sumaColonias = 0`, reporta el límite detectable:

```txt
< 1 × d⁻¹
```

Ejemplo para `d = 0.01`:

```txt
< 1 x 10² UFC/g
```

## Diluciones aceptadas

El backend acepta tanto `-2` como `2` para representar `10^-2`.

Esto evita romper el flujo actual del frontend, que envía la dilución como número positivo ingresado por el usuario.

## Ejemplo validado

Entrada:

```json
{
  "diluciones": [
    { "dil": 2, "colonias": [230, 126] },
    { "dil": 3, "colonias": [null, null] }
  ],
  "coloniasPosibles": [230, 126],
  "colConfirmar": [5, null],
  "coagulasa4h": [2, null],
  "coagulasa24h": [3, null]
}
```

Resultado esperado:

```txt
Placa A: a = (2 / 5) × 230 = 92
Placa B: a = 0
Σa = 92
d = 0.01
n1 = 1
n2 = 0
N = 9200
textoReporte = 9,2 x 10³ UFC/g
```

## Respuesta de la API

`POST /api/saureus/calcular-muestra` responde el resultado directo, por ejemplo:

```json
{
  "aPlacaA": 92,
  "aPlacaB": 0,
  "sumaA": 92,
  "proporcionA": 0.4,
  "proporcionB": null,
  "regla80AplicadaA": false,
  "regla80AplicadaB": false,
  "n1": 1,
  "n2": 0,
  "factorDilucion": 0.01,
  "ufc": 9200,
  "textoReporte": "9,2 x 10³ UFC/g",
  "coagulasaUsada": "4 hrs",
  "sumaColonias": 356,
  "esSd": false,
  "operador": "="
}
```

`POST /api/saureus/calcular-todo` responde:

```json
{
  "resultados": {
    "M1": { "textoReporte": "2,4 x 10³ UFC/g" },
    "M2": { "textoReporte": "9,2 x 10³ UFC/g" }
  },
  "resultadoConsolidado": "9,2 x 10³ UFC/g",
  "reglaAplicada": "Se toma el mayor valor entre las muestras que presentan desarrollo"
}
```

## Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `AssisTec API/src/routes/saureus-calculation.routes.js` | Endpoints `calcular-muestra`, `calcular-todo`, `importar-duplicado`. |
| `AssisTec API/src/services/calculators/calculador.base.ts` | Utilidades compartidas del motor de cálculo. |
| `AssisTec API/src/services/calculators/calculador-saureus.service.ts` | Implementación del cálculo S. aureus. |
| `AssisTec API/src/services/calculators/__tests__/calculador-saureus.test.ts` | Casos unitarios del cálculo. |
| `AssisTec API/src/routes/__tests__/saureus-calculation.routes.test.ts` | Casos de integración de la API. |
