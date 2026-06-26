import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Responsable } from '../../../interfaces/catalogo.interfaces';
import { EntDilucionLectura, EntMuestraLectura, EntResultadoMuestra } from '../../../interfaces/enterobacterias.interfaces';

export function crearDilucionVacia(exponent = -1): EntDilucionLectura {
  return {
    exponent,
    coloniasA: null,
    coloniasB: null,
    confirmA: null,
    confirmB: null,
    confirmPosA: null,
    confirmPosB: null,
  };
}

export function crearMuestraVacia(label: string): EntMuestraLectura {
  return {
    label,
    diluciones: [crearDilucionVacia(-1), crearDilucionVacia(-2)],
    resultado: undefined,
    isLoading: false,
  };
}

/** NCh2676 – compute estimated confirmed colonies for a single plate. */
function calcularA(C: number | null, A: number | null, b: number | null): number | null {
  if (C === null || C < 0) return null;
  if (A === null || b === null || A <= 0) return C; // assume 100% confirmation
  const ratio = b / A;
  if (ratio >= 0.80) return C;
  return Math.round((b * C) / A);
}

/** NCh2676 – compute N (UFC/g) for a single muestra. */
export function calcularResultadoMuestra(muestra: EntMuestraLectura): EntResultadoMuestra {
  const dil1 = muestra.diluciones[0];
  const dil2 = muestra.diluciones[1];

  const d1 = dil1 ? Math.pow(10, dil1.exponent) : null;
  const d2 = dil2 ? Math.pow(10, dil2.exponent) : null;

  // Confirmed colony counts per plate
  const a1A = dil1 ? calcularA(dil1.coloniasA, dil1.confirmA, dil1.confirmPosA) : null;
  const a1B = dil1 ? calcularA(dil1.coloniasB, dil1.confirmB, dil1.confirmPosB) : null;
  const a2A = dil2 ? calcularA(dil2.coloniasA, dil2.confirmA, dil2.confirmPosA) : null;
  const a2B = dil2 ? calcularA(dil2.coloniasB, dil2.confirmB, dil2.confirmPosB) : null;

  // n1: plates counted from lowest dilution; n2: from next dilution
  const n1 = (a1A !== null ? 1 : 0) + (a1B !== null ? 1 : 0);
  const n2 = (a2A !== null ? 1 : 0) + (a2B !== null ? 1 : 0);

  const sumaA = (a1A ?? 0) + (a1B ?? 0) + (a2A ?? 0) + (a2B ?? 0);
  const dFactor = d1 ?? 1;

  // Estimación (both plates < 15 colonies, first dilution only)
  const c1A = dil1?.coloniasA ?? null;
  const c1B = dil1?.coloniasB ?? null;
  if (
    n2 === 0 &&
    n1 === 2 &&
    c1A !== null && c1A < 15 &&
    c1B !== null && c1B < 15
  ) {
    const m = (c1A + c1B) / 2;
    const Ne = m / dFactor;
    return {
      sumaA: c1A + c1B,
      n1: 2,
      n2: 0,
      d: dFactor,
      ufc: Ne,
      textoReporte: `Ne = ${formatUfc(Ne)} UFC/g (estimado)`,
      esEstimado: true,
    };
  }

  if (n1 === 0) {
    return { sumaA: 0, n1: 0, n2: 0, d: dFactor, ufc: null, textoReporte: 'Sin datos', esEstimado: false };
  }

  const N = sumaA / ((n1 + 0.1 * n2) * dFactor);
  return {
    sumaA,
    n1,
    n2,
    d: dFactor,
    ufc: N,
    textoReporte: `${formatUfc(N)} UFC/g`,
    esEstimado: false,
  };
}

function formatUfc(n: number): string {
  if (n <= 0) return '< 1';
  const exp = Math.floor(Math.log10(n));
  const mantisa = n / Math.pow(10, exp);
  const m = Math.round(mantisa * 10) / 10;
  return `${m} × 10${superScript(exp)}`;
}

function superScript(n: number): string {
  const map: Record<string, string> = {
    '0': '⁰','1': '¹','2': '²','3': '³','4': '⁴','5': '⁵',
    '6': '⁶','7': '⁷','8': '⁸','9': '⁹','-': '⁻',
  };
  return String(n).split('').map(c => map[c] ?? c).join('');
}

@Component({
  selector: 'app-ent-analisis-lectura',
  templateUrl: './ent-analisis-lectura.component.html',
  styleUrls: ['../components/ent-forms-shared.scss'],
  standalone: false,
})
export class EntAnalisisLecturaComponent {
  @Input() formGroup!: FormGroup;
  @Input() rol?: number;
  @Input() responsables: Responsable[] = [];
  @Input() muestras: EntMuestraLectura[] = [];
  @Output() muestrasChange = new EventEmitter<EntMuestraLectura[]>();

  readonly EXPONENT_OPTIONS = [-1, -2, -3, -4, -5];

  campoInvalido(nombre: string): boolean {
    const ctrl = this.formGroup.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  hoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  trackByIndex(index: number): number {
    return index;
  }

  agregarMuestra(): void {
    const label = `M${this.muestras.length + 1}`;
    this.muestras = [...this.muestras, crearMuestraVacia(label)];
    this.muestrasChange.emit(this.muestras);
  }

  eliminarMuestra(idx: number): void {
    this.muestras = this.muestras.filter((_, i) => i !== idx);
    this.muestrasChange.emit(this.muestras);
  }

  agregarDilucion(muestraIdx: number): void {
    const muestra = this.muestras[muestraIdx];
    const lastExp = muestra.diluciones[muestra.diluciones.length - 1]?.exponent ?? -1;
    const newDil = crearDilucionVacia(lastExp - 1);
    this.muestras = this.muestras.map((m, i) =>
      i === muestraIdx ? { ...m, diluciones: [...m.diluciones, newDil] } : m
    );
    this.muestrasChange.emit(this.muestras);
  }

  eliminarDilucion(muestraIdx: number, dilIdx: number): void {
    this.muestras = this.muestras.map((m, i) =>
      i === muestraIdx ? { ...m, diluciones: m.diluciones.filter((_, j) => j !== dilIdx) } : m
    );
    this.muestrasChange.emit(this.muestras);
  }

  updateDilucion(muestraIdx: number, dilIdx: number, field: keyof EntDilucionLectura, value: unknown): void {
    this.muestras = this.muestras.map((m, i) => {
      if (i !== muestraIdx) return m;
      const dils = m.diluciones.map((d, j) =>
        j === dilIdx ? { ...d, [field]: value } : d
      );
      return { ...m, diluciones: dils };
    });
    this.muestrasChange.emit(this.muestras);
  }

  calcularMuestra(idx: number): void {
    const muestra = this.muestras[idx];
    const resultado = calcularResultadoMuestra(muestra);
    this.muestras = this.muestras.map((m, i) =>
      i === idx ? { ...m, resultado } : m
    );
    this.muestrasChange.emit(this.muestras);
  }

  expLabel(exp: number): string {
    return `10${superScript(exp)}`;
  }

  dFactorLabel(exp: number): string {
    return `d = 10${superScript(exp)} (${Math.pow(10, exp).toExponential()})`;
  }
}
