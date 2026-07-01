import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Responsable } from '../../../interfaces/catalogo.interfaces';
import {
  EntDilucionLectura,
  EntMuestraLectura,
  EntResultadoCalculo,
} from '../../../interfaces/enterobacterias.interfaces';
import { environment } from '../../../../environments/environment';

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

function superscript(n: number): string {
  const map: Record<string, string> = {
    '0': '⁰','1': '¹','2': '²','3': '³','4': '⁴','5': '⁵',
    '6': '⁶','7': '⁷','8': '⁸','9': '⁹','-': '⁻',
  };
  return String(n).split('').map(c => map[c] ?? c).join('');
}

function formatUfcValue(n: number | null): string {
  if (n === null) return 'Sin datos';
  if (n <= 0) return '< 1 UFC/g';
  const exp = Math.floor(Math.log10(n));
  const mantisa = Math.round((n / Math.pow(10, exp)) * 10) / 10;
  return `${mantisa} × 10${superscript(exp)} UFC/g`;
}

export function formatResultadoEnt(r: EntResultadoCalculo): string {
  const valor = formatUfcValue(r.nEnterobacterias);
  const estimado = r.esEstimado ? ' (estimado)' : '';
  if (r.operador === '=') return `${valor}${estimado}`;
  return `${r.operador} ${valor}${estimado}`;
}

@Component({
  selector: 'app-ent-analisis-lectura',
  templateUrl: './ent-analisis-lectura.component.html',
  styleUrls: ['../components/ent-forms-shared.scss'],
  standalone: false,
})
export class EntAnalisisLecturaComponent {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/formulario/ent/calcular-muestra`;

  @Input() formGroup!: FormGroup;
  @Input() rol?: number;
  @Input() responsables: Responsable[] = [];
  @Input() muestras: EntMuestraLectura[] = [];
  @Output() muestrasChange = new EventEmitter<EntMuestraLectura[]>();

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

  updateColonias(muestraIdx: number, dilIdx: number, placa: 'coloniasA' | 'coloniasB', event: Event): void {
    const value = this.numFromEvent(event);
    this.muestras = this.muestras.map((m, i) => {
      if (i !== muestraIdx) return m;
      const dils = m.diluciones.map((d, j) =>
        j === dilIdx ? { ...d, [placa]: value } : d
      );
      return { ...m, diluciones: dils };
    });
    this.muestrasChange.emit(this.muestras);
  }

  updateExponente(muestraIdx: number, dilIdx: number, event: Event): void {
    const raw = this.numFromEvent(event);
    if (raw === null) return;
    const exponent = raw > 0 ? -raw : raw;
    this.muestras = this.muestras.map((m, i) => {
      if (i !== muestraIdx) return m;
      const dils = m.diluciones.map((d, j) =>
        j === dilIdx ? { ...d, exponent } : d
      );
      return { ...m, diluciones: dils };
    });
    this.muestrasChange.emit(this.muestras);
  }

  async calcularMuestra(idx: number): Promise<void> {
    const muestra = this.muestras[idx];
    this.setLoading(idx, true);

    try {
      const diluciones = muestra.diluciones.map(d => ({
        dil: d.exponent,
        colonias: [d.coloniasA ?? null, d.coloniasB ?? null],
      }));

      const resultado = await firstValueFrom(
        this.http.post<EntResultadoCalculo>(this.apiUrl, { diluciones })
      );

      this.muestras = this.muestras.map((m, i) =>
        i === idx ? { ...m, resultado, isLoading: false } : m
      );
    } catch {
      this.setLoading(idx, false);
    }

    this.muestrasChange.emit(this.muestras);
  }

  formatResultado(r: EntResultadoCalculo): string {
    return formatResultadoEnt(r);
  }

  expInputValue(exp: number): number {
    return Math.abs(exp);
  }

  private setLoading(idx: number, loading: boolean): void {
    this.muestras = this.muestras.map((m, i) =>
      i === idx ? { ...m, isLoading: loading } : m
    );
    this.muestrasChange.emit(this.muestras);
  }

  private numFromEvent(event: Event): number | null {
    const input = event.target as HTMLInputElement | null;
    if (!input || input.value.trim() === '') return null;
    const value = Number(input.value);
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
}
