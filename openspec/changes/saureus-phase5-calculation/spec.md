# S. aureus Phase 5 Calculation Specification

## Purpose

Calcular resultados de S. aureus (UFC/g) en la Fase 5 aplicando NCh2676 8.2: confirmación por coagulasa, regla del 80%, ajuste por placa, fórmula general y redondeo. Incluye duplicado como referencia a ALIs pasados.

## Requirements

### Requirement: Cálculo por placa individual (NCh2676 8.2.2.1)

El sistema MUST calcular `a = (b / A) × C` por placa (A y B), donde C=colonias posibles, A=traspasadas, b=coagulasa+.

#### Scenario: Ambas placas con datos

- GIVEN placa A C=28 A=3 b=1 y placa B C=30 A=2 b=1
- WHEN se calcula
- THEN placa A devuelve a=9 y placa B a=15

#### Scenario: Una placa sin datos

- GIVEN placa A con datos y placa B con C=null
- WHEN se calcula
- THEN placa A se calcula y placa B aporta a=0 al Σa

### Requirement: Regla del 80% (NCh2676 8.2.1)

El sistema MUST usar `a = C` si `b/A ≥ 0.8`; en caso contrario MUST aplicar `a = (b/A) × C`.

#### Scenario: Proporción ≥ 80%

- GIVEN placa con C=10, A=5, b=4 (80%)
- WHEN se calcula
- THEN regla80Aplicada=true y a=10

#### Scenario: Proporción < 80%

- GIVEN placa con C=28, A=3, b=1 (33%)
- WHEN se calcula
- THEN a=9.33 (ajuste proporcional)

### Requirement: Resolución de coagulasa 4 hrs / 24 horas

El sistema MUST usar 4 hrs si tiene positivos; si no, MUST usar 24 horas; si ambas son cero, MUST marcar SD.

#### Scenario: Positiva a 4 hrs

- GIVEN coagulasa 4h=[1,1] y 24h=[null,null]
- WHEN se resuelve
- THEN se usa 4 hrs

#### Scenario: Negativa 4h, positiva 24h

- GIVEN coagulasa 4h=[0,0] y 24h=[2,1]
- WHEN se resuelve
- THEN se usa 24 horas

#### Scenario: Ambas negativas

- GIVEN coagulasa 4h=[0,0] y 24h=[0,0]
- WHEN se resuelve
- THEN resultado es SD

### Requirement: Validación máximo 5 colonias

El sistema MUST bloquear el cálculo si `sum(colConfirmar) > 5`.

#### Scenario: Hasta 5 colonias

- GIVEN colConfirmar=[3,2] o [3,3] (total 6)
- WHEN se valida
- THEN el cálculo procede si ≤5, o se bloquea si >5

### Requirement: Fórmula general y redondeo (NCh2676 8.2.2.2/8.2.2.3)

El sistema MUST calcular `N = Σa / ((n₁ + 0.1×n₂) × d)` y MUST redondear a 2 cifras significativas.

#### Scenario: Cálculo normal

- GIVEN Σa=24, n₁=1, n₂=0, d=0.01
- WHEN se aplica la fórmula
- THEN N=2400 → "2,4 × 10³ UFC/g"

#### Scenario: Placas sin desarrollo

- GIVEN ambas placas con a=0
- WHEN se aplica la fórmula
- THEN resultado es SD

### Requirement: Resultados con menos de 15 colonias (NCh2676 8.2.3)

Si suma < 15, SHOULD reportar N_E; si es 0, MUST reportar "< 1 × d⁻¹".

#### Scenario: Menos de 15 o cero colonias

- GIVEN sumaColonias=10 o sumaColonias=0
- WHEN se evalúa
- THEN se reporta N_E si <15, o "< 1 × d⁻¹" si es 0

### Requirement: Duplicado como referencia a ALI pasado

El sistema MUST importar datos de Muestra 1 de un ALI anterior, MUST permitir edición manual y SHOULD advertir si no hay datos S. aureus.

#### Scenario: Importar o editar

- GIVEN ALI-421 con Muestra 1 completa o duplicado ya importado
- WHEN se selecciona el ALI o se edita un campo
- THEN los campos se autocompletan y los cambios manuales persisten

#### Scenario: ALI sin datos S. aureus

- GIVEN ALI sin Muestra 1
- WHEN se importa
- THEN se muestra advertencia y campos quedan vacíos

### Requirement: Endpoints API

El sistema MUST exponer POST /calcular-muestra, POST /calcular-todo y GET /importar-duplicado.

#### Scenario: Calcular muestra individual

- GIVEN payload válido
- WHEN se invoca POST /calcular-muestra
- THEN retorna 200 con aPlacaA, aPlacaB, Σa, ufc y textoReporte

#### Scenario: Calcular todo o importar

- GIVEN array de muestras o query aliOrigen válido
- WHEN se invocan los endpoints
- THEN /calcular-todo retorna resultadosConsolidados y /importar-duplicado retorna datos del ALI o advertencia
