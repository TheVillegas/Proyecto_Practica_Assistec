# Diseño Técnico: Fase 5 — Cálculo y Resultados S. aureus

## 1. Resumen

Re-diseño de la **Etapa 5 (Resultados S. Aureus)** del formulario S. aureus para que funcione como pantalla de cálculo consolidado, siguiendo el mismo patrón ISO 7218 que RAM pero incorporando los pasos extra de confirmación por coagulasa (4-6h y 24h).

**Diferencia clave con RAM:**
- RAM: recuento directo de colonias → UFC/g
- S. aureus: recuento → selección de colonias a confirmar → coagulasa 4-6h + 24h → ratio de confirmación → UFC/g ajustado

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
│  │  A confirmar:  │  4h: 12       │  24h: 3        ││
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
│   │   ├── confirmacion-section       ← Colonias a confirmar
│   │   ├── coagulasa-tiempo-section   ← 4-6h (reutilizado ×2)
│   │   │   └── placa-input            ← Input individual placa A/B
│   │   ├── coagulasa-tiempo-section   ← 24h (mismo componente)
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

### `coagulasa-tiempo-section` — Reutilizado para 4-6h y 24h

```typescript
@Component({
  selector: 'coagulasa-tiempo-section',
  // standalone: true
})
export class CoagulasaTiempoSectionComponent {
  @Input() label!: string;                // "4-6 Hrs" o "24 Hrs"
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

  // ── Confirmación ──
  colConfirmar1   Int?     @map("col_confirmar_1")       // Colonias a confirmar, Placa A
  colConfirmar2   Int?     @map("col_confirmar_2")       // Colonias a confirmar, Placa B

  // ── Coagulasa 4-6h ──
  confirmadas4h1  Int?     @map("confirmadas_4h_1")      // Confirmadas +, Placa A
  confirmadas4h2  Int?     @map("confirmadas_4h_2")      // Confirmadas +, Placa B
  fechaLectura4h  DateTime? @map("fecha_lectura_4h")
  horaLectura4h   String?  @map("hora_lectura_4h")
  analistaLectura4h String? @map("analista_lectura_4h")

  // ── Coagulasa 24h ──
  confirmadas24h1 Int?     @map("confirmadas_24h_1")     // Confirmadas +, Placa A
  confirmadas24h2 Int?     @map("confirmadas_24h_2")     // Confirmadas +, Placa B
  fechaLectura24h DateTime? @map("fecha_lectura_24h")
  horaLectura24h  String?  @map("hora_lectura_24h")
  analistaLectura24h String? @map("analista_lectura_24h")

  // ── Resultado calculado (solo lectura, lo pone el backend) ──
  resultadoUfc    Decimal? @map("resultado_ufc")
  resultadoTexto  String?  @map("resultado_texto")       // "1,9 x 10⁴ UFC/g"
  operador        String?  @default("=")                 // "=", "<", ">"
  esSd            Boolean  @default(false) @map("es_sd") // Sin desarrollo
  ratio4h         Decimal? @map("ratio_4h")              // confirmadas4h / colConfirmar
  ratio24h        Decimal? @map("ratio_24h")
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
  "colConfirmar": [15, 10],             // [Placa A, Placa B]
  "confirmadas4h": [12, 8],             // [Placa A, Placa B]
  "confirmadas24h": [3, 2]              // [Placa A, Placa B]
}

Response 200:
{
  "muestraId": "M1",
  "resultado": {
    "ufc": 18500,
    "textoReporte": "1,9 x 10⁴ UFC/g",
    "textoRPES": "18500",
    "operador": "=",
    "esSd": false,
    "resultadosPorTiempo": {
      "coagulasa4h": {
        "ufc": 18500,
        "ratio": 0.8,
        "texto": "1,9 x 10⁴ UFC/g",
        "operador": "="
      },
      "coagulasa24h": {
        "ufc": null,
        "ratio": 0.0,
        "texto": "SD",
        "operador": "<"
      }
    },
    "sumaColonias": 58,
    "n1": 2,
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
      "colConfirmar": [15, 10],
      "confirmadas4h": [12, 8],
      "confirmadas24h": [3, 2]
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
    "colConfirmar": [15, 10],
    "confirmadas4h": [12, 8],
    "confirmadas24h": [3, 2],
    "resultadoTexto": "1,9 x 10⁴ UFC/g"
  },
  "advertencia": null  // o string si no hay datos
}
```

---

## 6. Lógica de Cálculo (Backend)

### Algoritmo (misma base ISO 7218 que RAM + ajuste por confirmación)

```
function calcularResultadoSAureus(datos):
  1. Clasificar colonias en rangos (óptimo/bajo/exceso/sin crecimiento)
     → Igual que ReporteRAM.clasificarDiluciones()

  2. Para CADA tiempo (4h y 24h):
     a. Calcular ratio = sum(confirmadas) / sum(colConfirmar)
        Si colConfirmar = 0 → ratio = 0
     b. Si ratio > 0:
        - Ajustar colonias originales: ajustadas = colonias × ratio
        - Aplicar ISO 7218 sobre colonias ajustadas
        - Guardar resultado parcial
     c. Si ratio = 0:
        - Resultado parcial = SD (sin desarrollo)

  3. Resultado FINAL de la muestra:
     - Si ALGÚN tiempo (4h o 24h) tiene resultado → usar ese UFC
     - Si AMBOS son SD → resultado final = SD
     - El resultado consolidado = el de mayor valor entre los dos tiempos
       (porque 24h puede detectar lo que 4-6h no capturó)

  4. Resultado CONSOLIDADO del ALI (opcional):
     - Para informe final: se toma el resultado de la muestra con mayor
       recuento, o se promedia según criterio del laboratorio.
```

### Ejemplo concreto

```
MUESTRA 1:
  Dilución: -2, Colonias: [28, 30]
  A confirmar: [15, 10] → 25 total
  Confirmadas 4h: [12, 8] → 20 total → ratio 4h = 20/25 = 0.8
  Confirmadas 24h: [3, 2] → 5 total → ratio 24h = 5/25 = 0.2

  → Ratio 4h = 0.8 > 0 → colonias ajustadas = 28×0.8=22, 30×0.8=24
  → ISO 7218 con [22, 24]:
     SumaC = 46, n1 = 2, n2 = 0
     d = 0.01 (10^-2)
     UFC = 46 / (1 × (2 + 0) × 0.01) = 46 / 0.02 = 2300
     Resultado = "2,3 x 10³ UFC/g"

  → Ratio 24h = 0.2 > 0 → también aplica, pero da menor
  → Resultado FINAL = 2,3 x 10³ UFC/g (el de 4h que es mayor)
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
│  │  Confirmación                                         │    │
│  │  ┌──────────────┬─────────┬─────────┐                │    │
│  │  │              │ Placa A │ Placa B │                │    │
│  │  ├──────────────┼─────────┼─────────┤                │    │
│  │  │ A confirmar  │   15    │   10    │                │    │
│  │  │ Coagulasa 4h │   12    │    8    │                │    │
│  │  │ Coagulasa 24h│    3    │    2    │                │    │
│  │  └──────────────┴─────────┴─────────┘                │    │
│  │                                                       │    │
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │  Resultado:  1,9 x 10⁴ UFC/g    [✓]         │     │    │
│  │  │  4h: 1,9 x 10⁴ · 24h: SD                    │     │    │
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
│  │  │  Conf: 15/10  │ 4h: 12/8  │ 24h: 3/2         │    │    │
│  │  │  Resultado original: 1,9 x 10⁴               │    │    │
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
| Sin colonias en 24h y 48h (Etapa 1-2) | Saltar confirmación/coagulasa | SD |
| Colonias presentes pero coagulasa 4h + 24h = 0 | SD por confirmación | SD |
| Coagulasa 4h > 0 | Calcular con ratio 4h | UFC/g (4h) |
| Coagulasa 4h = 0 pero 24h > 0 | Calcular con ratio 24h | UFC/g (24h) |
| Ambos tiempos > 0 | Calcular ambos, tomar el mayor | UFC/g (mayor) |

**Pendiente de confirmación con supervisora:**
- [ ] Umbral exacto que obliga confirmación (hoy es criterio del analista)
- [ ] Expresión final para `<10` u otra

---

## 10. Estrategia de Implementación (futura)

Para no hinchar el HTML, se implementa en **3 capas de componentes**:

1. **Atómicos**: `placa-input`, `resultado-badge`, `ali-selector`
2. **Compuestos**: `recuento-table`, `coagulasa-tiempo-section`, `confirmacion-section`
3. **Contenedores**: `saureus-muestra-card`, `saureus-duplicado-card`, `etapa5-resultados`

Esto permite reutilizar `coagulasa-tiempo-section` para 4-6h y 24h con distinto `@Input() label`, y reutilizar `recuento-table` tanto en muestras normales como en el duplicado.
