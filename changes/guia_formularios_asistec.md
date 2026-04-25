# Guía de Formularios y Flujo de Datos (Asistec)

Esta guía documenta el estándar de diseño visual unificado para la aplicación web de Asistec (Design System) y el flujo técnico necesario para capturar datos en el Frontend y guardarlos de forma segura en la base de datos Oracle a través de Node.js.

---

## 1. Design System: Sistema de Formularios

Para garantizar una interfaz limpia, clínica y moderna, hemos centralizado los estilos de todos los formularios en `global.scss`. No debes volver a escribir CSS personalizado para los inputs; utiliza exclusivamente estas clases predefinidas.

### Clases Principales

*   `.asistec-form-group`: Contenedor principal. Aplica separación vertical consistente (`gap-2`, `mb-4`).
*   `.asistec-label`: Etiqueta del input. Texto oscuro, tipografía Inter, tamaño adecuado.
*   `.asistec-input`: Clase universal para todo tipo de campos de texto, números y selectores. Provee bordes redondeados (`rounded-xl`), altura mínima de `48px`, colores de enfoque (`focus`) y anulación del Shadow DOM nativo de Ionic.
*   `.asistec-input-wrapper`: Contenedor relativo para posicionar íconos.
*   `.asistec-input-icon`: Posiciona un icono de forma absoluta a la izquierda. Si se usa, al input se le debe agregar la clase modificadora `.has-icon`.

### Snippets de Uso (HTML)

**A. Input Estándar (Angular Native o Ionic)**
```html
<div class="asistec-form-group">
  <label class="asistec-label" for="nombre">Nombre de Muestra</label>
  <input type="text" id="nombre" class="asistec-input" [(ngModel)]="modelo.nombre">
</div>
```

**B. Input con Icono (Ideal para Formularios Cortos / Login)**
```html
<div class="asistec-form-group">
  <label class="asistec-label" for="codigo">Código ALI</label>
  <div class="asistec-input-wrapper">
    <div class="asistec-input-icon">
      <ion-icon name="qr-code-outline"></ion-icon>
    </div>
    <input type="text" id="codigo" class="asistec-input has-icon" formControlName="codigoAli">
  </div>
</div>
```

**C. Selector de Ionic (Ej. Formularios Extensos de RAM/TPA)**
```html
<div class="asistec-form-group">
  <label class="asistec-label">Equipo Incubación</label>
  <ion-select class="asistec-input" [(ngModel)]="etapa1.equipoIncubacion">
    <ion-select-option value="1">Incubadora A</ion-select-option>
    <ion-select-option value="2">Incubadora B</ion-select-option>
  </ion-select>
</div>
```

---

## 2. Flujo de Datos: Desde la Vista a la Base de Datos

Cada vez que construyas un formulario que deba interactuar con la base de datos Oracle, debes seguir esta arquitectura en capas. Es estrictamente obligatorio usar variables "Bind" para prevenir inyecciones SQL.

### Paso 1: Interfaz de Usuario (Angular View)
Capturas los datos usando `ReactiveForms` (para validaciones complejas y formularios cortos) o `Template-Driven Forms` (`[(ngModel)]`, para formularios masivos como RAM/TPA).
> [!TIP]
> Prioriza `ReactiveForms` (`formGroup`) si necesitas validaciones asíncronas estrictas antes de enviar el payload.

### Paso 2: Controlador del Componente (Angular TS)
Se agrupa la data, se formatea si es necesario y se envía al **Service** mediante Inyección de Dependencias.
```typescript
// Ejemplo en mi-componente.page.ts
enviarDatos() {
  const payload = this.formulario.value; 
  this.miService.guardarMuestra(payload).subscribe({
    next: (res) => console.log('Guardado exitoso', res),
    error: (err) => console.error('Error de servidor', err)
  });
}
```

### Paso 3: Servicio HTTP (Angular Service)
Realiza la llamada HTTP hacia el backend Node.js.
```typescript
// Ejemplo en mi.service.ts
guardarMuestra(datos: any): Observable<any> {
  // environment.apiUrl = 'http://localhost:3000/api'
  return this.http.post(`${environment.apiUrl}/muestras`, datos);
}
```

### Paso 4: Endpoint / Controlador (Backend Node.js/Express)
El servidor recibe el requerimiento, lo intercepta (validando tokens JWT mediante middleware si está protegido) y extrae el `req.body`.
```javascript
// Ejemplo en muestraController.js
const guardarMuestra = async (req, res) => {
  try {
    const { nombre, tipo } = req.body;
    // Llama al modelo (Capa de Acceso a Datos)
    const resultado = await MuestraModel.insertarMuestra(nombre, tipo);
    res.status(200).json({ exito: true, data: resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Fallo al guardar en la base de datos' });
  }
};
```

### Paso 5: Ejecución en BD (Backend Model / oracledb)
Esta es la fase crítica. Todo parámetro insertado en la base de datos debe ser **Bind Variable** (`:parametro`).

> [!CAUTION]
> **NUNCA** concatenes texto directamente en la string SQL (`'SELECT * FROM tabla WHERE id = ' + req.body.id`). Esto causa inyecciones SQL.

```javascript
// Ejemplo en muestraModel.js
const DB = require('../config/database');

const insertarMuestra = async (nombre, tipo) => {
  // Query parametrizada para ORACLE
  const sql = `
    INSERT INTO TBL_MUESTRAS (NOMBRE, TIPO, FECHA_CREACION)
    VALUES (:nombre, :tipo, SYSDATE)
  `;
  
  // Mapeo seguro de valores Bind
  const binds = {
    nombre: nombre,
    tipo: tipo
  };

  // Se ejecuta usando el pool de conexiones centralizado
  const result = await DB.execute(sql, binds, { autoCommit: true });
  return result;
};

module.exports = { insertarMuestra };
```

---

## 3. Lista de Verificación (Checklist) para Nuevos Formularios

1. [ ] ¿Las clases usadas en el HTML provienen de `global.scss` (`.asistec-form-group`, etc.)?
2. [ ] ¿La interfaz está optimizada para móvil y escritorio usando las grids adecuadas?
3. [ ] ¿El componente en Angular usa loaders/spinners (`LoadingController`) mientras espera la respuesta?
4. [ ] ¿Los errores devueltos por la API (HTTP 400/500) se muestran en pantalla mediante un `AlertController`?
5. [ ] ¿El modelo Node.js usa estrictamente validación de Binds (`:variable` o `$1` dependiendo de la BD final)?
6. [ ] ¿El endpoint requiere el middleware de autenticación (JWT) si maneja datos sensibles?
