# AsisTec UI — Plan de Migración de Interfaz

## Contexto

Este documento describe la migración de la interfaz actual de AsisTec (navbar horizontal) al nuevo diseño con **sidebar vertical fijo**. El objetivo es replicar fielmente el diseño de referencia: sidebar azul oscuro a la izquierda, contenido principal en fondo gris claro, banner de bienvenida, tarjetas de stats y acciones rápidas.

---

## 1. Cambio de layout principal

### Estado actual
- `<nav>` horizontal en la parte superior de la página
- Logo a la izquierda, links al centro, usuario a la derecha
- Contenido ocupa el 100% del ancho debajo del nav

### Estado objetivo
- Sidebar fijo de `230px` a la izquierda (`position: fixed`, `height: 100vh`)
- `<main>` con `margin-left: 230px`
- Fondo de página: `#F1F3F7`

### Estructura HTML base

```html
<div class="app-layout">
  <aside class="sidebar">
    <!-- logo, nav, user -->
  </aside>
  <main class="main-content">
    <!-- página activa -->
  </main>
</div>
```

### CSS base

```css
.app-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 230px;
  height: 100vh;
  background-color: #1E3A5F;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px 16px;
  z-index: 100;
}

.main-content {
  margin-left: 230px;
  flex: 1;
  background-color: #F1F3F7;
  min-height: 100vh;
  padding: 32px;
}
```

---

## 2. Componentes del sidebar

El sidebar tiene 3 zonas verticales: **logo**, **navegación** y **perfil de usuario**.

### 2.1 Logo block (zona superior)

```html
<div class="sidebar-logo">
  <!-- Ícono SVG de matraz de laboratorio -->
  <svg>...</svg>
  <div>
    <span class="logo-title">AsisTec</span>
    <span class="logo-sub">LAB MANAGEMENT</span>
  </div>
</div>
```

```css
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  display: block;
}

.logo-sub {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: block;
}
```

### 2.2 Navegación (zona media)

```html
<nav class="sidebar-nav">
  <span class="nav-section-label">Menú</span>
  <ul>
    <li class="nav-item active">
      <!-- ícono home -->
      <span>Home</span>
      <span class="nav-dot">•</span>
    </li>
    <li class="nav-item">
      <!-- ícono búsqueda -->
      <span>Búsqueda ALI</span>
    </li>
    <li class="nav-item">
      <!-- ícono reloj -->
      <span>Generar ALI</span>
    </li>
  </ul>
</nav>
```

```css
.nav-section-label {
  color: rgba(255, 255, 255, 0.4);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: block;
  margin: 24px 0 8px 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-weight: 500;
}

.nav-dot {
  margin-left: auto;
  color: #ffffff;
  font-size: 18px;
  line-height: 1;
}
```

### 2.3 Perfil de usuario (zona inferior)

```html
<div class="sidebar-user">
  <div class="user-avatar">PH</div>
  <div class="user-info">
    <span class="user-name">Patricio Henriquez</span>
    <span class="user-role">Analista</span>
  </div>
  <!-- ícono logout -->
</div>
```

```css
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  display: block;
}

.user-role {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  display: block;
}
```

---

## 3. Página Home

### 3.1 Banner de bienvenida

```html
<div class="welcome-banner">
  <div class="banner-badge">
    <!-- ícono matraz pequeño -->
    AsisTec Lab
  </div>
  <h1>Bienvenido a la interfaz digital de AsisTec</h1>
  <p>Plataforma de gestión de muestras del laboratorio AsisTec — Pontificia Universidad Católica de Valparaíso.</p>
  <div class="banner-circle"></div>
</div>
```

```css
.welcome-banner {
  background: linear-gradient(135deg, #1A4B9C 0%, #2860C0 100%);
  border-radius: 16px;
  padding: 32px 36px;
  position: relative;
  overflow: hidden;
  margin-bottom: 24px;
}

.banner-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 14px;
}

.welcome-banner h1 {
  color: #ffffff;
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
}

.welcome-banner p {
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  line-height: 1.6;
  max-width: 520px;
}

.banner-circle {
  position: absolute;
  right: -40px;
  top: -40px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.15);
  pointer-events: none;
}
```

### 3.2 Tarjetas de estadísticas

```html
<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-icon blue"><!-- ícono Layers --></div>
    <div>
      <span class="stat-label">Muestras Activas</span>
      <span class="stat-value">—</span>
    </div>
  </div>
  <div class="stat-card">
    <div class="stat-icon green"><!-- ícono CheckCircle --></div>
    <div>
      <span class="stat-label">Reportes Verificados</span>
      <span class="stat-value">—</span>
    </div>
  </div>
  <div class="stat-card">
    <div class="stat-icon amber"><!-- ícono Clock --></div>
    <div>
      <span class="stat-label">Pendientes de Revisión</span>
      <span class="stat-value">—</span>
    </div>
  </div>
</div>
```

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon.blue   { background: rgba(55, 138, 221, 0.12); color: #378ADD; }
.stat-icon.green  { background: rgba(29, 158, 117, 0.12); color: #1D9E75; }
.stat-icon.amber  { background: rgba(245, 158, 11,  0.12); color: #F59E0B; }

.stat-label {
  color: #8A8F9C;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  display: block;
  margin-bottom: 4px;
}

.stat-value {
  color: #1A2340;
  font-size: 22px;
  font-weight: 600;
  display: block;
}
```

### 3.3 Acciones rápidas

```html
<div class="quick-actions">
  <div class="section-header">
    <h2>Acciones Rápidas</h2>
    <p>Selecciona una acción para comenzar</p>
  </div>
  <div class="actions-grid">
    <div class="action-card">
      <div class="action-icon"><!-- ícono búsqueda --></div>
      <h3>Búsqueda ALI</h3>
      <p>Consultar registros, historial y reportes de muestras ingresadas al sistema.</p>
      <a class="action-link" href="/busqueda-ali">Consultar →</a>
      <div class="action-circle"></div>
    </div>
    <div class="action-card">
      <div class="action-icon"><!-- ícono + --></div>
      <h3>Generar ALI Básico</h3>
      <p>Crear un nuevo registro de ingreso de muestras con datos esenciales.</p>
      <a class="action-link" href="/generar-ali">Iniciar →</a>
      <div class="action-circle"></div>
    </div>
  </div>
</div>
```

```css
.section-header {
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1A2340;
  margin-bottom: 4px;
}

.section-header p {
  font-size: 13px;
  color: #8A8F9C;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.action-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 28px 28px 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #F1F3F7;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: #378ADD;
}

.action-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1A2340;
  margin-bottom: 8px;
}

.action-card p {
  font-size: 13px;
  color: #8A8F9C;
  line-height: 1.6;
  margin-bottom: 16px;
}

.action-link {
  font-size: 13px;
  color: #8A8F9C;
  text-decoration: none;
}

.action-circle {
  position: absolute;
  bottom: -30px;
  right: -30px;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: #F1F3F7;
  pointer-events: none;
}
```

---

## 4. Paleta de colores

| Token              | Valor     | Uso                                   |
|--------------------|-----------|---------------------------------------|
| `sidebar-bg`       | `#1E3A5F` | Fondo del sidebar                     |
| `banner-start`     | `#1A4B9C` | Inicio del gradiente del banner       |
| `banner-end`       | `#2860C0` | Fin del gradiente del banner          |
| `page-bg`          | `#F1F3F7` | Fondo de la página principal          |
| `card-bg`          | `#FFFFFF` | Fondo de tarjetas                     |
| `text-primary`     | `#1A2340` | Títulos y texto principal             |
| `text-secondary`   | `#8A8F9C` | Subtextos, labels, descripciones      |
| `icon-blue`        | `#378ADD` | Ícono Muestras Activas                |
| `icon-green`       | `#1D9E75` | Ícono Reportes Verificados            |
| `icon-amber`       | `#F59E0B` | Ícono Pendientes de Revisión          |
| `nav-active-bg`    | `rgba(255,255,255,0.12)` | Fondo ítem activo del nav |
| `nav-text`         | `rgba(255,255,255,0.65)` | Texto ítems inactivos     |

---

## 5. Tipografía y tokens

- **Fuente:** `Inter`, `system-ui`, o la fuente ya configurada en el proyecto
- **Pesos usados:** 400 (body), 500 (labels/nav), 600 (títulos)
- **Border-radius:** 8px nav items · 12px stat cards · 16px action cards · 20px banner
- **Sombra cards:** `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07)`
- **Sidebar width:** `230px` fijo

---

## 6. Orden de implementación

1. Estructura base (`sidebar` + `main-content` layout)
2. Logo block del sidebar
3. Nav items con estado activo
4. User card inferior del sidebar
5. Banner de bienvenida con gradiente
6. Grid de 3 stats cards
7. Grid de acciones rápidas
8. Reemplazar/eliminar el `<nav>` horizontal actual
9. Ajustar rutas internas si el router depende del nav anterior

---

## Notas

- Las páginas **Búsqueda ALI** y **Generar ALI** no cambian su lógica interna, solo se les quita el nav horizontal y heredan el nuevo layout con sidebar.
- El sidebar debe marcarse como `active` según la ruta actual para mostrar el ítem correcto con el punto indicador.
- Si el proyecto usa Tailwind, todos los valores de color y spacing pueden mapearse directamente a clases utilitarias.
