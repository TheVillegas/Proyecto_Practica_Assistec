# Master Technical Specification: Asistec Lab UI Redesign

This document provides the definitive implementation guide for the **Asistec Lab** management system redesign. It is structured for developers using the **Angular + Ionic + Tailwind** stack, ensuring high fidelity to the established design system.

---

## 1. Core Technical Stack & Architecture
- **Framework:** Angular 17+ (Strict adherence to `NgModules`; **do not use** `standalone: true`).
- **UI Library:** Ionic Framework 7+ (Primary use of `<ion-*>` components for semantic consistency).
- **Styling Engine:** Tailwind CSS 3.x + SCSS.
- **Implementation Pattern:** Use semantic class names in HTML (e.g., `class="bento-card"`) and apply Tailwind utilities in `.scss` files via `@apply`.

---

## 2. Design Tokens (Asistec Lab System)

### 2.1 Color Palette (SCSS Variables)
| Variable | Hex Code | Application |
| :--- | :--- | :--- |
| `$brand-navy` | `#29588C` | Main Header, Primary Brand Backgrounds. |
| `$brand-blue` | `#006EB6` | Primary Buttons, Active States, Key Highlights. |
| `$bg-global` | `#F4F4F4` | General App Background (`ion-content`). |
| `$surface-white`| `#FFFFFF` | Cards, Modals, Accordions, Data Containers. |
| `$text-primary` | `#1E293B` | Main Body Text, Headings. |
| `$border-subtle`| `#E5E7EB` | Dividers, Input Borders, Card Outlines. |

### 2.2 Typography
- **Primary Font:** `'Inclusive Sans', sans-serif` (Clinical and readable).
- **Secondary Font:** `'Inter', sans-serif` (Used for data-dense UI elements).

### 2.3 Depth & Elevation
- **Card Shadow (`shadow-card`):** `0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)`
- **Input Shadow (`shadow-input`):** `0 1px 2px 0 rgba(0, 0, 0, 0.05)`

---

## 3. Screen-Specific Implementation Guides

### 3.1 Home Dashboard (Bento Layout)
- **Layout:** Use a CSS Grid-based Bento layout.
- **Components:**
  - **Welcome Card:** Hero section with `$brand-navy` gradient.
  - **Stat Cards:** High-contrast numbers with success/warning micro-indicators.
  - **Quick Action Cards:** Interactive tiles with prominent icons and clear CTA buttons (`ion-button`).

### 3.2 Búsqueda ALI (Search & Data Table)
- **Search Header:** Persistent search bar with filter chips (`ion-chip`).
- **Data Table:** Modern, row-based interactive list. 
  - Each row should have hover states (`@apply transition-colors hover:bg-blue-50`).
  - Status badges must use the semantic color tokens (Green/Success, Amber/Warning, Red/Danger).

### 3.3 Generar ALI Básico (Step-by-Step Form)
- **Wizard Flow:** Use a clear step indicator at the top.
- **Form Groups:**
  - Standardized structure: `<div class="form-group"> <ion-label>...</ion-label> <ion-input>...</ion-input> </div>`.
  - **SCSS:** `.form-group { @apply flex flex-col gap-2 mb-6; }`
- **Validation:** Real-time visual feedback on focus/blur using `$brand-blue` for focus rings.

### 3.4 Configuración de Usuario (Profile Management)
- **Split Layout:** Sidebar for navigation within settings and main content area for forms.
- **Profile Header:** Clean avatar integration with secondary metadata (Role, ID).
- **Toggles:** Use `<ion-toggle>` for interface preferences (Dark Mode, Notifications) with the brand blue accent.

---

## 4. Global Implementation Rules (Antigravity Quality Standards)
1. **No Inline Utility Bloat:** Keep HTML clean. Move complex Tailwind strings to `.scss` files.
2. **Ionic Semantics:** Always prefer `<ion-grid>`, `<ion-row>`, and `<ion-col>` for layout structure to ensure mobile-first responsiveness.
3. **Clinical Aesthetic:** Maintain ample whitespace (minimum 16px-24px padding between cards) to reduce cognitive load for lab technicians.
4. **Button Hierarchy:** 
   - **Primary:** Filled (`fill="solid"`) with `$brand-blue`.
   - **Secondary/Cancel:** Outline (`fill="outline"`) with medium/grey tones.

---
*End of Specification Document*