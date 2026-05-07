# Sistema de Estilos para Formularios - Asistec Lab

Este documento define la estandarización de estilos para los formularios de la aplicación Asistec Lab. Basado en las directrices de diseño (UI/UX) y las reglas de arquitectura del proyecto (uso de `@apply` en SCSS en lugar de utilidades directamente en el HTML).

## 1. Clases Globales SCSS

Para mantener el HTML limpio y modular, utilizaremos las siguientes clases semánticas en nuestros archivos `.scss` (por ejemplo, en `global.scss` o a nivel de componente). 

```scss
/* =========================================
   ESTILOS BASE DE FORMULARIOS (Asistec Lab)
   ========================================= */

/* Contenedor de cada campo (Label + Input) */
.form-group {
  @apply flex flex-col gap-2; /* Equivalente al gap-group-gap */
}

/* Etiqueta del campo (Label) */
.form-label {
  /* text-label-light, font-label-md, text-label-md */
  @apply text-[#1e3a8a] font-medium text-[14px] leading-[1.2];
}

/* Inputs de texto, número, fecha y selects */
.form-input, .form-select {
  /* border-light, shadow-input, primary focus */
  @apply w-full border border-[#e5e7eb] rounded px-3 py-2 outline-none transition-all;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);

  &:focus {
    @apply border-[#00558f] ring-1 ring-[#00558f];
  }
}

/* Textarea (mantiene estilos del input pero con ajustes de texto) */
.form-textarea {
  @apply form-input text-sm resize-y;
}

/* Contenedor general para grupos de Radios o Checkboxes */
.form-radio-group {
  @apply flex items-center gap-4 py-2;
}

/* Contenedor/Label de un Radio o Checkbox individual */
.form-check-label {
  @apply flex items-center gap-2 cursor-pointer text-sm text-[#111c2d];
}

/* Inputs de tipo Radio y Checkbox */
.form-radio, .form-checkbox {
  @apply text-[#00558f] focus:ring-[#00558f] w-4 h-4;
}

/* Inputs pequeños para tablas (ej: conteo en placas) */
.form-input-sm {
  @apply w-24 border border-[#e5e7eb] rounded px-2 py-1 outline-none transition-all;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);

  &:focus {
    @apply border-[#00558f] ring-1 ring-[#00558f];
  }
}

/* =========================================
   CONTENEDORES DE FORMULARIO (CARDS / ACORDEONES)
   ========================================= */

/* Estructura base de Tarjeta */
.form-card {
  @apply bg-white rounded-xl border border-[#e5e7eb] overflow-hidden mb-6 block;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

/* Encabezado Navy */
.form-card-header {
  @apply bg-[#29588C] p-4 flex items-center justify-between text-white w-full;
}

.form-card-title-group {
  @apply flex items-center gap-3;
}

.form-card-title {
  @apply text-[20px] font-semibold leading-[1.4] m-0;
  font-family: 'Inter', sans-serif;
}

/* Cuerpo de la tarjeta */
.form-card-body {
  @apply p-6 bg-white;
}

/* Estilos específicos si se usa un <ion-accordion> nativo */
ion-accordion.form-accordion {
  @apply bg-white rounded-xl border border-[#e5e7eb] overflow-hidden mb-6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);

  &::part(content) {
    background: #ffffff;
  }

  ion-item[slot="header"] {
    --background: #29588C;
    --background-hover: #1e4066;
    --color: #ffffff;
    --min-height: 56px;
    --padding-start: 16px;
    --inner-padding-end: 16px;
    font-family: 'Inter', sans-serif;

    &::part(native) {
      border: none;
    }

    ion-label {
      @apply text-[16px] font-semibold leading-[1.4] flex items-center gap-3 m-0;
    }

    ion-icon[slot="end"] {
      color: #ffffff;
    }
  }

  .form-card-body {
    @apply p-6;
  }
}
```

## 2. Estructura HTML Estándar

Al construir formularios en los componentes de Angular/Ionic, debes aplicar las clases semánticas definidas arriba. 

### Inputs de Texto, Fecha, Hora, etc.

```html
<div class="form-group">
  <label class="form-label">Fecha de Recolección</label>
  <input type="date" class="form-input" />
</div>
```

### Selects (Listas desplegables)

```html
<div class="form-group">
  <label class="form-label">Unidad de Incubación</label>
  <select class="form-select">
    <option>INC-B-01 (Principal)</option>
    <option>INC-B-02 (Respaldo)</option>
  </select>
</div>
```

### Textareas (Observaciones, notas)

```html
<div class="form-group">
  <label class="form-label">Observaciones Internas</label>
  <textarea class="form-textarea" rows="3" placeholder="Añade notas sobre la muestra..."></textarea>
</div>
```

### Radios y Checkboxes

```html
<div class="form-group">
  <label class="form-label">Estado del Equipo</label>
  <div class="form-radio-group">
    
    <label class="form-check-label">
      <input type="radio" name="equip" class="form-radio" checked />
      <span>Calibrado</span>
    </label>
    
    <label class="form-check-label">
      <input type="radio" name="equip" class="form-radio" />
      <span>Pendiente</span>
    </label>
    
  </div>
</div>
```

## 3. Consideraciones de Diseño (Design System)
- **Colores Principales Utilizados:**
  - Primario (Focus, Radios, Checkboxes): `#00558f`
  - Labels: `#1e3a8a`
  - Bordes de Inputs: `#94a3b8` (Slate 400 para mayor visibilidad)
  - Bordes y Líneas divisorias: `#e5e7eb`
  - Texto Principal (on-surface): `#111c2d`
- **Sombras:** Se utiliza una sombra interna sutil (`inset 0 1px 2px rgba(0, 0, 0, 0.05)`) para dar profundidad a los inputs.
- **Tipografía:** Se asume que la fuente base está configurada en la aplicación (Inter/Public Sans), pero los labels fuerzan un tamaño de `14px` y peso `medium` para mantener claridad.
