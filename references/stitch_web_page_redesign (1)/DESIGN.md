---
name: Asistec Lab Design System
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#404751'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#717882'
  outline-variant: '#c0c7d2'
  surface-tint: '#0061a2'
  primary: '#00558f'
  on-primary: '#ffffff'
  primary-container: '#006eb6'
  on-primary-container: '#e1edff'
  inverse-primary: '#9dcaff'
  secondary: '#336095'
  on-secondary: '#ffffff'
  secondary-container: '#99c4fe'
  on-secondary-container: '#1f5084'
  tertiary: '#a9000d'
  on-tertiary: '#ffffff'
  tertiary-container: '#ce2523'
  on-tertiary-container: '#ffe7e4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d1e4ff'
  primary-fixed-dim: '#9dcaff'
  on-primary-fixed: '#001d35'
  on-primary-fixed-variant: '#00497c'
  secondary-fixed: '#d3e4ff'
  secondary-fixed-dim: '#a2c9ff'
  on-secondary-fixed: '#001c38'
  on-secondary-fixed-variant: '#14487b'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb4ab'
  on-tertiary-fixed: '#410002'
  on-tertiary-fixed-variant: '#93000a'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
  brand-navy: '#29588C'
  primary-hover: '#005a96'
  danger-alt: '#BC3939'
  background-light: '#F4F4F4'
  surface-light: '#FFFFFF'
  background-dark: '#1a202c'
  surface-dark: '#2d3748'
  text-muted: '#64748b'
  label-light: '#1e3a8a'
  border-light: '#e5e7eb'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
  caption:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  page-padding: 1rem
  stack-gap: 1rem
  group-gap: 0.5rem
  section-margin: 1.5rem
---

# Design System & UI Documentation - Asistec Lab

Esta documentación detalla el sistema de diseño actual de la aplicación **Asistec (PUCV)**. Está optimizada para ser utilizada como contexto al generar nuevas vistas o componentes, ya sea manualmente o a través de herramientas como **Stitch**.

## 🛠️ Stack Tecnológico y Arquitectura UI
- **Framework Core**: Angular 17+ (Arquitectura estricta basada en `NgModules`. **Prohibido el uso de `standalone: true`**).
- **Componentes UI**: Ionic Framework 7+ (Uso intensivo de etiquetas `<ion-*>` para inputs, cards, modales, etc.).
- **Motor de Estilos**: Tailwind CSS.
- **Patrón de Estilos**: Uso de clases semánticas en el HTML (ej: `.card-contenedor`) y aplicación de utilidades de Tailwind en los archivos `.scss` mediante la directiva `@apply`. **Se debe evitar saturar el HTML con clases utilitarias de Tailwind**.

---

## 🎨 Paleta de Colores (Design Tokens)

El proyecto maneja una combinación de variables nativas de Ionic y extensiones personalizadas en Tailwind. 

### Colores Principales (Brand)
Estos son los colores que definen la identidad del laboratorio:
- **Azul Oscuro (Header / Brand)**: `#29588C` 
- **Primario (Acciones principales)**: `#006EB6`
- **Primario Dark (Hover states)**: `#005a96`
- **Peligro / Secundario (Alertas, Cancelar)**: `#C41D1D` o `#BC3939` o `#c9252c`

### Colores de Fondo y Superficies
- **Fondo Global (Light)**: `#F4F4F4` o `#f4f6f8` (Blanco Humo)
- **Superficie (Cards, Modales - Light)**: `#FFFFFF`
- **Fondo Global (Dark Mode)**: `#1a202c`
- **Superficie (Dark Mode)**: `#2d3748`

### Colores de Texto y Bordes
- **Texto Principal**: `#1e293b` (Light) / `#f3f4f6` (Dark)
- **Texto Secundario (Muted)**: `#64748b`
- **Labels de Formularios**: `#1e3a8a` (Light) / `#93c5fd` (Dark)
- **Bordes**: `#e5e7eb` (Light) / `#4b5563` (Dark)

---

## 🖋️ Tipografía
- **Fuente Principal (Ionic / Global)**: `'Inclusive Sans', sans-serif`
- **Fuente Secundaria / Display (Tailwind)**: `'Inter', sans-serif`

---

## 📐 Sombras y Profundidad (Shadows)
El sistema utiliza sombras muy suaves y sutiles para elevar elementos sin sobrecargar la interfaz (estilo flat/moderno).
- **Card (`shadow-card`)**: `0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)`
- **Input (`shadow-input`)**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **Soft (`shadow-soft`)**: `0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)`

---

## 🧩 Patrones de Componentes (Guidelines)

### 1. Botones (`<ion-button>`)
- Usar los colores del tema de Ionic (`color="primary"`, `color="secondary"`, `color="medium"`).
- Para botones de guardado o acciones principales, usar diseño con relleno (`fill="solid"`).
- Para acciones secundarias o cancelar, usar bordes (`fill="outline"`) o texto plano (`fill="clear"`).

### 2. Formularios e Inputs (`<ion-input>`, `<ion-select>`)
- Todos los labels e inputs deben estar encapsulados semánticamente en el HTML.
- **Estructura Recomendada**:
  ```html
  <div class="input-grupo">
    <ion-label>Nombre del Campo</ion-label>
    <ion-input placeholder="Ejemplo de ingreso..."></ion-input>
  </div>
  ```
- **SCSS Recomendado** (`@apply`):
  ```scss
  .input-grupo {
    @apply flex flex-col gap-2 mb-4;
    ion-label {
      @apply text-label-light font-medium text-sm;
    }
    ion-input, ion-select {
      @apply shadow-input border border-border-light rounded-md bg-surface-light px-3;
    }
  }
  ```
- **Nota**: Las flechas de incremento/decremento en inputs de tipo `number` están ocultas globalmente por CSS.

### 3. Tarjetas (`<ion-card>`)
- Las tarjetas deben tener un diseño limpio, fondo blanco (`bg-surface`) y utilizar la sombra definida (`shadow-card`).
- Evitar sombras muy pesadas; la UI debe sentirse plana e iluminada.
- **SCSS**:
  ```scss
  .card-asistec {
    @apply bg-surface shadow-card rounded-lg p-4 border border-border-light;
  }
  ```

### 4. Layouts y Contenedores
- **Páginas**: Toda página debe usar `<ion-content class="ion-padding">` (o su equivalente en SCSS con `@apply bg-brand-bg p-4`) para mantener márgenes uniformes.
- **Grid**: Preferir CSS Grid o Flexbox vía Tailwind para layouts complejos (`@apply grid grid-cols-1 md:grid-cols-2 gap-4`).
- **Encabezados**: Los `<ion-header>` deben usar el color de marca principal (`ion-azul-oscuro`).

---

## 🤖 Instrucciones Específicas para Stitch (Prompt Injection)

Si estás leyendo esto para generar una nueva vista (Agente / Stitch), **sigue estas reglas obligatoriamente**:

1. **NO uses utilidades de Tailwind directamente en el HTML**. Crea una clase semántica en el HTML (ej: `class="header-section"`) y aplica los estilos en el bloque SCSS usando `@apply flex justify-between items-center bg-surface p-4 ...`.
2. **Genera código para Ionic/Angular**. Usa los componentes nativos de Ionic (`<ion-grid>`, `<ion-row>`, `<ion-col>`, `<ion-item>`, `<ion-button>`) en lugar de construir todo desde cero con `div`s.
3. **El diseño debe sentirse premium, limpio y de uso clínico/laboratorio**. Amplio espacio en blanco, textos legibles (mínimo 14px), bordes redondeados suaves (`rounded-md` o `rounded-lg`) y delimitación clara mediante bordes ligeros o sombras sutiles.
4. **Respeta la jerarquía visual**. El botón de acción principal debe resaltar con el azul `#006EB6`, mientras que las tarjetas o contenedores secundarios deben reposar en fondos blancos o gris muy claro `#F4F4F4`.
