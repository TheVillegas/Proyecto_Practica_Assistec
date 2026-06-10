# Diseño Técnico: Fase 5 — Cálculo y Resultados S. aureus

## 1. Resumen

Re-diseño de la **Etapa 5 (Resultados S. Aureus)** del formulario S. aureus para que funcione como pantalla de cálculo consolidado, siguiendo el mismo patrón ISO 7218 que RAM pero incorporando la secuencia validada: colonias posibles S. aureus, toma de hasta 5 colonias características, coagulasa a 4 hrs/24 horas y cálculo del recuento previo ajustado.

**Diferencia clave con RAM:**
- RAM: recuento directo de colonias → UFC/g
- S. aureus: recuento de colonias posibles S. aureus → toma de hasta 5 colonias características → coagulasa 4 hrs/24 horas → proporción positivas/colonias traspasadas → recuento previo ajustado → fórmula general

**Regla validada con coordinación:**
- Desde la primera etapa pueden existir `x` colonias posibles S. aureus.
- Se toman **como máximo 5 colonias características** para pasar a coagulasa.
- La coagulasa se lee a las **4 hrs**; si ya es positiva, se registra el resultado inmediatamente.
- Si a las 4 hrs no es positiva, se espera hasta las **24 horas**.
- El cálculo se hace **por placa individual** según NCh2676 8.2.2.1: `a = (b / A) × C` para cada placa (A y B), donde b = colonias coagulasa positivas de esa placa, A = colonias traspasadas de esa placa, C = colonias posibles S. aureus de esa placa.
- La suma `Σa = a_placaA + a_placaB` alimenta la fórmula general de cálculo UFC/g (NCh2676 8.2.2.2).

---

## 2. Regla de Negocio: El Duplicado como Referencia a ALIs Pasados

### Problema actual
En el Excel `S.AUREUS.xlsx`, la columna "Duplicado" no contiene datos propios. En su lugar dice "Duplicado ALI 5" o "Duplicado ALI N", indicando que el analista debe **ir a buscar la Muestra 1 de ese ALI pasado** y usar esos datos como referencia.

### Regla confirmada
- El "duplicado" en S. aureus **no es un duplicado de laboratorio** (como en RAM, donde se siembra una placa duplicada de la misma muestra).
- Es un **dato importado de un ALI anterior** para efectos de control/trazabilidad.
- El sistema debe permitir **seleccionar un ALI existente** y **auto-importar los datos de su Muestra 1** como valores del duplicado.
- Si el ALI seleccionado no tiene datos de Muestra 1 de S. aureus, se muestra advertencia pero no se bloquea.

### UX del Duplicado

```
┌──────────────────────────────────────────────────────┐
│  Duplicado (Referencia a ALI pasado)                 │
│                                                      │
│  ALI de referencia:  [ALI-2025-00421 ▼]  ← selector │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │  Datos importados de ALI-2025-00421 · Muestra 1  ││
│  │                                                  ││
│  │  Dilución: -2  │  Placa A: 28  │  Placa B: 30   ││
│  │  A confirmar:  │  4 hrs: 12    │  24 horas: 3  ││
│  │  [🔄 Re-importar]                               ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  [✏️ Editar manualmente]  si el analista necesita    │
│  corregir los datos importados                       │
└──────────────────────────────────────────────────────┘
```

---

## 3. Arquitectura de Componentes (Reutilizables)

Para evitar el monolito de 900+ líneas en el HTML actual, se aplica el **mismo patrón que RAM**: componentes atómicos reutilizables.

### Árbol de Componentes

```
form-s-aureus.page
├── saureus-stepper                    ← Stepper de etapas (ya existe)
├── etapa1-inicio-siembra              ← Ya existe, se refactoriza
├── etapa2-control-lecturas            ← Ya existe, se refactoriza
├── etapa3-traspaso-bhi                ← Ya existe, se refactoriza
├── etapa4-coagulasa                   ← Ya existe, se refactoriza
├── etapa5-resultados                  ← NUEVO: Fase 5 rediseñada
│   ├── saureus-muestra-card           ← Componente card por muestra
│   │   ├── recuento-table             ← Tabla padre dilución + colonias
│   │   ├── seleccion-confirmacion-section ← Máximo 5 colonias características
│   │   ├── coagulasa-tiempo-section   ← 4 hrs (primera lectura)
│   │   │   └── placa-input            ← Input individual placa A/B
│   │   ├── coagulasa-tiempo-section   ← 24 horas (mismo componente)
│   │   └── resultado-badge            ← Badge del resultado calculado
│   └── saureus-duplicado-card         ← Card especial del duplicado
│       ├── ali-selector               ← Selector de ALI pasado
│       ├── ali-data-display           ← Display datos importados
│       └── recuento-table             ← Misma tabla reutilizada
├── etapa6-conclusion                  ← Ya existe
└── saureus-calcular-button            ← Botón calcular global
```

### `saureus-muestra-card` — Contrato del Componente

```typescript
@Component({
  selector: 'saureus-muestra-card',
  // standalone: true
})
export class SaureusMuestraCardComponent {
  // ─── Inputs ───
  @Input() muestra!: MuestraCalculo;       // Datos de la muestra
  @Input() numero!: number;                // 1-6
  @Input() esDuplicado: boolean = false;   // Si es el duplicado
  @Input() aliReferencia?: number;         // Solo para duplicado
  
  // ─── Outputs ───
  @Output() calcular = new EventEmitter<string>();  // Emit con muestraId
  @Output() importarALI = new EventEmitter<number>(); // Solo duplicado
  
  // ─── Estado interno ───
  resultado?: ResultadoCalculo;           // Resultado del cálculo
  isLoading: boolean = false;
}
```

### `coagulasa-tiempo-section` — Lecturas 4 hrs y 24 horas

```typescript
@Component({
  selector: 'coagulasa-tiempo-section',
  // standalone: true
})
export class CoagulasaTiempoSectionComponent {
  @Input() label!: string;                // "4 hrs" o "24 horas"
  @Input() confirmadas!: [number|null, number|null];  // [Placa A, Placa B]
  @Output() confirmadasChange = new EventEmitter<[number|null, number|null]>();
  
  // Controles adicionales: fecha/hora/analista específicos de este tiempo
  @Input() fechaLectura?: string;
  @Input() horaLectura?: string;
  @Input() analistaLectura?: string;
}
```

---

## 4. Modelo de Datos (Prisma)

```prisma
// ──────────────────────────────────────────────
// NUEVAS TABLAS para S. aureus Fase 5
// ──────────────────────────────────────────────

model SaureusMuestra {
  id              String   @id @default(uuid())
  solicitudAnalisisId String @map("solicitud_analisis_id")
  numeroMuestra   Int      @map("numero_muestra")       // 1-6
  esDuplicado     Boolean  @default(false) @map("es_duplicado")
  aliReferencia   Int?     @map("ali_referencia")       // Solo si es duplicado: ALI origen

  // ── Recuento Padre (hasta 2 diluciones, como RAM) ──
  dil1            Decimal? @map("dil_1")                 // 10^-2 = -2
  c1              Int?                                  // Placa A, dilución 1
  c2              Int?                                  // Placa B, dilución 1
  dil2            Decimal? @map("dil_2")                 // 10^-3 = -3 (opcional)
  c3              Int?                                  // Placa A, dilución 2
  c4              Int?                                  // Placa B, dilución 2

  // ── Selección y Confirmación ──
  coloniasPosibles1 Int? @map("colonias_posibles_1")      // Colonias posibles S. aureus, Placa A
  coloniasPosibles2 Int? @map("colonias_posibles_2")      // Colonias posibles S. aureus, Placa B
  colConfirmar1   Int?     @map("col_confirmar_1")       // Colonias características traspasadas, máx. 5 total
  colConfirmar2   Int?     @map("col_confirmar_2")

  // ── Coagulasa 4 hrs ──
  confirmadas4h1  Int?     @map("confirmadas_4h_1")      // Coagulasa +, Placa A
  confirmadas4h2  Int?     @map("confirmadas_4h_2")      // Coagulasa +, Placa B
  fechaLectura4h  DateTime? @map("fecha_lectura_4h")
  horaLectura4h   String?  @map("hora_lectura_4h")
  analistaLectura4h String? @map("analista_lectura_4h")

  // ── Coagulasa 24 horas ──
  confirmadas24h1 Int?     @map("confirmadas_24h_1")     // Coagulasa +, Placa A
  confirmadas24h2 Int?     @map("confirmadas_24h_2")     // Coagulasa +, Placa B
  fechaLectura24h DateTime? @map("fecha_lectura_24h")
  horaLectura24h  String?  @map("hora_lectura_24h")
  analistaLectura24h String? @map("analista_lectura_24h")

  // ── Resultado calculado (solo lectura, lo pone el backend) ──
  resultadoUfc    Decimal? @map("resultado_ufc")
  resultadoTexto  String?  @map("resultado_texto")       // "1,9 x 10⁴ UFC/g"
  operador        String?  @default("=")                 // "=", "<", ">"
  esSd            Boolean  @default(false) @map("es_sd") // Sin desarrollo
  aPlacaA         Int?       @map("a_placa_a")     // a calculado para placa A
  aPlacaB         Int?       @map("a_placa_b")     // a calculado para placa B
  sumaA           Int?       @map("suma_a")         // Σa = aPlacaA + aPlacaB
  coagulasaUsada  String?    @map("coagulasa_usada") // "4 hrs" | "24 horas" | null (SD)
  proporcionA     Decimal?   @map("proporcion_a")   // b/A placa A (para depuración)
  proporcionB     Decimal?   @map("proporcion_b")   // b/A placa B
  regla80AplicadaA Boolean?  @map("regla_80_a")     // si se aplicó regla 80% en placa A
  regla80AplicadaB Boolean?  @map("regla_80_b")     // si se aplicó regla 80% en placa B
  sumaColonias    Int?     @map("suma_colonias")
  n1              Int?                                   // Placas 1ra dilución
  n2              Int?                                   // Placas 2da dilución
  factorDilucion  Decimal? @map("factor_dilucion")
  casoAplicado    String?  @map("caso_aplicado")         // PRIORIDAD_1-4

  // ── Metadata ──
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // ── Relaciones ──
  solicitudAnalisis SolicitudAnalisis @relation(fields: [solicitudAnalisisId], references: [id])

  @@map("saureus_muestras")
}
```

---

## 5. Contrato API

### 5.1 Calcular una muestra

```
POST /api/saureus/calcular-muestra

Request:
{
  "solicitudAnalisisId": "uuid-de-la-solicitud",
  "muestraId": "M1",                    // Identificador interno
  "diluciones": [                        // Igual que RAM
    { "dil": -2, "colonias": [28, 30] },
    { "dil": -3, "colonias": [null, null] }
  ],
  "coloniasPosibles": [28, 30],         // posibles S. aureus por placa
  "colConfirmar": [3, 2],               // colonias características traspasadas, máximo 5 total
  "coagulasa4h": [1, 1],                // positivas a 4 hrs
  "coagulasa24h": [null, null]          // positivas a 24 horas; solo se usa si 4 hrs no fue positiva
}

Response 200:
{
  "muestraId": "M1",
  "resultado": {
    "aPlacaA": 9,
    "aPlacaB": 15,
    "sumaA": 24,
    "coagulasaUsada": "4 hrs",
    "proporcionA": 0.33,
    "proporcionB": 0.5,
    "regla80AplicadaA": false,
    "regla80AplicadaB": false,
    "ufc": 2400,
    "textoReporte": "2,4 x 10³ UFC/g",
    "sumaColonias": 24,
    "n1": 1,
    "n2": 0,
    "factorDilucion": 0.01,
    "casoAplicado": "PRIORIDAD_1"
  }
}
```

### 5.2 Calcular TODAS las muestras de un ALI

```
POST /api/saureus/calcular-todo

Request:
{
  "solicitudAnalisisId": "uuid-de-la-solicitud",
  "muestras": [
    {
      "id": "M1",
      "diluciones": [...],
      "coloniasPosibles": [28, 30],
      "colConfirmar": [3, 2],
      "coagulasa4h": [1, 1],
      "coagulasa24h": [null, null]
    },
    {
      "id": "M2",
      "diluciones": [...],
      ...
    },
    // M3-M6 + Duplicado
  ]
}

Response 200:
{
  "resultados": {
    "M1": { "ufc": 18500, "textoReporte": "...", "esSd": false },
    "M2": { "ufc": null, "textoReporte": "SD", "esSd": true },
    "M3": { "ufc": 9200, "textoReporte": "...", "esSd": false },
    ...
    "DUP": { "ufc": 18500, "textoReporte": "...", "esSd": false }
  },
  "resultadoConsolidado": "1,9 x 10⁴ UFC/g",
  "reglaAplicada": "Se toma el mayor valor entre las muestras que presentan desarrollo"
}
```

### 5.3 Importar duplicado desde ALI pasado

```
GET /api/saureus/importar-duplicado?aliOrigen=421&solicitudActualId=uuid

Response 200:
{
  "aliOrigen": 421,
  "muestra1": {
    "diluciones": [{ "dil": -2, "colonias": [28, 30] }],
    "coloniasPosibles": [28, 30],
    "colConfirmar": [3, 2],
    "coagulasa4h": [1, 1],
    "coagulasa24h": [null, null],
    "resultadoTexto": "1,9 x 10⁴ UFC/g"
  },
  "advertencia": null  // o string si no hay datos
}
```

---

## 6. Lógica de Cálculo (Backend)

### Algoritmo validado (basado en NCh2676 8.2 — cálculo por placa individual)

```
function calcularResultadoSAureus(datos):
  1. Por cada placa (A y B), resolver coagulasa:
     a. Leer coagulasa 4 hrs.
     b. Si 4 hrs tiene positivos → usar esa lectura, cerrar.
     c. Si 4 hrs no tiene positivos → usar lectura 24 horas.
     d. Si 24 horas tampoco tiene positivos → a_placa = 0 (SD).
     e. Validar: sum(colConfirmar) <= 5

  2. Por cada placa, calcular "a" individual (NCh2676 8.2.2.1):
     a_placa = (b / A) × C
     Donde:
     - C = colonias posibles S. aureus de esa placa
     - A = colonias traspasadas de esa placa
     - b = colonias coagulasa positivas de esa placa

  3. Aplicar regla del 80% (NCh2676 8.2.1):
     Si (b / A) >= 0.8 → a_placa = C (se usa el total sin ajustar)

  4. Sumar todas las "a":
     Σa = a_placaA + a_placaB

  5. Aplicar fórmula general (NCh2676 8.2.2.2):
     N = Σa / ((n₁ + 0.1 × n₂) × d)

  6. Aproximar a 2 cifras significativas (NCh2676 8.2.2.3)
```

### Ejemplo concreto

```
MUESTRA 1:
  Dilución: -2, Colonias: [28, 30]

  Placa A: C=28, A=3, coag+4h=1 → a = (1/3)×28 = 9  [33%, no aplica 80%]
  Placa B: C=30, A=2, coag+4h=1 → a = (1/2)×30 = 15 [50%, no aplica 80%]

  Σa = 9 + 15 = 24

  n₁ = 1 (solo dil -2 tiene placas seleccionables)
  n₂ = 0
  d = 0.01 (10⁻²)

  N = 24 / (1 × (1 + 0.1×0) × 0.01)
  N = 24 / 0.01 = 2400

  Aproximado → 2,4 × 10³ UFC/g
  Redondeo: 2400 ≈ 2,4 × 10³ (dos cifras significativas)
```

---

## 7. Mockup Visual de la Fase 5

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
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │  Placa A: a = (1÷3)×28 = 9   [33%]          │     │    │
│  │  │  Placa B: a = (1÷2)×30 = 15  [50%]          │     │    │
│  │  │  Σa = 24                                     │     │    │
│  │  │  Resultado:  2,4 x 10³ UFC/g    [✓]         │     │    │
│  │  │  Lectura usada: 4 hrs                        │     │    │
│  │  └─────────────────────────────────────────────┘     │    │
│  │                                                       │    │
│  │  [🧮 Calcular muestra]                                │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌───────────── MUESTRA 2 ──────────────────────────────┐    │
│  │  (mismo layout, datos distintos)                      │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌───────────── DUPLICADO (ALI-421) ────────────────────┐    │
│  │                                                       │    │
│  │  ALI de referencia: [ALI-2025-00421  ▼]              │    │
│  │                                                       │    │
│  │  ┌──────────────────────────────────────────────┐    │    │
│  │  │  Datos importados de Muestra 1 del ALI-421   │    │    │
│  │  │  Dil: -2  │ PA: 28 │ PB: 30                  │    │    │
│  │  │  Posibles S.a: 28/30 │ Conf: 3/2             │    │    │
│  │  │  Coag 4 hrs: 1/1 │ 24 horas: no aplica      │    │    │
│  │  │  aA: 9 │ aB: 15 │ Σa: 24 | Resultado: 2,4x10³│    │    │
│  │  └──────────────────────────────────────────────┘    │    │
│  │  [🔄 Re-importar]  [✏️ Editar]                       │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  [🧮 Calcular TODAS las muestras]                    │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Resultado Consolidado (para Etapa 6)

La Etapa 6 (Conclusión Final) mostrará:

```
┌──────────────────────────────────────────────────────┐
│  RESULTADOS POR MUESTRA                               │
│                                                       │
│  ┌──────┬──────────────────┬──────────┐              │
│  │ M1   │  1,9 x 10⁴ UFC/g │  ✓       │              │
│  │ M2   │  SD              │  —       │              │
│  │ M3   │  9,2 x 10³ UFC/g │  ✓       │              │
│  │ M4   │  < 10 UFC/g      │  ⚠       │              │
│  │ M5   │  4,5 x 10⁴ UFC/g │  ✓       │              │
│  │ M6   │  SD              │  —       │              │
│  │ DUP  │  1,9 x 10⁴ UFC/g │  ref     │              │
│  ├──────┼──────────────────┼──────────┤              │
│  │      │  Máximo: 4,5x10⁴ │          │              │
│  └──────┴──────────────────┴──────────┘              │
│                                                       │
│  Desfavorable: [Sí] / [No]  ← según normativa        │
│  Límite: [__________]                                 │
│  Tabla/Página: [__________]                           │
│  Fecha entrega: [____]  Hora: [____]                  │
└──────────────────────────────────────────────────────┘
```

---

## 9. Reglas de Decisión para el Árbol

| Condición | Acción | Resultado |
|---|---|---|
| Sin colonias en 24 horas y 48 horas (Etapa 1-2) | Saltar confirmación/coagulasa | SD |
| Colonias posibles S. aureus presentes | Seleccionar hasta 5 colonias características | Continúa a coagulasa |
| Colonias seleccionadas > 5 | Bloquear o advertir corrección | No calcular |
| Coagulasa 4 hrs > 0 | Usar 4 hrs y cerrar resultado | UFC/g con lectura 4 hrs |
| Coagulasa 4 hrs = 0 y 24 horas > 0 | Usar lectura 24 horas | UFC/g con lectura 24 horas |
| Coagulasa 4 hrs = 0 y 24 horas = 0 | SD por coagulasa | SD |
| Proporción confirmación ≥ 80% en una placa | Usar C directo (sin ajuste) | a = C |
| Proporción confirmación < 80% | Ajuste proporcional | a = (b/A) × C |

**Validado con coordinación:**
- [x] A confirmación pasan como máximo 5 colonias.
- [x] Si coagulasa 4 hrs es positiva, se obtiene el resultado inmediatamente.
- [x] Si coagulasa 4 hrs no es positiva, se espera hasta 24 horas.

**Pendiente de confirmación con supervisora:**
- [ ] Expresión final para `<10` u otra

---

## 10. Estrategia de Implementación (futura)

Para no hinchar el HTML, se implementa en **3 capas de componentes**:

1. **Atómicos**: `placa-input`, `resultado-badge`, `ali-selector`
2. **Compuestos**: `recuento-table`, `coagulasa-tiempo-section`, `confirmacion-section`
3. **Contenedores**: `saureus-muestra-card`, `saureus-duplicado-card`, `etapa5-resultados`

Esto permite reutilizar `coagulasa-tiempo-section` para 4 hrs y 24 horas con distinto `@Input() label`, y reutilizar `recuento-table` tanto en muestras normales como en el duplicado.
