# Bloque de resultados / cálculo por análisis

Es la parte que diferencia cada formulario y lo más importante del registro. Toda
trazabilidad parte del **mismo esqueleto** (1–5 muestras + duplicado) y solo cambia este
bloque. Entrada típica: recuentos por placa (A/B) y por dilución. Salida: variables
intermedias + resultado final con unidad.

## S. Aureus — NCh 2671 (UFC/g)
Variables que produce por muestra:
- `a` = suma de colonias confirmadas de las placas contables.
- `Ʃa` = total acumulado.
- `d` = factor de dilución (p. ej. `0,01` para 10⁻²).
- Previas = `(coagulasa positivas ÷ a confirmar) × a` (regla de proporción de confirmadas).
- `N` = recuento S. Aureus en UFC/g (resultado).
- `NE` = recuento estimado en UFC/g.
- Estados especiales: `SD` (sin dato) cuando no hay placas contables; lectura usada
  (coagulasa 4 hrs vs 24 hrs) según corresponda; "no aplica" cuando una lectura no se hizo.

Entrada: por muestra → recuento por dilución (placa A / placa B), "a confirmar" (máx. 5),
coagulasa 4–6 hrs y 24 hrs por placa. Por la densidad, renderizar **una tarjeta por muestra**.

## Enterobacterias — NCh 2676 (UFC/g)
Variables: `b, a, Ʃa, d, n1, n2, m, RE, REES`.
- `n1`, `n2` = nº de placas contadas en cada dilución consecutiva.
- `RE` = resultado enumeración (UFC/g); `REES` = resultado estimado (UFC/g).
Entrada por muestra: 2 diluciones × (Placa 1, Placa 2). Tabla de muestras estándar sirve.

## Coliformes Totales / Fecales y E. coli — NCh 2635 (NMP)
Resultado por técnica de Número Más Probable. Variables de entrada: combinación de tubos
positivos por dilución; salida: NMP/g (+ índice/categoría). Usar tarjetas `nmp-card` y botón
`btn-calcular-nmp` ("Calcular NMP"). El formulario de coliformes separa **Coliformes Totales**
y **Coliformes Fecales** como dos bloques dentro de la etapa.

## Salmonella — cualitativo (Presencia / Ausencia)
No hay cálculo numérico. Por muestra y por agar (XLD, SS) y lectura (24h/48h) se marca `+`/`-`,
y el resultado final es **P** (Presencia) o **A** (Ausencia). Enriquecimiento previo en caldos
(APT, Selenito, Rappaport) con marca de crecimiento. Render: filas por agar/lectura con
celdas `celda-pos`/`celda-neg`; resultado final como badge presencia/ausencia.

## Otros análisis de la familia (en `Registros_por_digitalizar.xlsx`)
Mohos y Levaduras (RM y Lev), Reaislación, confirmación tradicional, confirmación antígenos.
Tratar igual: identificar variables del bloque de resultados desde su hoja Excel.

## Cómo agregar un análisis nuevo
1. Abre su hoja de trazabilidad y localiza la fila "Resultado".
2. Lista las variables intermedias (las etiquetas en la columna A) y el resultado final + unidad.
3. Clasifica el tipo de salida: **cuantitativo UFC/g**, **NMP**, o **cualitativo P/A**.
4. Define entradas por muestra (placas/diluciones/lecturas) y si requiere tarjeta-por-muestra
   (cálculo denso) o tabla estándar.
5. Documenta el set de variables aquí antes de generar el formulario.
