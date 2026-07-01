# Sistema de diseño ASISTEC — tokens, clases y snippets

Reproduce el look canónico (basado en `form-s-aureus` y `form-coliformes`, los más
estandarizados). No inventes clases nuevas: usa las de este catálogo + utilitarios Tailwind.

## Índice
- [Tokens de color](#tokens-de-color)
- [Catálogo de clases](#catálogo-de-clases)
- [Estructura de página](#estructura-de-página)
- [Stepper](#stepper)
- [Form card y control card](#form-card-y-control-card)
- [Form group (input / select / fecha / hora / analista)](#form-group)
- [Opción + código](#opción--código)
- [Cumple / No Cumple (radio + badge)](#cumple--no-cumple)
- [Tabla de muestras](#tabla-de-muestras)
- [Bloque de resultados](#bloque-de-resultados)
- [Footer de navegación](#footer-de-navegación)

## Tokens de color
Definir UNA vez en el SCSS (no duplicar entre formularios):

```scss
$brand-navy:    #29588C;
$brand-blue:    #006EB6;
$brand-blue-dk: #004f8a;
$bg-global:     #F4F4F4;
$surface-white: #FFFFFF;
$text-primary:  #1E293B;
$border-subtle: #E5E7EB;
$color-24h:     #0369a1;  // sky-700
$color-48h:     #7c3aed;  // violet-700  (también color del duplicado)
$color-pos:     #16a34a;  // green-600
$color-neg:     #dc2626;  // red-600
```
Tipografía: `Inter, sans-serif`. Botón guardar/enviar verde `#16A34A`, cancelar rojo `#e70101`.

## Catálogo de clases
- Layout: `wizard-container`, `etapa-panel`, `page-content`.
- Stepper: `stepper-wrapper`, `stepper-bar`, `stepper-progress`, `stepper-steps`,
  `step-btn` (+ `--active`, `--done`), `step-circle`, `step-label`.
- Tarjetas: `form-card`, `form-card-header` (+ `header-24h`, `header-48h`),
  `form-card-title-group`, `card-header-icon`, `form-card-title`, `form-card-body`,
  `control-card`, `control-title`.
- Formulario: `form-group`, `form-label`, `form-input`, `form-select`, `form-textarea`,
  `form-radio-group`, `form-check-label`, `form-radio`, `form-checkbox`, `required-star`,
  `optional-tag`, `error-msg`, `input-error`, `input-locked`.
- Badges: `badge-etapa`, `badge-presencia`, `badge-ausencia`.
- Tabla: `tabla-wrapper`, `tabla-submuestras`, `th-dilucion`, `th-duplicado`, `th-sub`,
  `td-dilucion`, `td-celda` (+ `celda-pos`, `celda-neg`), `celda-badge`, `tabla-hint`.
- Resultados: `nmp-banner`, `nmp-grid`, `nmp-card`, `nmp-label`, `btn-calcular-nmp`.
- Footer: `nav-footer`, `nav-footer__actions`, `btn-primary`, `btn-secondary`, `btn-draft`,
  `btn-cancel`, `btn-save`.
- Importados/solo lectura: `seccion-importada`, `seccion-tag`, `seccion-divider`, `input-locked`.

## Estructura de página
```html
<ion-header>
  <ion-toolbar class="header-toolbar">
    <ion-buttons slot="start">
      <ion-button (click)="confirmarCancelar()" class="btn-back">
        <ion-icon name="arrow-back-outline" slot="icon-only"></ion-icon>
      </ion-button>
    </ion-buttons>
    <ion-title class="header-title">
      <ion-icon name="flask-outline" class="header-icon"></ion-icon>
      Análisis de <NOMBRE>
    </ion-title>
    <ion-buttons slot="end">
      <span class="badge-etapa">{{ etapaActual }}/{{ TOTAL_ETAPAS }}</span>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content class="page-content">
  <div class="wizard-container">
    <!-- stepper -->
    <form [formGroup]="form">
      <div *ngIf="etapaActual === 1" class="etapa-panel animate__animated animate__fadeIn">
        <!-- form-card de la etapa -->
      </div>
      <!-- … más etapas … -->
    </form>
    <!-- nav-footer -->
  </div>
</ion-content>
```

## Stepper
```html
<div class="stepper-wrapper">
  <div class="stepper-bar">
    <div class="stepper-progress" [style.width.%]="progresoPorcentaje"></div>
  </div>
  <div class="stepper-steps">
    <button *ngFor="let nombre of NOMBRES_ETAPAS; let i = index" class="step-btn"
      [class.step-btn--active]="etapaActual === i + 1"
      [class.step-btn--done]="etapaActual > i + 1" (click)="irAEtapa(i + 1)">
      <span class="step-circle">{{ i + 1 }}</span>
      <span class="step-label">{{ nombre }}</span>
    </button>
  </div>
</div>
```

## Form card y control card
```html
<div class="form-card">
  <div class="form-card-header">
    <div class="form-card-title-group">
      <ion-icon name="time-outline" class="card-header-icon"></ion-icon>
      <h2 class="form-card-title">1. Inicio, Incubación y Siembra</h2>
    </div>
  </div>
  <div class="form-card-body">
    <div class="control-card mb-6">
      <p class="control-title text-blue-700 border-b border-slate-200 pb-2">Inicio Incubación</p>
      <!-- form-groups -->
    </div>
  </div>
</div>
```

## Form group
Patrones de campo. El "analista" SIEMPRE sale de `listaResponsables`:
```html
<!-- fecha / hora -->
<div class="form-group">
  <label class="form-label text-xs">Fecha <span class="required-star">*</span></label>
  <input type="date" class="form-input" formControlName="e1_fechaInicio"
         [class.input-error]="campoInvalido('e1_fechaInicio')" />
</div>

<!-- analista (maestra responsables) -->
<div class="form-group">
  <label class="form-label text-xs">Analista <span class="required-star">*</span></label>
  <select class="form-select" formControlName="e1_analistaInicio"
          [class.input-error]="campoInvalido('e1_analistaInicio')">
    <option value="">Seleccionar analista...</option>
    <option *ngFor="let r of listaResponsables" [value]="r.rut">{{ r.nombreApellido }}</option>
  </select>
</div>
```

## Opción + código
Estufa / micropipeta / equipo: select sobre maestra, el código va en el label. **Sin** input
de texto paralelo para el código.
```html
<div class="form-group">
  <label class="form-label">Micropipeta</label>
  <select class="form-select" formControlName="e1_micropipeta"
          [class.input-error]="campoInvalido('e1_micropipeta')">
    <option [ngValue]="null">Seleccionar micropipeta...</option>
    <option *ngFor="let p of listaPipetas" [ngValue]="p.idPipeta">
      {{ p.codigoPipeta }} - {{ p.nombrePipeta }}
    </option>
  </select>
</div>

<div class="form-group">
  <label class="form-label">Estufa <span class="required-star">*</span></label>
  <select class="form-select" formControlName="e1_estufa"
          [class.input-error]="campoInvalido('e1_estufa')">
    <option [ngValue]="null">Seleccionar estufa...</option>
    <option *ngFor="let eq of listaEquiposIncubacion" [ngValue]="eq.idIncubacion">
      {{ eq.nombreEquipo }}
    </option>
  </select>
</div>
```

## Cumple / No Cumple
NO usar `<select>`. Patrón radio + badge:
```html
<div class="form-group bg-white p-3 rounded-lg border border-slate-100">
  <p class="text-xs font-semibold text-slate-600 mb-2">Estado</p>
  <div class="flex gap-4">
    <label class="form-check-label text-xs">
      <input type="radio" class="form-radio" name="e1_duplicadoAliCumple"
             [(ngModel)]="e1_duplicadoAliCumple" value="cumple"
             [ngModelOptions]="{standalone: true}" />
      <span class="badge-presencia text-[#00558f] bg-blue-100">Cumple</span>
    </label>
    <label class="form-check-label text-xs">
      <input type="radio" class="form-radio" name="e1_duplicadoAliCumple"
             [(ngModel)]="e1_duplicadoAliCumple" value="no_cumple"
             [ngModelOptions]="{standalone: true}" />
      <span class="badge-ausencia text-red-700 bg-red-100">No Cumple</span>
    </label>
  </div>
</div>
```

## Tabla de muestras
Columnas: Dilución (sticky) · M1 · Duplicado (`th-duplicado`, color 48h) · M2…M5. Para análisis
con cálculo denso (S. Aureus) usar una **tarjeta por muestra** en vez de tabla. El duplicado
puede importar datos de un ALI previo (sección `seccion-importada` + `input-locked`, botones
"Re-importar" / "Editar manualmente").
```html
<div class="tabla-wrapper">
  <table class="tabla-submuestras">
    <thead>
      <tr>
        <th class="th-dilucion">Dil</th>
        <th>M1</th>
        <th class="th-duplicado">Dup</th>
        <th>M2</th><th>M3</th><th>M4</th><th>M5</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="td-dilucion">10⁻²</td>
        <!-- celdas editables -->
      </tr>
    </tbody>
  </table>
</div>
```

## Bloque de resultados
Tarjetas resaltadas. Mostrar variables intermedias + resultado final con unidad y estado
(`✓` válido, `⚠` SD/sin dato). Ejemplo de tarjeta:
```html
<div class="nmp-card">
  <p class="nmp-label">N S. Aureus</p>
  <p class="text-2xl font-bold text-[#1e3a8a]">1,2 × 10³ <span class="text-sm">UFC/g</span></p>
</div>
```

## Footer de navegación
```html
<div class="nav-footer">
  <button type="button" class="btn-cancel" (click)="confirmarCancelar()">
    <ion-icon name="close-outline"></ion-icon> Cancelar
  </button>
  <div class="nav-footer__actions">
    <button type="button" class="btn-draft" (click)="guardarFormularioBorrador()">
      <ion-icon name="document-outline"></ion-icon> Guardar
    </button>
    <button type="button" class="btn-secondary" (click)="retrocederEtapa()" *ngIf="etapaActual > 1">
      <ion-icon name="arrow-back-outline"></ion-icon> Anterior
    </button>
    <button type="button" class="btn-save" (click)="enviarFormulario()" *ngIf="etapaActual === TOTAL_ETAPAS">
      <ion-icon name="save-outline"></ion-icon> Enviar Registro
    </button>
    <button type="button" class="btn-primary" (click)="avanzarEtapa()" *ngIf="etapaActual < TOTAL_ETAPAS">
      Siguiente <ion-icon name="arrow-forward-outline"></ion-icon>
    </button>
  </div>
</div>
```

## Routing module
```ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Form<Analisis>Page } from './form-<analisis>.page';

const routes: Routes = [{ path: '', component: Form<Analisis>Page }];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class Form<Analisis>PageRoutingModule {}
```
