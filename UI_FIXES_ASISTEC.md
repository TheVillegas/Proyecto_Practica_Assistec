# AsisTec — Correcciones de Inconsistencias UI + Documentación Completa

> **Alcance:** Este documento cubre (1) la migración al sidebar ya implementada, (2) las inconsistencias visuales detectadas en todas las páginas, (3) el fix del salto de scroll al navegar, y (4) la implementación del sidebar colapsable con contenido adaptable.
>
> **Regla principal:** No modificar lógica de negocio, llamadas a servicios, ni estructura de rutas. Solo cambios de presentación.

---

## Índice

1. [Inconsistencias detectadas](#1-inconsistencias-detectadas)
2. [Sistema de diseño unificado](#2-sistema-de-diseño-unificado)
3. [Fix: salto de scroll al navegar](#3-fix-salto-de-scroll-al-navegar)
4. [Sidebar colapsable + contenido adaptable](#4-sidebar-colapsable--contenido-adaptable)
5. [Fix por página](#5-fix-por-página)
6. [Documentación del sidebar (migración anterior)](#6-documentación-del-sidebar-migración-anterior)
7. [Orden de implementación](#7-orden-de-implementación)

---

## 1. Inconsistencias detectadas

### 1.1 Fondo de página
| Página | Fondo actual | Fondo correcto |
|---|---|---|
| Home | `#F1F3F7` ✓ | `#F1F3F7` |
| Búsqueda ALI | `#F1F3F7` ✓ | `#F1F3F7` |
| Generar ALI | `#0f1623` (oscuro) ✗ | `#F1F3F7` |
| Solicitud Ingreso | `#F1F3F7` ✓ | `#F1F3F7` |
| Búsqueda Solicitud | Sin confirmar | `#F1F3F7` |

### 1.2 Inputs / campos de formulario
| Página | Estado actual | Corrección |
|---|---|---|
| Generar ALI | Fondo oscuro `#1e2d45`, texto claro | Fondo `#ffffff`, borde `#D1D5DB`, texto `#1A2340` |
| Solicitud Ingreso | Fondo oscuro `#374151` sobre página clara | Fondo `#ffffff`, borde `#D1D5DB`, texto `#1A2340` |

### 1.3 Cards / contenedores de formulario
| Página | Estado actual | Corrección |
|---|---|---|
| Generar ALI | Card oscura `#1a2535` con borde azul brillante | Card blanca `#ffffff`, borde `1px solid #E5E7EB`, shadow sutil |
| Solicitud Ingreso | Card azul oscuro en el header de etapa | Mantener color azul del header de etapa — solo corregir inputs internos |

### 1.4 Labels de campos
| Página | Estado actual | Corrección |
|---|---|---|
| Generar ALI | Labels en azul brillante `#3B82F6` | Labels en `#374151`, font-weight 500 |
| Solicitud Ingreso | Labels en azul `#2563EB` | Labels en `#374151`, font-weight 500 |

### 1.5 Botones
| Página | Estado actual | Corrección |
|---|---|---|
| Generar ALI | Rojo "CANCELAR" + Azul "SIGUIENTE" en mayúsculas | Misma acción pero con casing normal: "Cancelar" / "Siguiente" |
| Solicitud Ingreso | Sin confirmar | Aplicar sistema unificado de botones |

### 1.6 Contenido no centrado
Todas las páginas: el contenido del `<main>` no tiene un ancho máximo definido, lo que hace que en pantallas anchas el texto y los formularios se estiren al 100%.

### 1.7 Sidebar sin toggle
No existe botón para colapsar/expandir el sidebar, y el contenido no se adapta si el sidebar se ocultara.

---

## 2. Sistema de diseño unificado

Aplicar estos tokens en **todas** las páginas. Definirlos en un archivo global (ej. `styles/variables.css` o dentro del tema de Tailwind).

### 2.1 Colores

```css
:root {
  /* Layout */
  --color-page-bg:        #F1F3F7;
  --color-sidebar-bg:     #1E3A5F;
  --color-card-bg:        #ffffff;

  /* Texto */
  --color-text-primary:   #1A2340;
  --color-text-secondary: #6B7280;
  --color-text-muted:     #9CA3AF;
  --color-text-label:     #374151;

  /* Bordes */
  --color-border:         #E5E7EB;
  --color-border-focus:   #378ADD;

  /* Inputs */
  --color-input-bg:       #ffffff;
  --color-input-border:   #D1D5DB;
  --color-input-text:     #1A2340;
  --color-input-placeholder: #9CA3AF;

  /* Botones primarios */
  --color-btn-primary-bg:   #2563EB;
  --color-btn-primary-text: #ffffff;
  --color-btn-danger-bg:    #DC2626;
  --color-btn-danger-text:  #ffffff;
  --color-btn-secondary-bg: #F3F4F6;
  --color-btn-secondary-text: #374151;

  /* Acento sidebar */
  --color-sidebar-active:   rgba(255, 255, 255, 0.12);
  --color-sidebar-text:     rgba(255, 255, 255, 0.65);

  /* Sidebar dimensions */
  --sidebar-width:          230px;
  --sidebar-collapsed-width: 64px;
}
```

### 2.2 Inputs (aplicar globalmente)

```css
input[type="text"],
input[type="email"],
input[type="number"],
input[type="search"],
textarea,
select {
  background-color: var(--color-input-bg);
  border: 1px solid var(--color-input-border);
  border-radius: 8px;
  color: var(--color-input-text);
  font-size: 14px;
  padding: 10px 14px;
  width: 100%;
  transition: border-color 0.15s;
}

input::placeholder,
textarea::placeholder {
  color: var(--color-input-placeholder);
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(55, 138, 221, 0.12);
}
```

### 2.3 Labels de campos

```css
.field-label,
label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-label);
  margin-bottom: 6px;
}
```

### 2.4 Cards / contenedores

```css
.page-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 28px 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
}
```

### 2.5 Botones

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s, transform 0.1s;
}
.btn:active { transform: scale(0.98); }

.btn-primary {
  background: var(--color-btn-primary-bg);
  color: var(--color-btn-primary-text);
}
.btn-primary:hover { opacity: 0.9; }

.btn-danger {
  background: var(--color-btn-danger-bg);
  color: var(--color-btn-danger-text);
}
.btn-danger:hover { opacity: 0.9; }

.btn-secondary {
  background: var(--color-btn-secondary-bg);
  color: var(--color-btn-secondary-text);
  border: 1px solid var(--color-border);
}
.btn-secondary:hover { background: #E5E7EB; }
```

### 2.6 Títulos de página (consistencia en todas las vistas)

```css
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 28px;
}
```

### 2.7 Contenido centrado con ancho máximo

```css
.page-content {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 28px;
}
```

> Aplicar la clase `.page-content` al wrapper interno de cada página. No al `<main>` raíz.

---

## 3. Fix: salto de scroll al navegar

### Causa
El salto ocurre porque al cambiar de ruta el router restablece el scroll del `<main>` o del `<body>`, lo que provoca un parpadeo visual en el sidebar (que es `position: fixed`) porque el viewport se mueve.

### Fix en el layout raíz

El `<main>` debe ser el único elemento con scroll, nunca el `<body>` ni el `<html>`. Así el sidebar fijo no se ve afectado por el scroll.

```css
/* Resetear scroll global */
html, body {
  height: 100%;
  overflow: hidden; /* El body NUNCA hace scroll */
  margin: 0;
  padding: 0;
}

.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  position: relative; /* Ya no necesita fixed */
  width: var(--sidebar-width);
  height: 100vh;
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.25s ease;
  background-color: var(--color-sidebar-bg);
}

.main-content {
  flex: 1;
  height: 100vh;
  overflow-y: auto;       /* Solo el main hace scroll */
  overflow-x: hidden;
  background-color: var(--color-page-bg);
  /* ELIMINAR margin-left — ya no es necesario con flex */
}
```

> **Importante:** Si el router tiene configurado `scrollPositionRestoration: 'enabled'` o similar, desactivarlo o limitarlo solo al `<main>` scrolleable, no al window.

### Fix adicional en Angular (si aplica)

Si el proyecto usa Angular Router, agregar en `app.module.ts` o en la configuración del router:

```typescript
RouterModule.forRoot(routes, {
  scrollPositionRestoration: 'disabled', // Deshabilitar restauración global
  anchorScrolling: 'disabled',
})
```

Y manejar el scroll manualmente en el componente de layout:

```typescript
// En el layout component
router.events.pipe(
  filter(e => e instanceof NavigationEnd)
).subscribe(() => {
  const mainEl = document.querySelector('.main-content');
  if (mainEl) mainEl.scrollTop = 0;
});
```

---

## 4. Sidebar colapsable + contenido adaptable

### 4.1 Estado del sidebar

El sidebar puede estar en dos estados:
- **Expandido:** `230px` — muestra ícono + texto
- **Colapsado:** `64px` — muestra solo íconos, tooltip al hover

### 4.2 HTML del toggle button

Agregar dentro del sidebar, junto al logo:

```html
<button class="sidebar-toggle" (click)="toggleSidebar()" [attr.aria-label]="isCollapsed ? 'Expandir menú' : 'Colapsar menú'">
  <!-- Ícono: chevron-left cuando expandido, chevron-right cuando colapsado -->
  <svg ...></svg>
</button>
```

### 4.3 CSS del sidebar colapsable

```css
.sidebar {
  width: var(--sidebar-width);
  transition: width 0.25s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width); /* 64px */
}

/* Ocultar textos cuando está colapsado */
.sidebar.collapsed .logo-title,
.sidebar.collapsed .logo-sub,
.sidebar.collapsed .nav-section-label,
.sidebar.collapsed .nav-item-text,
.sidebar.collapsed .user-name,
.sidebar.collapsed .user-role {
  opacity: 0;
  width: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: opacity 0.15s ease, width 0.25s ease;
}

/* Centrar íconos cuando está colapsado */
.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 10px 0;
}

.sidebar.collapsed .nav-dot {
  display: none;
}

.sidebar.collapsed .sidebar-user {
  justify-content: center;
}

.sidebar.collapsed .user-avatar {
  margin: 0;
}

/* Tooltip al hover en estado colapsado */
.sidebar.collapsed .nav-item {
  position: relative;
}

.sidebar.collapsed .nav-item:hover::after {
  content: attr(data-label);
  position: absolute;
  left: calc(var(--sidebar-collapsed-width) + 8px);
  top: 50%;
  transform: translateY(-50%);
  background: #1A2340;
  color: #ffffff;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 6px;
  white-space: nowrap;
  z-index: 200;
  pointer-events: none;
}

/* Toggle button */
.sidebar-toggle {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.15);
}
```

### 4.4 Lógica del toggle (Angular / TypeScript)

```typescript
// sidebar.component.ts
isCollapsed = false;

toggleSidebar() {
  this.isCollapsed = !this.isCollapsed;
  // Persistir preferencia en localStorage
  localStorage.setItem('sidebar_collapsed', String(this.isCollapsed));
}

ngOnInit() {
  const saved = localStorage.getItem('sidebar_collapsed');
  if (saved !== null) this.isCollapsed = saved === 'true';
}
```

```html
<!-- sidebar.component.html -->
<aside class="sidebar" [class.collapsed]="isCollapsed">
  ...
</aside>
```

### 4.5 Contenido adaptable

Como el layout usa `display: flex` (ver sección 3), el `<main>` se adapta automáticamente al ancho restante sin necesidad de `margin-left`. No se requiere JS adicional para esto.

Si el framework requiere pasar el estado al componente principal:

```typescript
// app.component.ts o layout.component.ts
isSidebarCollapsed = false;

onSidebarToggle(collapsed: boolean) {
  this.isSidebarCollapsed = collapsed;
}
```

```html
<div class="app-layout">
  <app-sidebar (toggleEvent)="onSidebarToggle($event)"></app-sidebar>
  <main class="main-content">
    <router-outlet></router-outlet>
  </main>
</div>
```

---

## 5. Fix por página

### 5.1 Generar ALI (`/generar-ali`)

**Problemas:**
- Fondo de página oscuro → debe ser `#F1F3F7`
- Card contenedor oscura → debe ser blanca con borde claro
- Inputs con fondo oscuro → fondo blanco con borde `#D1D5DB`
- Labels en azul brillante → `#374151` peso 500
- Botones en MAYÚSCULAS → casing normal

**Cambios CSS/clase:**

```css
/* Reemplazar en el componente de Generar ALI */

.generar-ali-page {
  background: var(--color-page-bg); /* Eliminar cualquier bg oscuro */
}

.generar-ali-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 28px 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
  /* Eliminar: border de color azul brillante */
}

/* Los inputs y labels heredan del sistema global (sección 2.2 y 2.3) */
```

**Cambios en template:**
- Cambiar `"CANCELAR"` → `"Cancelar"` y `class="btn btn-danger"`
- Cambiar `"SIGUIENTE →"` → `"Siguiente"` con ícono SVG y `class="btn btn-primary"`

---

### 5.2 Solicitud Ingreso (`/solicitud-ingreso`)

**Problemas:**
- Inputs con fondo oscuro sobre página clara → inconsistente, aplicar sistema global
- El header azul de cada etapa ("Etapa 2 — Información del Cliente") se puede mantener, es intencional

**Cambios:**

```css
/* El header de etapa puede mantener su color azul */
.etapa-header {
  background: #1E4A8A;
  color: #ffffff;
  border-radius: 12px 12px 0 0;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 500;
}

/* Los inputs dentro de la etapa deben ser blancos */
.etapa-body {
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 12px 12px;
  padding: 24px;
}

/* Inputs heredan del sistema global */
```

---

### 5.3 Búsqueda ALI (`/busqueda-ali`) y Búsqueda Solicitud (`/busqueda-solicitud`)

Aplicar:
- `.page-content` con `max-width: 960px; margin: 0 auto`
- Inputs según sistema global (sección 2.2)
- Verificar que el fondo de página sea `var(--color-page-bg)`

---

## 6. Documentación del sidebar (migración anterior)

> Esta sección documenta los cambios ya implementados en el sidebar como registro histórico.

### Qué se cambió

**Antes:** Navbar horizontal en la parte superior con logo a la izquierda, links de navegación al centro y datos de usuario a la derecha.

**Después:** Sidebar vertical fijo de `230px` en el lado izquierdo con fondo azul oscuro `#1E3A5F`.

### Estructura implementada

```
sidebar/
├── Zona superior:  Logo (ícono + "AsisTec" + "LAB MANAGEMENT")
├── Zona media:     Label "MENÚ" + ítems de navegación con ícono + texto
└── Zona inferior:  Avatar + nombre + rol + botón logout
```

### Ítems de navegación implementados

| Ítem | Ruta | Ícono |
|---|---|---|
| Home | `/` | house / home |
| Búsqueda ALI | `/busqueda-ali` | search / lupa |
| Búsqueda Solicitud | `/busqueda-solicitud` | document |
| Solicitud Ingreso | `/solicitud-ingreso` | plus-circle |
| Generar ALI | `/generar-ali` | clock / history |

### Tokens visuales del sidebar

```
Fondo:              #1E3A5F
Ítem activo fondo:  rgba(255,255,255,0.12)
Ítem activo texto:  #ffffff
Ítem inactivo:      rgba(255,255,255,0.65)
Hover:              rgba(255,255,255,0.06)
Separadores:        rgba(255,255,255,0.10)
Border-radius item: 8px
```

---

## 7. Orden de implementación

Seguir este orden para minimizar conflictos:

1. **Variables CSS globales** — definir todos los tokens de la sección 2.1 en un archivo global antes de tocar cualquier componente.

2. **Fix del layout raíz** — cambiar `body` a `overflow: hidden`, sidebar a `position: relative` dentro del flex, `main` con `overflow-y: auto`. Esto resuelve el salto de scroll inmediatamente.

3. **Inputs y labels globales** — aplicar los estilos de la sección 2.2 y 2.3 de forma global. Muchos fixes de páginas se resuelven solos.

4. **Sidebar colapsable** — agregar el botón toggle, la clase `.collapsed`, y el estado en el componente.

5. **`.page-content`** — envolver el contenido interno de cada página con este wrapper para centrar y limitar el ancho.

6. **Fix Generar ALI** — reemplazar fondo oscuro, card oscura y botones en mayúsculas.

7. **Fix Solicitud Ingreso** — corregir inputs oscuros, mantener header azul de etapa.

8. **Fix resto de páginas** — Búsqueda ALI, Búsqueda Solicitud, verificar consistencia.

9. **Verificación final** — navegar entre todas las páginas y confirmar: fondo consistente, inputs blancos, labels grises, botones uniformes, sin salto al navegar, sidebar colapsable funcional.

---

## Notas finales

- No cambiar ningún `@Input`, `@Output`, servicio, ni lógica de validación de formularios.
- No modificar las rutas del router ni los guards.
- Si algún componente tiene estilos inline que sobreescriban las variables CSS, quitarlos para que hereden del sistema global.
- Los componentes con `ViewEncapsulation.Emulated` (Angular default) pueden requerir que los estilos globales de inputs se apliquen en `styles.css` en lugar de en el componente.
