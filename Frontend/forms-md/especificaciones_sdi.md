# Formulario Solicitud de Ingreso
Este documento contiene la estructura completa del formulario Solicitud de Ingreso y los requerimientos para la digitalización del formulario de solicitud de ingreso de muestras.

## Estructura
El formulario de solicitud de ingreso está estructurado en etapas, cada una con sus propios campos y validaciones. Las etapas son las siguientes:
1. Identificación de solicitud
2. Información del Cliente
3. Recepción
4. Muestreo
5. Análisis
6. Envases y almacenamiento
7. Observaciones de laboratorio
8. Flujo
9. Entrega 
10. Informes

## Campos 
Cada etapa tiene sus propios campos y validaciones.

**Etapa 1: Identificación de solicitud**
- Año de ingreso: campo de texto autocompletado con el año actual 
- Codigo ALI: campo numérico autogenerado
- Número de Acta: campo de texto autogenerado
- Codigo externo: campo de texto autogenerado (campo editable)
- Categoría: campo tipo select con opciones

**Etapa 2: Información del Cliente**
- Nombre del cliente: campo de texto editable
- Dirección: campo de texto editable
- Nombre del solicitante: campo de texto editable

**Etapa 3: Recepción**
- Fecha de recepción: campo datetime editable
- Condiciones de recepción (temperatura °C): campo numérico editable
- 

**Etapa 4: Muestreo**
- Fecha de inicio de muestreo: campo datetime editable
- Fecha de término de muestreo: campo datetime editable
- Número de muestras: campo numérico editable
- Número de envases: campo numérico editable
- Analista responsable: campo de texto editable 
- Lugar de muestreo: campo de texto editable
- Instructivo de muestreo: campo de texto editable

**Etapa 5: Análisis**
**Etapa 6: Envases y almacenamiento**
**Etapa 7: Observaciones de laboratorio**
**Etapa 8: Flujo**
**Etapa 9: Entrega**
**Etapa 10: Informes**

## Requerimientos 

- Todos los campos obligatorios están marcados visualmente con indicador (ej. asterisco rojo).
- El sistema muestra mensaje de error específico cuando se intenta guardar el formulario sin completar los campos obligatorios.
- Todos los campos deben ser completados para guardar el formulario.
- Al seleccionar el tipo de análisis, el sistema genera los distintos formularios asociados a ese tipo de análisis, asociandolos con el código ALI.
- Cuando se ingrese una nueva solicitud en el formulario de ingreso area, se debe generar automaticamente el formulario TPA asociado a esa solicitud.
- El formulario debe tener una lista tipo checklist con los formularios que estan asociados al tipo de analisis, permitiendo seleccionar formularios adicionales.
- Cada formulario seleccionado se debe generar con el código ALI asignado a la solicitud. 
- Los formularios seleccionados se deben generar de forma automatica al guardar la solicitud.
- El formulario incluye un campo tipo checkbox, seleccionable por el usuario, para indicar si la muestra es compartida con el área de Química.
- El formulario de ingreso de area debe tener un campo select, seleccionable por el usuario, para indicar el equipo de almacenamiento.
- El formulario de solicitud de ingreso debe tener un botón para agregar múltiples muestras dentro de la solicitud.
- A cada una de las muestras se le debe asociar uno o más formularios de análisis, permitiendole al usuario seleccionar o quitar los formularios deseados.
- El formulario de solicitud de ingreso debe consolidar automáticamente todos los formularios de las muestras seleccionadas.
- Al enviar el formulario de solicitud de ingreso a validación, el sistema registra automáticamente la fecha y hora de envío exacta.
- La fecha y hora de envío a validación debe ser visible para el usuario en el detalle de la solicitud


-----
Versión 2

# Formulario Solicitud de Ingreso
Este documento contiene la estructura completa del formulario Solicitud de Ingreso y los requerimientos para la digitalización del formulario de solicitud de ingreso de muestras.

**Tarea**: Implementa un prototipo funcional del formulario “Solicitud de Ingreso de muestras”.

El formulario debe permitir **registrar solicitudes, ingresar información por etapas, agregar múltiples muestras, asociar formularios de análisis, generar formularios automáticamente y mantener trazabilidad del flujo.**

## 1. Estructura base del formulario
El formulario debe estar organizado en 10 etapas principales, visibles como navegación por pasos, pestañas o secciones tipo wizard:
- **Etapa 1**: Identificación de solicitud
- **Etapa 2**: Información del Cliente
- **Etapa 3**: Recepción
- **Etapa 4**: Muestreo
- **Etapa 5**: Análisis
- **Etapa 6**: Envases y almacenamiento
- **Etapa 7**: Observaciones de laboratorio
- **Etapa 8**: Flujo
- **Etapa 9**: Entrega
- **Etapa 10**: Informes
Cada etapa debe tener su propio bloque visual, título claro y campos agrupados de forma ordenada.

## 2. Campos por etapa

### Etapa 1 — Identificación de solicitud
**Campos:**
- Año de ingreso
    Tipo: texto o numérico
    Comportamiento: autocompletado con el año actual
    Estado: solo lectura
- Código ALI
    Tipo: numérico o texto
    Comportamiento: autogenerado
    Estado: solo lectura
- Número de Acta
    Tipo: texto
    Comportamiento: autogenerado
    Estado: solo lectura
- Código externo
    Tipo: texto
    Comportamiento: autogenerado
    Estado: editable
- Categoría
    Tipo: select

### Etapa 2 — Información del Cliente
**Campos:**
- Nombre del cliente
    Tipo: texto
    Estado: editable
- Dirección
    Tipo: texto
    Estado: editable
- Nombre del solicitante
    Tipo: texto
    Estado: editable
- Notas del cliente
    Tipo: textarea
    Estado: editable

### Etapa 3 — Recepción
**Campos:**
- Fecha de recepción
    Tipo: datetime
    Estado: editable
- Condiciones de recepción / Temperatura °C
    Tipo: numérico
    Estado: editable

### Etapa 4 — Muestreo
**Campos:**
- Fecha de inicio de muestreo
    Tipo: datetime
    Estado: editable
- Fecha de término de muestreo
    Tipo: datetime
    Estado: editable
- Número de muestras
    Tipo: numérico
    Estado: editable
- Número de envases
    Tipo: numérico
    Estado: editable
- Analista responsable
    Tipo: texto
    Estado: editable
- Lugar de muestreo
    Tipo: texto
    Estado: editable
- Instructivo de muestreo
    Tipo: texto
    Estado: editable

### Etapa 5 — Análisis
**Campos y elementos:**
- Tipo de análisis
    Tipo: select
    **Importante**: Al seleccionar un tipo de análisis, **el sistema debe generar o mostrar los formularios asociados a ese tipo**.
- Checklist de formularios asociados
    Tipo: lista con checkboxes
    Debe permitir **seleccionar formularios adicionales**.
    Debe permitir **quitar formularios seleccionados**.
El formulario TPA debe generarse por defecto al crear una solicitud.
**Cada formulario seleccionado debe quedar asociado al Código ALI.**

### Etapa 6 — Envases y almacenamiento
**Campos:**
- Equipo de almacenamiento
    Tipo: select
    Opciones iniciales: REFRIGERADOR 2-I; CONGELADOR 4-1; MUEBLE 1; GABINETE MICROBIOLOGÍA
- Muestra compartida con Química
    Tipo: checkbox
    Estado: seleccionable por el usuario

### Etapa 7 — Observaciones de laboratorio
**Campos:**
- Observaciones de laboratorio
    Tipo: textarea
    Estado: editable

### Etapa 8 — Flujo
Debe mostrar información del estado de la solicitud.
**Elementos:**
- Estado actual de la solicitud
    Tipo: indicador visual o badge
- Fecha y hora de envío a validación
    Tipo: datetime visible
    Comportamiento: se registra automáticamente al enviar la solicitud a validación
    **Acción**: Al presionar el botón **Enviar a validación**:
    * Registrar fecha y hora exacta del envío
    * Cambiar el estado del flujo
    * Mostrar la fecha y hora en el detalle de la solicitud

### Etapa 9 — Entrega
Debe mostrar los tiempos estimados de entrega.
**Elementos:**
- Tiempo de entrega de la solicitud
Tipo: valor calculado
Comportamiento: calculado automáticamente por el sistema según:
* días base
* tiempo adicional laboratorio
- Fecha estimada de entrega
Tipo: valor calculado

### Etapa 10 — Informes
Debe quedar habilitada como sección de cierre del formulario.
**Elementos mínimos:**
- Resumen de la solicitud
- Formularios generados
- Código ALI asociado
- Estado del flujo

## 3. Flujo lógico de interacción entre etapas

El prototipo debe seguir este flujo:
El usuario inicia una nueva solicitud.
El sistema autocompleta:
* Año de ingreso
* Código ALI
* Número de Acta
* Código externo editable
El usuario completa la información del cliente.
El usuario registra los datos de recepción.
El usuario registra los datos de muestreo.
El usuario selecciona el tipo de análisis.
El sistema muestra los formularios asociados al tipo de análisis.
El sistema agrega automáticamente el formulario TPA.
El sistema genera los formularios seleccionados en la solicitud.
El usuario puede seleccionar o quitar formularios adicionales.
El usuario puede agregar una o más muestras a la solicitud.
Para **cada muestra**, el usuario puede **asociar uno o más formularios de análisis**.
El sistema consolida automáticamente todos los formularios seleccionados en la solicitud principal.
El usuario selecciona el equipo de almacenamiento.
El usuario puede marcar si la muestra es compartida con Química.
El sistema calcula y muestra el tiempo de entrega.
El usuario guarda la solicitud.
El sistema valida que todos los campos obligatorios estén completos.
Si faltan campos obligatorios, el sistema muestra errores específicos.
Si la solicitud está completa, el sistema permite enviarla a validación.
Al enviar a validación, el sistema registra fecha y hora exacta.
La fecha y hora de envío a validación queda visible en el detalle de la solicitud.

## 4. Gestión de múltiples muestras
El formulario debe permitir agregar múltiples muestras dentro de una misma solicitud.
Diseñar una sección o componente específico para esto.

Cada muestra debe permitir:
* **Identificar** la muestra dentro de la solicitud
* **Asociar** uno o más formularios de análisis
* **Seleccionar** formularios desde checklist
* **Quitar** formularios previamente seleccionados

El sistema debe:
- Mantener la solicitud principal asociada a un **único Código ALI**
- Asociar los formularios de cada muestra al Código ALI
- Consolidar automáticamente todos los formularios de las muestras
- Mostrar un resumen de formularios consolidados

## 5. Validaciones
Implementar validaciones visuales y lógicas.

Reglas:
- Todos los **campos obligatorios deben estar marcados con asterisco rojo**.
- No se puede guardar la solicitud si faltan campos obligatorios.
- Cada error debe indicar específicamente qué campo falta o es inválido.
- Los campos autogenerados deben mostrarse, pero no ser editables, salvo el Código externo.
- Las fechas deben usar formato datetime.
- Los campos numéricos deben aceptar solo valores numéricos.

## 6. Diseño de interfaz
Diseñar una interfaz clara, ordenada y profesional.
* Visualmente debe estar organizado por etapas
* Usar layout tipo wizard, stepper o pestañas.
* Debe indicar el nombre de cada etapa.
* Debe incluir progreso visual entre etapas.
* Agrupar campos relacionados en tarjetas o bloques.
* Usar una grilla responsive para los campos.
* Mantener jerarquía visual clara entre:
    * título de etapa
    * descripción breve
    * campos
    * acciones

Tipos de campos
Usar los siguientes tipos de componentes:
- Text input
- Numeric input
- Datetime picker
- Select
- Checkbox
- Textarea
- Checklist con checkboxes
- Botones de acción
- Badges o indicadores de estado
- Resumen consolidado

Acciones principales
Debes incluir botones para:
* Guardar solicitud
* Agregar muestra
* Eliminar muestra
* Enviar a validación
* Volver a etapa anterior
* Continuar a siguiente etapa

## 7. Diseño UX
La experiencia debe priorizar claridad, trazabilidad y prevención de errores.
### Requisitos UX:
* El usuario debe entender en qué etapa está.
* El usuario debe saber qué campos son obligatorios.
* El sistema debe entregar feedback inmediato ante errores.
* Las acciones automáticas deben ser visibles, por ejemplo:
    * Código ALI generado
    * TPA generado por defecto
    * Formularios asociados al análisis
    * Fecha/hora registrada al enviar a validación
    * Tiempo de entrega calculado
* El resumen final debe permitir revisar la solicitud antes de enviarla.
* El usuario debe poder corregir información antes de guardar o enviar.
* Los mensajes de error deben ser claros y específicos.
* Los estados del flujo deben mostrarse con indicadores visuales.
* Evitar pantallas saturadas: dividir la información por etapas.

## 8. Resultado esperado
Construir un prototipo funcional que permita:
1. Crear una solicitud de ingreso
2. Completar el formulario por etapas
3. Agregar múltiples muestras
4. Asociar formularios de análisis a cada muestra
5. Generar TPA automáticamente
6. Asociar formularios al Código ALI
7. Consolidar formularios seleccionados
8. Validar campos obligatorios
9. Calcular tiempos de entrega
10. Enviar la solicitud a validación
11. Mostrar trazabilidad del proceso
12. Revisar el resumen final de la solicitud