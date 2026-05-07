# Prototipo de formulario de análisis microbiológico

## 1. Contexto general

Necesito crear un prototipo funcional de un formulario web para el registro de análisis microbiológico de **Coliformes Totales, Coliformes Fecales y E. coli** en alimentos.

El formulario debe permitir:

1. Importar automáticamente datos del alimento desde una lista de solicitudes de ingreso.
2. Registrar los datos de siembra y utensilios utilizados.
3. Registrar lecturas de submuestras a las 24 horas y 48 horas.
4. Registrar controles de calidad.
5. Calcular y mostrar los resultados finales de presencia de coliformes y/o E. coli.
6. Enviar o cancelar el registro del análisis.

El objetivo es generar un prototipo claro, usable y estructurado como formulario de registro de datos de laboratorio.

---

## 2. Tipo de aplicación esperada

Construye una interfaz de formulario web para registro de datos.

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

---

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

---

## 4. Reglas de importación automática

Los datos del alimento y de incubación deben importarse automáticamente desde una lista de solicitudes de ingreso.

### Campos autocompletados y no editables

Los siguientes campos deben mostrarse en el formulario, pero no deben permitir edición manual:

| Campo | Tipo de campo | Editable | Obligatorio | Origen |
|---|---:|---:|---:|---|
| Código del alimento | Texto | No | Sí | Lista de solicitudes de ingreso |
| Fecha de incubación | Fecha o texto formateado | No | Sí | Lista de solicitudes de ingreso |
| Hora de incubación | Hora o texto formateado | No | Sí | Lista de solicitudes de ingreso |
| Analista responsable de incubación | Texto | No | Sí | Lista de solicitudes de ingreso |

### Comportamiento esperado

- Los campos deben aparecer precargados al abrir el formulario.
- Deben verse visualmente como campos bloqueados o deshabilitados.
- Si falta alguno de estos datos importados, mostrar una alerta o mensaje de validación.

---

## 5. Etapa 1: Detalles del alimento e incubación

Esta etapa contiene los datos generales del alimento, incubación y cierre del análisis.

### Campos

| Campo | Tipo | Editable | Obligatorio | Observaciones |
|---|---|---:|---:|---|
| Código del alimento | Texto | No | Sí | Autocompletado |
| Fecha de inicio incubación | Texto o fecha | No | Sí | Autocompletado desde fecha de incubación |
| Hora de inicio incubación | Texto u hora | No | Sí | Autocompletado desde hora de incubación |
| Analista responsable de incubación | Texto | No | Sí | Autocompletado |
| Fecha de término análisis | Texto o fecha | Sí | Sí | Ingresado por usuario |
| Analista responsable de término de análisis | Texto | Sí | Sí | Ingresado por usuario |

### Validaciones

- La fecha de término de análisis no puede ser anterior a la fecha de incubación.
- El analista responsable de término de análisis es obligatorio.
- Los campos autocompletados deben estar bloqueados.

---

## 6. Etapa 2: Detalles de siembra

Esta etapa debe permitir registrar los datos relacionados con la siembra bacteriana y los utensilios utilizados.

### Campos

| Campo | Tipo | Obligatorio | Observaciones |
|---|---|---:|---|
| Código del medio de homogeneización | Texto | Sí | Registro general del medio utilizado |
| Caldo lauril | Texto | Sí | Código o identificación del caldo |
| Tween 80 | Texto | No | Código o identificación si aplica |
| Estufa utilizada | Radio button | Sí | Debe permitir seleccionar una estufa |
| Micropipeta utilizada | Checkbox múltiple | Sí | Opciones: `1 ml`, `10 ml` |
| Código de muestra según naturaleza | Texto | Sí | Debe indicar homogéneo o mezcla |
| N° muestra 10 g / 90 ml | Texto | No | Registro de muestra según preparación |
| N° muestra 50 g / 450 ml | Texto | No | Registro de muestra según preparación |

### Reglas de interacción

- En **Estufa utilizada**, el usuario debe seleccionar una única opción.
- En **Micropipeta utilizada**, el usuario puede seleccionar una o más opciones.
- Debe existir al menos una micropipeta seleccionada.
- Si el campo `Código de muestra según naturaleza` usa opciones, considerar las alternativas:
  - Homogéneo
  - Mezcla

---

## 7. Etapa 3: Control de análisis

Esta etapa debe registrar las lecturas realizadas a las 24 horas y 48 horas.

Debe contener dos bloques o tablas independientes:

1. **Lectura a 24 horas**
2. **Lectura a 48 horas**

Cada bloque debe incluir datos generales de lectura y una tabla de submuestras.

---

### 7.1 Datos generales para lectura 24 horas

| Campo | Tipo | Obligatorio | Validación |
|---|---|---:|---|
| Fecha de lectura 24 h | Fecha en formato `DD/MM` | Sí | Debe respetar formato |
| Hora de lectura 24 h | Hora en formato `HH:MM` | Sí | Debe estar dentro del rango permitido |
| Analista responsable 24 h | Texto | Sí | Obligatorio |
| N° muestra 24 h, incluye duplicado | Texto | Sí | Obligatorio |

### 7.2 Datos generales para lectura 48 horas

| Campo | Tipo | Obligatorio | Validación |
|---|---|---:|---|
| Fecha de lectura 48 h | Fecha en formato `DD/MM` | Sí | Debe respetar formato |
| Hora de lectura 48 h | Hora en formato `HH:MM` | Sí | Debe estar dentro del rango permitido |
| Analista responsable 48 h | Texto | Sí | Obligatorio |
| N° muestra 48 h, incluye duplicado | Texto | Sí | Obligatorio |

---

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

---

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

---

### 9.1 Estructura sugerida de tabla

La tabla debe representar las muestras como columnas agrupadas y las diluciones como filas.

Ejemplo conceptual:

| Dilución | Muestra 1 - S1 | Muestra 1 - S2 | Muestra 1 - S3 | Muestra 2 - S1 | Muestra 2 - S2 | Muestra 2 - S3 | ... | Duplicado - S1 | Duplicado - S2 | Duplicado - S3 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 ml | Pos/Neg | Pos/Neg | Pos/Neg | Pos/Neg | Pos/Neg | Pos/Neg | ... | Pos/Neg | Pos/Neg | Pos/Neg |
| 0,1 ml | Pos/Neg | Pos/Neg | Pos/Neg | Pos/Neg | Pos/Neg | Pos/Neg | ... | Pos/Neg | Pos/Neg | Pos/Neg |
| 0,01 ml | Pos/Neg | Pos/Neg | Pos/Neg | Pos/Neg | Pos/Neg | Pos/Neg | ... | Pos/Neg | Pos/Neg | Pos/Neg |

### 9.2 Tabla para lectura 24 horas

Debe incluir:

- Fecha de lectura.
- Hora de lectura.
- Analista responsable.
- Número de muestra, incluyendo duplicado.
- Tabla de submuestras con diluciones `1 ml`, `0,1 ml`, `0,01 ml`.
- Registro positivo/negativo por cada submuestra.

### 9.3 Tabla para lectura 48 horas

Debe incluir la misma estructura que la tabla de 24 horas:

- Fecha de lectura.
- Hora de lectura.
- Analista responsable.
- Número de muestra, incluyendo duplicado.
- Tabla de submuestras con diluciones `1 ml`, `0,1 ml`, `0,01 ml`.
- Registro positivo/negativo por cada submuestra.

---

## 10. Etapa 4: Control de calidad

Esta etapa debe permitir registrar presencia o ausencia de colonias y/o crecimiento de colonias para los controles definidos.

### Campos de control

| Control | Tipo | Opciones | Obligatorio |
|---|---|---|---:|
| Control K. aerogenes | Checkbox o selector binario | Presencia / Ausencia | Sí |
| Control S. aureus | Checkbox o selector binario | Presencia / Ausencia | Sí |
| Control E. coli | Checkbox o selector binario | Presencia / Ausencia | Sí |
| Control blanco | Texto | Campo libre para observación o resultado | Sí |

### Nota de normalización

En el prompt base aparecen variantes como `Control Kaerogenes` y `Control K.aerogenes`. Para la interfaz, normalizar como:

- `Control K. aerogenes`

---

## 11. Etapa 5: Datos finales y cálculo de resultados

Esta etapa debe mostrar o registrar los resultados finales del análisis.

### Campos

| Campo | Tipo | Editable | Obligatorio | Observaciones |
|---|---|---:|---:|---|
| N° muestra | Texto | Sí | Sí | Identificador de muestra final |
| Resultado NMP / 25 g - Coliformes totales | Número o texto calculado | Sí o calculado | Sí | Resultado final |
| Resultado NMP / 25 g - Coliformes fecales | Número | Sí o calculado | Sí | Resultado final |
| Resultado NMP / 25 g - E. coli | Número | Sí o calculado | Sí | Resultado final |

### Reglas de cálculo

El sistema debe calcular o permitir registrar el resultado de presencia de:

- Coliformes totales
- Coliformes fecales
- E. coli

El resultado debe expresarse como:

```text
NMP / 25 g
```

Si no se implementa todavía el algoritmo exacto de cálculo NMP, dejar preparada una función o placeholder claramente identificada para conectarla posteriormente.


---

## 12. Campos obligatorios consolidados

Los siguientes campos deben validarse antes de enviar el formulario:

### Datos importados

- Código del alimento
- Fecha de incubación
- Hora de incubación
- Analista responsable de incubación

### Datos de cierre

- Fecha de término análisis
- Analista responsable de término de análisis

### Siembra

- Código del medio de homogeneización
- Caldo lauril
- Estufa utilizada
- Al menos una micropipeta utilizada
- Código de muestra según naturaleza

### Lectura 24 horas

- Fecha de lectura 24 h
- Hora de lectura 24 h
- Analista responsable 24 h
- N° muestra 24 h, incluye duplicado
- Registro de submuestras 24 h

### Lectura 48 horas

- Fecha de lectura 48 h
- Hora de lectura 48 h
- Analista responsable 48 h
- N° muestra 48 h, incluye duplicado
- Registro de submuestras 48 h

### Control de calidad

- Control K. aerogenes
- Control S. aureus
- Control E. coli
- Control blanco

### Datos finales

- N° muestra
- Resultado NMP / 25 g para coliformes totales
- Resultado NMP / 25 g para coliformes fecales
- Resultado NMP / 25 g para E. coli

---

## 13. Comportamiento de botones

### Botón Enviar

Al hacer clic en **Enviar**:

1. Validar todos los campos obligatorios.
2. Validar formato de fechas y horas.
3. Validar rango horario permitido para lecturas.
4. Validar que existan registros de submuestras para 24 h y 48 h.
5. Si todo es correcto, simular envío al servidor.
6. Mostrar mensaje de éxito.

Mensaje sugerido:

> Registro de análisis enviado correctamente.

### Botón Cancelar

Al hacer clic en **Cancelar**:

1. Mostrar confirmación antes de descartar datos.
2. Si el usuario confirma, limpiar el formulario o volver a la pantalla anterior.

Mensaje sugerido:

> ¿Deseas cancelar el registro? Los datos ingresados se perderán.

---

## 14. Estados y mensajes de validación

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

---

## 15. Requisitos de usabilidad

- Los campos autocompletados deben verse deshabilitados.
- Las tablas deben ser fáciles de leer, con encabezados fijos o agrupados si es posible.
- Las diluciones deben aparecer como filas.
- Las muestras y duplicados deben aparecer como grupos de columnas.
- Usar etiquetas claras y consistentes.
- Mantener consistencia en unidades: `1 ml`, `0,1 ml`, `0,01 ml`.
- Destacar visualmente las secciones de lectura 24 h y 48 h.
- Mostrar resumen de resultados antes del envío final.

---

## 16. Modelo de datos sugerido

Usar una estructura de datos similar a la siguiente:

```ts
type ResultadoSubmuestra = 'positivo' | 'negativo' | 'sin_registrar';

type Dilucion = '1ml' | '0.1ml' | '0.01ml';

type LecturaSubmuestra = {
  muestraId: string;
  esDuplicado: boolean;
  dilucion: Dilucion;
  submuestra: 1 | 2 | 3;
  resultado: ResultadoSubmuestra;
};

type Lectura = {
  tipo: '24h' | '48h';
  fechaLectura: string;
  horaLectura: string;
  analistaResponsable: string;
  numeroMuestraIncluyeDuplicado: string;
  submuestras: LecturaSubmuestra[];
};

type FormularioColiformes = {
  alimento: {
    codigoAlimento: string;
    fechaIncubacion: string;
    horaIncubacion: string;
    analistaIncubacion: string;
    fechaTerminoAnalisis: string;
    analistaTerminoAnalisis: string;
  };
  siembra: {
    codigoMedioHomogeneizacion: string;
    caldoLauril: string;
    tween80?: string;
    estufaUtilizada: string;
    micropipetas: string[];
    codigoMuestraNaturaleza: string;
    muestra10g90ml?: string;
    muestra50g450ml?: string;
  };
  lecturas: Lectura[];
  controlCalidad: {
    controlKAerogenes: 'presencia' | 'ausencia' | 'sin_registrar';
    controlSAureus: 'presencia' | 'ausencia' | 'sin_registrar';
    controlEColi: 'presencia' | 'ausencia' | 'sin_registrar';
    blanco: string;
  };
  datosFinales: {
    numeroMuestra: string;
    coliformesTotalesNMP25g: number | string;
    coliformesFecalesNMP25g: number | string;
    eColiNMP25g: number | string;
  };
};
```

---

## 17. Criterios de aceptación

El prototipo se considera correcto si cumple con lo siguiente:

- Muestra las cinco etapas del formulario.
- Los datos importados aparecen autocompletados y no editables.
- Permite registrar datos de siembra.
- Permite seleccionar estufa mediante radio button.
- Permite seleccionar micropipetas mediante checkbox.
- Incluye una tabla de lectura para 24 horas.
- Incluye una tabla de lectura para 48 horas.
- Cada tabla permite registrar presencia/ausencia por muestra, duplicado, dilución y submuestra.
- Existen al menos 6 muestras más 1 duplicado.
- Cada muestra tiene 3 submuestras por dilución.
- Las diluciones disponibles son `1 ml`, `0,1 ml` y `0,01 ml`.
- Valida fechas en formato `DD/MM` cuando corresponda.
- Valida horas en formato `HH:MM`.
- Valida margen de lectura de ±2 horas.
- Permite registrar controles de calidad.
- Permite registrar o calcular resultados NMP / 25 g.
- Tiene botón **Enviar**.
- Tiene botón **Cancelar**.
- Muestra mensajes de error y éxito.

---

## 18. Instrucción final para Antigravity

Genera el prototipo completo del formulario siguiendo esta especificación.

Prioriza claridad, estructura visual y fidelidad al flujo de laboratorio. Implementa datos de ejemplo para los campos importados automáticamente y deja preparada la lógica para conectar el formulario a un servidor real.

Si el cálculo exacto de NMP no está definido, implementa una función placeholder y muestra claramente dónde debe conectarse la fórmula o tabla oficial de cálculo.
