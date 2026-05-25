# 1. Contexto general
Formulario Enterobacterias

Este documento contiene la estructura completa y los requerimientos funcionales para implementar la página del formulario de Enterobacterias.

La página debe permitir registrar el proceso completo del análisis microbiológico mediante tres etapas principales:
* Preparación
* Análisis (Lectura)
* Confirmación

- Cada etapa contiene campos y, cuando corresponde, subetapas internas asociadas al flujo real del análisis.
- La interfaz debe implementarse como un formulario multipaso de tipo stepper/wizard, utilizando un componente visual tipo StepWrapper para mostrar las etapas principales.
- Las etapas deben estar visibles y disponibles visualmente en todo momento. 
- El avance hacia una etapa posterior solo debe permitirse cuando la etapa inmediatamente anterior haya sido completada correctamente.

# 2. Estructura general del formulario

El formulario de Enterobacterias debe organizarse en las siguientes etapas principales:

## Preparación
### Pesado
### Homogeneización
### Sembrado
### Incubación
## Análisis (Lectura)
## Confirmación
### Incubación
### Lectura
### Resultados

El formulario debe permitir:
* Registrar la información inicial de identificación de la muestra.
* Registrar la información correspondiente al proceso de preparación.
* Registrar los datos de lectura del análisis.
* Registrar la información de confirmación.
* Registrar la prueba de oxidasa.
* Registrar los resultados finales y observaciones.
* Validar todos los campos obligatorios antes de continuar hacia el siguiente paso.
* Mostrar todas las etapas principales en el componente StepWrapper, respetando siempre el orden establecido.
* Conservar la información ingresada cuando el usuario navegue entre etapas o subetapas.

# 3. Características de la interfaz del formulario
* La interfaz debe tener:
- Diseño limpio, profesional y orientado al registro de análisis microbiológico.
- Un componente visual tipo StepWrapper que muestre siempre las tres etapas principales:
   Preparación
   Análisis (Lectura)
   Confirmación
- Subetapas claramente diferenciadas dentro de las etapas Preparación y Confirmación.
- Campos organizados según el orden real del proceso de laboratorio.
- Validaciones visuales para campos obligatorios, formatos inválidos y selecciones incompletas.
- Tablas editables para el registro de lecturas y resultados.
- Botones de navegación entre etapas y subetapas:
   Anterior
   Siguiente
   Finalizar
Estados visuales de las etapas

Las etapas principales y subetapas deben poder mostrar únicamente los siguientes estados:

- Pendiente: etapa aún no completada.
- Activa: etapa actualmente visualizada o en edición.
- Completada: etapa validada correctamente.

# 4. Flujo general del formulario

El formulario debe organizarse en el siguiente orden:
1. **Preparación**
   * Pesado
   * Homogeneización
   * Sembrado
   * Incubación
2. **Análisis (Lectura)**
3. **Confirmación**
   * Incubación
   * Lectura
   * Resultados

El flujo secuencial de avance debe ser el siguiente:

Preparación / Pesado
→ Preparación / Homogeneización
→ Preparación / Sembrado
→ Preparación / Incubación
→ Análisis (Lectura)
→ Confirmación / Incubación
→ Confirmación / Lectura
→ Confirmación / Resultados
→ Formulario completado

## Reglas generales de navegación
- Al ingresar al formulario, la etapa activa debe ser Preparación y la subetapa activa debe ser Pesado.
- Las tres etapas principales deben mostrarse siempre en el StepWrapper desde el inicio.
- **El usuario solo puede continuar hacia una etapa posterior cuando la etapa inmediatamente anterior esté completada correctamente.**
- Dentro de Preparación, el usuario solo puede continuar hacia una subetapa posterior cuando la subetapa anterior esté completada correctamente.
- Dentro de Confirmación, el usuario solo puede continuar hacia una subetapa posterior cuando la subetapa anterior esté completada correctamente.
- Si el usuario intenta avanzar sin completar correctamente el paso actual, debe permanecer en el mismo paso y deben mostrarse los errores de validación correspondientes.
- El usuario puede regresar a etapas o subetapas anteriores ya completadas para consultar o modificar información, siempre que tenga permisos de edición.
- Al modificar una etapa anterior, si los nuevos datos dejan de cumplir las validaciones, no debe permitirse completar nuevamente las etapas posteriores hasta corregir la información.
- Los datos ingresados deben conservarse mientras el usuario navega entre etapas y subetapas.
- Al completar la última subetapa de Confirmación, el formulario debe cambiar su estado general a Completado.
Regla específica sobre lectura de 24 horas

La página debe incluir los campos de registro correspondientes a la lectura de 24 horas dentro de la etapa Análisis (Lectura), porque forman parte del formulario.

La página únicamente debe permitir capturar manualmente la información de la lectura mediante los campos definidos.

# 5. Reglas generales de campos y validación
## 5.1. Formato de fecha y hora

Para todos los campos que registren fecha, hora y analista:

La fecha debe utilizar formato DD-MM-AA.
La hora debe utilizar formato HH:MM, en formato de 24 horas.
El analista debe registrarse mediante un campo de texto editable o mediante el componente de selección de analista que ya exista en la aplicación.
No deben permitirse fechas posteriores a la fecha actual.

Cuando el formulario original represente un concepto como Fecha/Hora/Analista, debe implementarse visualmente como tres campos claramente identificados:
- Fecha
- Hora
- Analista
## 5.2. Campos obligatorios
Todos los campos marcados como obligatorios deben identificarse visualmente.
El usuario no debe poder continuar al siguiente paso si alguno de los campos obligatorios del paso actual está vacío o contiene un valor inválido.
Mensaje de validación:

El campo [nombre del campo] es obligatorio.

## 5.3. Campos numéricos
- Los campos numéricos deben aceptar únicamente números.
- No deben aceptar valores negativos.
- Si un campo numérico opcional contiene información, el valor también debe validarse.
Mensaje de validación:
- Ingrese un valor numérico válido.

## 5.4. Selecciones únicas

Los siguientes campos deben permitir seleccionar una sola opción:
- Estufa.
- Placas.
- Equipo Cuenta Colonias.
- Desaireado de Agar Glucosa.

## 5.5. Selecciones obligatorias

Cuando un grupo de selección obligatorio no tenga ninguna opción seleccionada, mostrar:
- Debe seleccionar al menos una opción.

Cuando un grupo de selección única permita accidentalmente más de una opción, mostrar:
- Debe seleccionar solo una opción.

# 6. Etapa 1: Preparación

Esta etapa debe registrar los datos iniciales de la muestra y las actividades previas al análisis.
Debe contener cuatro subetapas:

* Pesado
* Homogeneización
* Sembrado
* Incubación

La etapa debe considerarse completada únicamente cuando las cuatro subetapas hayan sido completadas correctamente.

## 6.1. Subetapa: Pesado

Esta subetapa debe permitir registrar la identificación de la muestra y la información inicial del proceso.

### Campos
* Código ALI: campo de texto autocompletado. Obligatorio.
* N° Acta: campo de texto editable. Obligatorio.
* Tipo de muestra: campo tipo select o dropdown. Obligatorio.
Opciones:
   * Mixta
   * Homogénea
* N° de Muestra (10 gr / 90 ml): campo numérico editable. Opcional.
* N° de Muestra (50 gr / 450 ml): campo numérico editable. Opcional.
* Fecha de inicio: campo de fecha editable. Obligatorio. Formato DD-MM-AA.
* Hora de inicio: campo de hora editable. Obligatorio. Formato HH:MM.
* Analista de inicio: campo de texto editable. Obligatorio.

### Reglas de interacción
- El campo Código ALI debe mostrar el valor autocompletado asociado al análisis.
- El campo Tipo de muestra debe permitir seleccionar únicamente una opción.
- Los campos numéricos opcionales pueden permanecer vacíos.
- Si los campos numéricos opcionales son completados, deben aceptar únicamente números válidos no negativos.

### Validaciones
- Código ALI es obligatorio.
- N° Acta es obligatorio.
- Tipo de muestra es obligatorio.
- Fecha de inicio es obligatoria y no puede ser posterior a la fecha actual.
- Hora de inicio es obligatoria y debe tener formato válido.
- Analista de inicio es obligatorio.
- Los campos numéricos opcionales deben validarse cuando contengan información.

### Comportamiento de avance
- El usuario solo puede continuar desde Pesado hacia Homogeneización cuando todos los campos obligatorios de esta subetapa sean válidos.

## 6.2. Subetapa: Homogeneización

Esta subetapa debe permitir registrar la fecha, hora y analista responsable de la homogeneización.

### Campos
* Fecha de homogeneización: campo de fecha editable. Obligatorio. Formato DD-MM-AA.
* Hora de homogeneización: campo de hora editable. Obligatorio. Formato HH:MM.
* Analista de homogeneización: campo de texto editable. Obligatorio.

### Validaciones
* Fecha de homogeneización es obligatoria y no puede ser posterior a la fecha actual.
* Hora de homogeneización es obligatoria y debe tener formato válido.
* Analista de homogeneización es obligatorio.

### Comportamiento de avance

El usuario solo puede continuar desde Homogeneización hacia Sembrado cuando todos los campos obligatorios de esta subetapa sean válidos.

## 6.3. Subetapa: Sembrado

Esta subetapa debe permitir registrar los datos asociados al sembrado, la estufa, las placas y las micropipetas utilizadas.

### Campos
* Agar VRBG: campo de texto editable. Obligatorio.
* Estufa: campo tipo radio button. Obligatorio.
Opciones:
   * Estufa 73-M
   * Estufa 2-M
* Placas: grupo de selección. Obligatorio.
Debe permitir seleccionar una única opción.
Sus opciones deben provenir del catálogo o configuración existente.
* Micropipetas 1 ml: grupo de selección. Obligatorio.
* Fecha de sembrado: campo de fecha editable. Obligatorio. Formato DD-MM-AA.
* Hora de sembrado: campo de hora editable. Obligatorio. Formato HH:MM.
* Analista de sembrado: campo de texto editable. Obligatorio.

### Reglas de interacción
- En Estufa, el usuario debe seleccionar una única opción.
- En Placas, el usuario debe seleccionar una única opción.
- En Micropipetas 1 ml, debe seleccionarse la opción disponible 100.
- Las opciones correspondientes a Placas no deben inventarse si no existen en la aplicación.

### Validaciones
- Agar VRBG es obligatorio.
- Debe existir una estufa seleccionada.
- Debe existir una placa seleccionada.
- Debe existir una micropipeta seleccionada.
- Fecha de sembrado es obligatoria y no puede ser posterior a la fecha actual.
- Hora de sembrado es obligatoria y debe tener formato válido.
- Analista de sembrado es obligatorio.

### Comportamiento de avance

El usuario solo puede continuar desde Sembrado hacia Incubación cuando todos los campos obligatorios de esta subetapa sean válidos.

## 6.4. Subetapa: Incubación

Esta subetapa debe permitir registrar la información correspondiente a la incubación dentro de la etapa de preparación.

### Campos
* Agar VRBG: campo de texto editable. Obligatorio.
* Estufa: campo tipo radio button. Obligatorio.
Opciones:
* Estufa 73-M
* Estufa 2-M
* Fecha término: campo de fecha editable. Obligatorio. Formato DD-MM-AA.
* Hora término: campo de hora editable. Obligatorio. Formato HH:MM.
* Analista: campo de texto editable. Obligatorio.

### Reglas de interacción
* En Estufa, solo debe permitirse seleccionar una opción.

### Validaciones
* Agar VRBG es obligatorio.
* Debe existir una estufa seleccionada.
* Fecha término es obligatoria y no puede ser posterior a la fecha actual.
* Hora término es obligatoria y debe tener formato válido.
* Analista es obligatorio.

### Comportamiento de avance
Al completar correctamente esta subetapa:

La subetapa Incubación debe marcarse como completada.
La etapa Preparación debe marcarse como completada.
El usuario debe poder continuar hacia la etapa Análisis (Lectura).

# 7. Etapa 2: Análisis (Lectura)

Esta etapa debe permitir registrar manualmente la información correspondiente a la lectura del análisis y el equipo utilizado para el conteo de colonias.

Esta etapa no debe incluir ningún sistema de notificación, aviso, recordatorio o temporizador relacionado con el transcurso de 24 horas.

## Campos
* Fecha de lectura 24 hrs: campo de fecha editable. Obligatorio. Formato DD-MM-AA.
* Hora de lectura 24 hrs: campo de hora editable. Obligatorio. Formato HH:MM.
* Analista de lectura 24 hrs: campo de texto editable. Obligatorio.
* N° de muestra: campo numérico editable. Obligatorio.
* Dilución: campo numérico editable. Obligatorio.
* (C): campo numérico editable. Obligatorio.
* Equipo Cuenta Colonias: grupo de selección. Obligatorio. Debe permitir seleccionar una única opción.
Sus opciones deben provenir del catálogo o configuración existente en la aplicación.

## Reglas de interacción
* Los campos de fecha, hora y analista deben permitir registrar manualmente la lectura realizada.
* No debe mostrarse ningún mensaje automático relacionado con cuándo debe efectuarse la lectura.
* En Equipo Cuenta Colonias, solo debe permitirse seleccionar una opción.
* Las opciones del equipo no deben inventarse si todavía no se encuentran definidas en el sistema.

## Validaciones
* Fecha de lectura 24 hrs es obligatoria y no puede ser posterior a la fecha actual.
* Hora de lectura 24 hrs es obligatoria y debe tener formato válido.
* Analista de lectura 24 hrs es obligatorio.
* N° de muestra es obligatorio y debe contener un valor numérico válido.
* Dilución es obligatorio y debe contener un valor numérico válido.
(C) es obligatorio y debe contener un valor numérico válido.
* Debe existir un equipo cuenta colonias seleccionado.

## Comportamiento de avance

Al completar correctamente esta etapa:

La etapa Análisis (Lectura) debe marcarse como completada.
El usuario debe poder continuar hacia la etapa Confirmación.
La primera subetapa disponible para completar dentro de Confirmación debe ser Incubación.

# 8. Etapa 3: Confirmación

Esta etapa debe permitir registrar la incubación de confirmación, la lectura, la prueba de oxidasa y los resultados finales.

## Debe contener tres subetapas:
* Incubación
* Lectura
* Resultados

La etapa debe considerarse completada únicamente cuando las tres subetapas hayan sido completadas correctamente.

## 8.1. Subetapa: Incubación

Esta subetapa debe permitir registrar el traspaso, el agar nutritivo y la estufa utilizada durante la confirmación.

### Campos
* Fecha de traspaso: campo de fecha editable. Obligatorio. Formato DD-MM-AA.
* Hora de traspaso: campo de hora editable. Obligatorio. Formato HH:MM.
* Analista de traspaso: campo de texto editable. Obligatorio.
* Agar Nutritivo: campo de texto editable. Obligatorio.
* Estufa: campo tipo radio button. Obligatorio.
Opciones:
   * Estufa 73-M (35.0 +/- 0.5 °C)
   * Estufa 2-M (35.5 +/- 0.5 °C)
### Reglas de interacción
* En Estufa, solo debe permitirse seleccionar una opción.
### Validaciones
* Fecha de traspaso es obligatoria y no puede ser posterior a la fecha actual.
* Hora de traspaso es obligatoria y debe tener formato válido.
* Analista de traspaso es obligatorio.
* Agar Nutritivo es obligatorio.
* Debe existir una estufa seleccionada.

### Comportamiento de avance

El usuario solo puede continuar desde Incubación hacia Lectura cuando todos los campos obligatorios de esta subetapa sean válidos.

## 8.2. Subetapa: Lectura

Esta subetapa debe permitir registrar la lectura de confirmación, los valores correspondientes a placas y la prueba de oxidasa.

Debe contener tres bloques:
- Datos generales de lectura
- Tabla de lectura de placas
- Prueba de oxidasa y Agar Glucosa

## 8.2.1. Datos generales de lectura
### Campos
* Fecha de lectura: campo de fecha editable. Obligatorio. Formato DD-MM-AA.
* Hora de lectura: campo de hora editable. Obligatorio. Formato HH:MM.
* Analista de lectura: campo de texto editable. Obligatorio.

### Validaciones
* Fecha de lectura es obligatoria y no puede ser posterior a la fecha actual.
* Hora de lectura es obligatoria y debe tener formato válido.
* Analista de lectura es obligatorio.

## 8.2.2. Tabla de lectura de placas

Debe mostrarse una tabla editable con los siguientes campos:

* N° muestra / placa 1: campo numérico editable.
* N° muestra / placa 2: campo numérico editable.
* Duplicado / placa 1: campo numérico editable.
* Duplicado / placa 2: campo numérico editable.

### Reglas de estructura
* La tabla debe mostrar claramente los valores correspondientes a muestra y duplicado.
* Cada celda debe permitir el ingreso de valores numéricos.
* No deben permitirse valores negativos.
* Estos campos no deben considerarse obligatorios, debido a que la especificación original no los identifica expresamente como tales.
* Si el usuario ingresa información, los valores deben validarse.

### Mensaje de validación

Ingrese un valor numérico válido.

## 8.2.3. Prueba de oxidasa y Agar Glucosa
### Campos
* Fecha de Prueba Oxidasa: campo de fecha editable. Obligatorio. Formato DD-MM-AA.
* Hora de Prueba Oxidasa: campo de hora editable. Obligatorio. Formato HH:MM.
* Analista de Prueba Oxidasa: campo de texto editable. Obligatorio.
* Test Oxidasa / Reactivo de Oxidasa: campo de texto editable. Obligatorio.
* Desaireado de Agar Glucosa: control de selección única.
Las opciones deben obtenerse desde la definición disponible en la aplicación o desde la configuración correspondiente.
No deben inventarse opciones si no han sido definidas.
* Agar Glucosa: campo de texto editable.
* Control (+) E. coli: campo de texto editable.
* Control (-) P. aeruginosa: campo de texto editable.
* Blanco: campo de texto editable.

### Reglas de interacción
* En Desaireado de Agar Glucosa, solo debe permitirse seleccionar una opción.
* El campo Test Oxidasa / Reactivo de Oxidasa debe validarse según el formato establecido.

### Validaciones
* Fecha de Prueba Oxidasa es obligatoria y no puede ser posterior a la fecha actual.
* Hora de Prueba Oxidasa es obligatoria y debe tener formato válido.
* Analista de Prueba Oxidasa es obligatorio.
* Test Oxidasa / Reactivo de Oxidasa es obligatorio.
* Debe existir un desaireado de Agar Glucosa seleccionado.
* Agar Glucosa es obligatorio.
* Control (+) E. coli es obligatorio.
* Control (-) P. aeruginosa es obligatorio.
* Blanco es obligatorio.

### Validación del Reactivo de Oxidasa
El valor ingresado en Test Oxidasa / Reactivo de Oxidasa debe tener el siguiente formato:

R69-AA-NN

Donde:

* R69 es un valor fijo obligatorio.
* AA corresponde al año en dos dígitos.
* NN corresponde al número de lote.

### Reglas de validación
* R69 debe coincidir exactamente con el texto fijo "R69".
* AA debe ser un número entre 00 y 99 (inclusive).
* NN debe ser un número de dos dígitos.

### Ejemplos válidos:
R69-23-01
R69-24-15
R69-25-99

### Ejemplos inválidos:
R69-3-01
R69-23-1
R69-23-001
R69-23
Rx9-23-01

### Mensajes de error
* El formato no coincide
* El año no es válido (03)
* El lote no es válido (001)
* Falta el lote
* La sigla no es correcta

### Reglas de interacción
- En Desaireado de Agar Glucosa, solo debe permitirse seleccionar una opción.
- El campo Test Oxidasa / Reactivo de Oxidasa debe validarse según el formato establecido.

### Validación del Reactivo de Oxidasa
El valor ingresado en Test Oxidasa / Reactivo de Oxidasa debe tener el siguiente formato:

R69-AA-NN

Donde:

* R69 es un valor fijo obligatorio.
* AA corresponde al año en dos dígitos.
* NN debe ser exclusivamente 01 o 02.

### Ejemplos válidos
* R69-25-01
* R69-25-02

### Ejemplos inválidos
* R69-2025-01
* R69-25-03
* R68-25-01
* R69/25/01

### Mensaje de validación
El formato del Reactivo de Oxidasa debe ser R69-AA-NN donde AA es el año en 2 dígitos y NN es 01 o 02. Ejemplo: R69-25-01.

### Comportamiento de avance
El usuario solo puede continuar desde Lectura hacia Resultados cuando:

* Los campos obligatorios de datos generales de lectura sean válidos.
* Los campos obligatorios de la prueba de oxidasa sean válidos.
* El Reactivo de Oxidasa cumpla el formato requerido.
* Todos los valores numéricos ingresados en la tabla sean válidos.

## 8.3. Subetapa: Resultados

Esta subetapa debe permitir registrar los resultados finales del análisis y las observaciones correspondientes.

### Campos

Debe mostrarse una tabla editable con los siguientes campos:

* N° muestra / b: campo numérico editable.
* N° muestra / a: campo numérico editable.
* d: campo numérico editable.
* n1: campo numérico editable.
* n2: campo numérico editable.
* m: campo numérico editable.
* Σa: campo numérico editable.

Además, debe incluir:

* Observaciones: campo de texto multilínea editable.

### Comportamiento de finalización
Al finalizar correctamente esta subetapa:

* La subetapa Resultados debe marcarse como completada.
* La etapa Confirmación debe marcarse como completada.
El formulario completo debe cambiar su estado visual a Completado.
Debe mostrarse un mensaje de éxito.

Mensaje sugerido:

Registro de análisis completado correctamente.

# 9. Reglas de avance entre etapas y subetapas
Regla principal

- Las etapas y subetapas nunca deben visualizarse como bloqueadas.
- El control del flujo debe realizarse exclusivamente mediante la validación al intentar continuar hacia un paso posterior.
- No se debe cambiar la etapa o subetapa activa.
- Se deben mostrar los errores de validación del paso actual.

# 10. Reglas de validación para fechas y horas

Todos los campos de fecha y hora del formulario deben respetar las siguientes reglas:

* La fecha debe ingresarse o visualizarse en formato DD-MM-AA.
* La hora debe ingresarse o visualizarse en formato HH:MM.
* Ninguna fecha puede ser posterior a la fecha actual.
* Los campos obligatorios de fecha y hora deben validarse antes de permitir continuar.
* Cuando exista un grupo Fecha / Hora / Analista, los tres campos deben completarse si el grupo está definido como obligatorio.

### Mensajes de validación
* Campo obligatorio vacío:

El campo [nombre del campo] es obligatorio.

* Fecha con formato inválido:

La fecha debe tener formato DD-MM-AA.

* Fecha futura:

La fecha no puede ser posterior a la fecha actual.

* Hora con formato inválido:

La hora debe tener formato HH:MM.

# 11. Tablas editables del formulario

El formulario debe contener dos tablas editables dentro de la etapa Confirmación:

Tabla de lectura de placas
Tabla de resultados

### 11.1. Tabla de lectura de placas

La tabla debe incluir los siguientes campos:

* N° muestra / placa 1
* N° muestra / placa 2
* Duplicado / placa 1
* Duplicado / placa 2

### 11.2. Tabla de resultados

La tabla debe incluir los siguientes campos:

* N° muestra / b
* N° muestra / a
* d
* n1
* n2
* m
* Σa

12. Equipos, utensilios y controles de selección

Esta sección define los campos que requieren selección de equipos, utensilios o condiciones de proceso.

Estufa en Preparación / Sembrado

Opciones:
Estufa 73-M (35.0 +/- 0.5 °C)
Estufa 2-M (35.5 +/- 0.5 °C)
Estufa en Preparación / Incubación

Opciones:

Estufa 73-M (35.0 +/- 0.5 °C)
Estufa 2-M (35.5 +/- 0.5 °C)
Estufa en Confirmación / Incubación

Opciones:

* Estufa 73-M (35.0 +/- 0.5 °C)
* Estufa 2-M (35.5 +/- 0.5 °C)

* Placas
- Campo obligatorio.
- Selección única.
- Opciones cargadas desde el catálogo o configuración existente.

* Equipo Cuenta Colonias
- Campo obligatorio.
- Selección única.
Opciones cargadas desde el catálogo o configuración existente.
* Desaireado de Agar Glucosa
- Control de selección única.
- Sus opciones deben cargarse desde la definición o configuración disponible en la aplicación.
- No deben inventarse opciones no indicadas en la especificación original.

### Reglas de interacción
- En cada selección de Estufa, solo puede elegirse una opción.
- En Placas, solo puede elegirse una opción.
- En Equipo Cuenta Colonias, solo puede elegirse una opción.
- En Desaireado de Agar Glucosa, solo puede elegirse una opción.

### 13. Comportamiento de botones

#### Botón Siguiente

Al hacer clic en Siguiente:

* Validar los campos obligatorios del paso actual.
* Validar formatos de fecha y hora.
* Validar que las fechas no sean posteriores a la fecha actual.
* Validar selecciones obligatorias y selecciones únicas.
* Validar campos numéricos correspondientes.
* Validar el formato del Reactivo de Oxidasa cuando el usuario se encuentre en la subetapa correspondiente.
* Si existen errores, permanecer en el paso actual y mostrar los mensajes de validación.
* Si no existen errores, marcar el paso actual como completado y mostrar el siguiente paso.

#### Botón Anterior

Al hacer clic en Anterior:
* Volver a la subetapa o etapa anterior.
* Conservar todos los valores ingresados.
* Permitir editar la información previa cuando el usuario tenga permisos de edición.

#### Botón Finalizar 

Al hacer clic en Finalizar:

Validar toda la información requerida del formulario.
Impedir la finalización si existen errores o campos obligatorios incompletos.
Marcar el formulario como completado cuando la información sea válida.
Mostrar el mensaje de éxito correspondiente.

Mensaje sugerido:

Registro de análisis completado correctamente.

# 14. Estados y mensajes de validación

Implementar estados visuales para:

Campo obligatorio vacío.
Formato de fecha inválido.
Formato de hora inválido.
Fecha posterior a la fecha actual.
Campo numérico inválido.
Selección obligatoria incompleta.
Selección única inválida.
Formato inválido del Reactivo de Oxidasa.
Error al finalizar.
Registro completado correctamente.
Formulario en modo solo lectura.

# 15. Requisitos de usabilidad

Las tres etapas principales deben mostrarse siempre en el StepWrapper en el siguiente orden:

* Preparación
* Análisis (Lectura)
* Confirmación

- Todas las etapas deben ser visibles desde el inicio del formulario.
- El avance debe controlarse validando la finalización correcta del paso inmediatamente anterior.
- Las subetapas deben mostrarse claramente dentro de la etapa correspondiente.
- Los campos obligatorios deben estar claramente identificados.
- Los mensajes de error deben mostrarse cerca del campo afectado.
- Los campos de fecha, hora y analista deben presentarse de forma ordenada y consistente.
- Las tablas deben ser fáciles de leer y editar.
- Los controles de selección deben mostrar claramente todas las opciones disponibles.
- Los datos ingresados deben conservarse cuando el usuario avance o retroceda.
- Debe mantenerse consistencia en las etiquetas de equipos, reactivos, muestras y controles durante todo el formulario.

# 16. Requisitos de implementación
- Utilizar los componentes, estilos y patrones existentes en la aplicación.
- Reutilizar el componente visual tipo StepWrapper para representar las etapas principales.
- Mantener las etapas siempre visibles y sin estados de bloqueo.
- Controlar el avance mediante validación del paso anterior, no mediante deshabilitación visual permanente de etapas.
- Reutilizar componentes existentes para:
   - Inputs de texto.
   - Inputs numéricos.
   - Fechas.
   - Horas.
   - Selects.
   - Radio buttons.
   - Checkboxes.
   - Tablas.
   - Mensajes de error.
   - Botones.
- Utilizar las librerías de formularios y validación ya existentes en el proyecto, si están disponibles.
- Centralizar las reglas de validación para evitar duplicación.
- Mantener los catálogos configurables separados de la lógica visual.
- Respetar las reglas de accesibilidad:
  - Labels asociados a inputs.
  - Navegación por teclado.
  - Estados de error accesibles.
- No implementar backend, persistencia definitiva, servicios externos ni nuevas reglas de autorización, salvo que ya existan en el proyecto.
- No implementar notificaciones, recordatorios, temporizadores ni automatizaciones relacionadas con la lectura de 24 horas.


# Instrucción final

Genera el prototipo completo de la página del formulario de Enterobacterias siguiendo exactamente esta especificación.

Implementa el flujo como un formulario tipo stepper/wizard, utilizando un componente visual tipo StepWrapper para mostrar siempre las etapas principales en el orden definido.

Las etapas y subetapas deben permanecer visibles y no deben manejar estados de bloqueo. El usuario únicamente podrá continuar hacia un paso posterior cuando el paso anterior haya sido completado correctamente y sus datos sean válidos.

La etapa Análisis (Lectura) debe permitir registrar manualmente los campos correspondientes a la lectura de 24 horas, pero la página no debe implementar notificaciones, recordatorios, temporizadores ni avisos automáticos relacionados con dicho plazo.

Prioriza claridad visual, estructura profesional, fidelidad al proceso de laboratorio, validaciones visibles, navegación consistente y conservación de la información ingresada.

Utiliza los componentes, estilos, validaciones, mecanismos de permisos y patrones ya existentes en la aplicación. No inventes catálogos, opciones, roles, permisos, cálculos, servicios, notificaciones ni reglas de negocio que no hayan sido expresamente definidos o que no existan previamente en el proyecto.