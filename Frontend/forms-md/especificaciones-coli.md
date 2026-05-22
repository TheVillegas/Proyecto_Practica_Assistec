# Especificaciones para la digitalización del formulario de análisis microbiológico

## 1. Contexto general
# Formulario Coliformes totales, coliformes fecales y E. coli 
Este documento contiene la estructura completa del formulario de coliformes totales, fecales y E. coli, y los requerimientos para la digitalización del formulario para el registro de análisis microbiológico de **Coliformes Totales, Coliformes Fecales y E. coli** en alimentos.

## 2. Estructura
El formulario de coliformes está estructurado en etapas, cada una con sus propios campos y validaciones. Las etapas son las siguientes:
1. Detalles del alimento e incubación
2. Detalles de siembra
3. Control de análisis
4. Control de calidad
5. Datos finales y cálculo de resultados


El formulario debe permitir:

1. Importar automáticamente datos del alimento desde una lista de solicitudes de ingreso.
2. Registrar los datos de siembra y utensilios utilizados.
3. Registrar lecturas de submuestras a las 24 horas y 48 horas.
4. Registrar controles de calidad.
5. Calcular y mostrar los resultados finales de presencia de coliformes y/o E. coli.
6. Enviar o cancelar el registro del análisis.


## Características de la interfaz del formulario

La interfaz debe tener:

- Diseño limpio, profesional y orientado a laboratorio.
- Estructura por etapas o secciones claramente diferenciadas.
- Campos agrupados según el flujo real del análisis.
- Validaciones visuales para campos obligatorios.
- Botones principales de acción:
  - **Enviar**
  - **Cancelar**
- Estado visual para campos autocompletados y no editables.
- Tablas editables para registrar lecturas por muestra, duplicado, dilución y submuestra.


## 3. Flujo general del formulario

El formulario debe organizarse en las siguientes etapas:

1. **Detalles del alimento e incubación**
2. **Detalles de siembra**
3. **Control de análisis: lectura 24 h y 48 h**
4. **Control de calidad**
5. **Datos finales y cálculo de resultados**

Cada etapa debe estar claramente separada visualmente. Puede implementarse como:

- Secciones verticales en una misma página, o
- Un formulario tipo stepper/wizard con navegación entre etapas.

Si se usa stepper/wizard, el usuario debe poder avanzar solamente cuando los campos obligatorios de la etapa actual estén completos.

Desde el formulario de solicitud de ingreso se debe autocompletar el código ALI asociado. 


## 5. Etapa 1: Detalles del alimento e incubación

Esta etapa contiene los datos generales del alimento, incubación y cierre del análisis.

### Campos
* Código ALI: autocompletado
#### Enumeración de coliformes totales (NCh 2635/1. Of2001)
* Inicio Incubación: Día (dd)/mes (mm)/hora (hh:mm)/Analista
* Término Análisis: Día (dd)/mes (mm)/hora (hh:mm)/Analista

#### Enumeracion de coliformes fecales (NCh 2635/1. Of2001)
* Inicio Incubación: Día (dd)/mes (mm)/hora (hh:mm)/Analista
* Término Análisis: Día (dd)/mes (mm)/hora (hh:mm)/Analista

#### Enumeración de Escherichia Coli (NCh 2636. Of2001)
* Inicio Incubación: Día (dd)/mes (mm)/hora (hh:mm)/Analista
* Término Análisis: Día (dd)/mes (mm)/hora (hh:mm)/Analista


### Validaciones

- La fecha de término de análisis no puede ser anterior a la fecha de incubación.
- El analista responsable de término de análisis es obligatorio.
- El campo de código ALI es autocompletado y no editable.
- Los campos de inicio de incubación y término de análisis son editables.
- Los campos de analista responsable de incubación y analista responsable de término de análisis son editables.

## 6. Etapa 2: Detalles de siembra

Esta etapa debe permitir registrar los datos relacionados con la siembra bacteriana y los utensilios utilizados.

### Campos
* Caldo Lauril simple: campo de texto editable
* Tween 80: campo de texto editable
* Estufa utilizada: campo tipo radio button con opciones (Estufa 73-M (35.0+/-0.5°C), Estufa 2-M (35.5+/-0.5°C))

* Micropipetas 1ml: campo tipo radio button con opciones (22-M, 72-M, 98-M, 100-M, 102-M)
* Micropipetas 10ml: campo tipo radio button con opciones (32-M, 103-M, 75-M, 94-M, 106-M)
* N° muestra 10 g / 90 ml: campo de texto editable
* N° muestra 50 g / 450 ml: campo de texto editable


### Reglas de interacción

- En **Estufa utilizada**, el usuario debe seleccionar una única opción.
- En **Micropipeta utilizada**, el usuario puede seleccionar una única opción
- Debe existir al menos una micropipeta seleccionada.


## 7. Etapa 3: Control de análisis

Esta etapa debe registrar las lecturas realizadas a las 24 horas y 48 horas.

Debe contener dos bloques o tablas independientes:

1. **Lectura a 24 horas**
2. **Lectura a 48 horas**

Cada bloque debe incluir datos generales de lectura y una tabla de submuestras.

### 7.1 Campos para lectura 24 horas

* Fecha/Hora/Analista lectura lauril 24 horas: (dd/mm/hh:mm/texto) editable
* Tabla de lectura para las muestras: 
- 6 muestras + 1 duplicado. 
- 3 diluciones por muestra. diluciones: 1 ml, 0.1 ml, 0.01 ml.
- Columnas de tabla: N° de muestra, Duplicado, 1 ml, 0.1 ml, 0.01 ml. (positivos/negativos)


### 7.2 Campos para lectura 48 horas
* Fecha/Hora/Analista lectura lauril 24 horas: (dd/mm/hh:mm/texto) editable
* Tabla de lectura para las muestras: 
- 6 muestras + 1 duplicado. 
- 3 diluciones por muestra. diluciones: 1 ml, 0.1 ml, 0.01 ml.
- Columnas de tabla: N° de muestra, Duplicado, 1 ml, 0.1 ml, 0.01 ml. (positivos/negativos)


## 8. Regla de validación para hora de lectura

La hora de lectura debe permitir que la lectura se registre dentro de un margen de tolerancia de:

- **2 horas antes** de la hora programada.
- **2 horas después** de la hora programada.

### Ejemplo de comportamiento

Si la hora programada es `10:00`, se deben aceptar lecturas entre:

- Hora mínima válida: `08:00`
- Hora máxima válida: `12:00`

Si la hora ingresada está fuera de ese rango, mostrar un mensaje de error como:

> La hora de lectura debe estar dentro del rango permitido de ±2 horas respecto de la hora programada.

## 9. Tabla de lectura de submuestras

Cada lectura, tanto de 24 h como de 48 h, debe mostrar una tabla editable para registrar presencia o ausencia por muestra, duplicado, dilución y submuestra.

### Reglas de estructura

- Debe haber al menos **6 espacios de muestras + 1 duplicado**.
- Por cada muestra debe haber **3 submuestras por cada dilución**.
- Las diluciones disponibles son:
  - `1 ml`
  - `0,1 ml`
  - `0,01 ml`
- Cada celda de submuestra debe permitir marcar resultado:
  - Positivo
  - Negativo

### Tipo de control recomendado

Usar checkbox, toggle, radio button o selector binario por celda.

Para evitar ambigüedad, cada submuestra debería permitir una sola de estas opciones:

- `Positivo`
- `Negativo`
- `Sin registrar`

## 10. Etapa 4: Control de calidad

Esta etapa debe permitir registrar presencia o ausencia de colonias y/o crecimiento de colonias para los controles definidos.

### Campos de control
#### Control Coliformes Totales (24 horas)
* Control (+) K. aerogenes: campo radio button (presencia / ausencia)
* Control (-) S. aureus: campo radio button (presencia / ausencia)
* Control E. coli: campo radio button (presencia / ausencia)
* Control blanco: campo de texto editable

#### Control Coliformes Fecales (24 horas)
* Control (+) E. coli: campo radio button (presencia / ausencia)
* Control (-) K. aerogenes: campo radio button (presencia / ausencia)
* Control blanco: campo de texto editable

#### Control E. coli (24 horas)
* Control (+) E. coli: campo radio button (presencia / ausencia)
* Control (-) K. aerogenes: campo radio button (presencia / ausencia)
* Control blanco: campo de texto editable

- Estos campos deben ubicarse después de la tabla de lectura de 24 horas y después de la tabla de lectura de 48 horas. Deben estar separados por bloques.

## 11. Etapa 5: Datos finales y cálculo de resultados

Esta etapa debe mostrar o registrar los resultados finales del análisis.

### Campos
Tabla de resultados finales. Esta debe contener
* N° de muestra: campo de texto editable. Debe contener todas las muestras ingresadas en la etapa 3.
* Filas: CT (Coliformes Totales), CF (Coliformes Fecales), E.Coli (Escherichia Coli). Estas columnas deben ser editables
- La unidad de medida de cada valor ingresado debe aparecer al lado del valor ingresado en la columna (NMP/g). Por ejemplo: 450 NPM/g.
* Observaciones finales: campo de texto editable. 

## 12. Comportamiento de botones

### Botón Enviar

Al hacer clic en **Enviar**:

1. Validar todos los campos obligatorios.
2. Validar formato de fechas y horas.
3. Validar rango horario permitido para lecturas.
4. Validar que existan registros de submuestras para 24 h y 48 h.
5. Si todo es correcto, simular envío al servidor.
6. Mostrar mensaje de éxito.

Mensaje sugerido:

> Registro de análisis Enviado correctamente.

### Botón Cancelar

Al hacer clic en **Cancelar**:

1. Mostrar confirmación antes de descartar datos.
2. Si el usuario confirma, limpiar el formulario o volver a la pantalla anterior.

Mensaje sugerido:

> ¿Deseas cancelar el registro? Los datos ingresados se perderán.

## 13. Estados y mensajes de validación

Implementar estados visuales para:

- Campo obligatorio vacío.
- Formato de fecha inválido.
- Formato de hora inválido.
- Hora de lectura fuera del rango permitido.
- Submuestras incompletas.
- Error al enviar.
- Envío exitoso.

Ejemplos de mensajes:

- `Este campo es obligatorio.`
- `La fecha debe tener formato DD/MM.`
- `La hora debe tener formato HH:MM.`
- `La hora de lectura debe estar dentro del rango permitido de ±2 horas.`
- `Debe registrar las submuestras antes de enviar.`

## 14. Requisitos de usabilidad
- Las tablas deben ser fáciles de leer, con encabezados fijos o agrupados si es posible.
- Las diluciones deben aparecer como filas.
- Las muestras y duplicados deben aparecer como grupos de columnas.
- Usar etiquetas claras y consistentes.
- Mantener consistencia en unidades: `1 ml`, `0,1 ml`, `0,01 ml`.
- Destacar visualmente las secciones de lectura 24 h y 48 h.
- Mostrar resumen de resultados antes del envío final.

## 15. Instrucción final

Genera el prototipo completo del formulario siguiendo esta especificación.

Prioriza claridad, estructura visual y fidelidad al flujo de laboratorio. Implementa datos de ejemplo para los campos importados automáticamente y deja preparada la lógica para conectar el formulario a un servidor real.