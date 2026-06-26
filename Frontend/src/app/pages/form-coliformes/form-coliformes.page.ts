import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import {
  forkJoin,
  of,
  map,
  firstValueFrom,
} from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CatalogosService } from '../../services/catalogos.service';
import { ColiformesApiService } from '../../services/coliformes-api.service';
import { EquipoIncubacion, Micropipeta, Responsable } from '../../interfaces/catalogo.interfaces';
import {
  CalcularNmpPayload,
  ColiFormulario,
  ColiMuestra,
  SaveFase1Payload,
  SaveFase2Payload,
  SaveFase3Payload,
  SaveFase35Payload,
  SaveFase4Payload,
} from '../../interfaces/coliformes.interfaces';

export type ResultadoSubmuestra = 'positivo' | 'negativo' | 'sin_registrar';
export type ControlPresencia = 'presencia' | 'ausencia' | 'sin_registrar';

export interface EntradaMuestra {
  id: string;
  esDuplicado: boolean;
  label: string;
  /** submuestras24h[dilucion][tuboIndex] */
  submuestras24h: Record<string, [ResultadoSubmuestra, ResultadoSubmuestra, ResultadoSubmuestra]>;
  /** submuestras48h[dilucion][tuboIndex] */
  submuestras48h: Record<string, [ResultadoSubmuestra, ResultadoSubmuestra, ResultadoSubmuestra]>;
  /** Resultados NMP devueltos por el backend (se llenan tras calcularNMP) */
  resultados?: {
    ct: string;
    cf: string;
    ecoli: string;
  };
}

const DILUCIONES_FIJAS: string[] = ['1ml', '0.1ml', '0.01ml'];
const RESULTADO_DEFAULT: ResultadoSubmuestra = 'sin_registrar';

function crearSubmuestrasDefault(): EntradaMuestra['submuestras24h'] {
  const sub: EntradaMuestra['submuestras24h'] = {};
  DILUCIONES_FIJAS.forEach(d => {
    sub[d] = [RESULTADO_DEFAULT, RESULTADO_DEFAULT, RESULTADO_DEFAULT];
  });
  return sub;
}

function crearEntradaDesdeMuestra(muestra: ColiMuestra): EntradaMuestra {
  return {
    id: String(muestra.idColiMuestra),
    esDuplicado: muestra.esDuplicado,
    label: muestra.numeroMuestra,
    submuestras24h: crearSubmuestrasDefault(),
    submuestras48h: crearSubmuestrasDefault(),
  };
}

@Component({
  selector: 'app-form-coliformes',
  templateUrl: './form-coliformes.page.html',
  styleUrls: ['./form-coliformes.page.scss'],
  standalone: false,
})
export class FormColiformesPage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private catalogosService = inject(CatalogosService);
  private coliService = inject(ColiformesApiService);

  // ─── Wizard ──────────────────────────────────────────────────────────────────
  readonly TOTAL_ETAPAS = 4;
  etapaActual = 1;
  readonly NOMBRES_ETAPAS = [
    'Alimento e Incubación',
    'Detalles de Siembra',
    'Control de Calidad',
    'Lecturas y Resultados NMP',
  ];

  // ─── Formulario ──────────────────────────────────────────────────────────────
  idFormulario = 0;
  formularioUpdatedAt = '';
  form!: FormGroup;
  muestras: ColiMuestra[] = [];
  /** Entradas por muestra para las tarjetas de la etapa 4 */
  entradasMuestra: EntradaMuestra[] = [];

  // ─── Catálogos ──────────────────────────────────────────────────────────────
  listaEquiposIncubacion: EquipoIncubacion[] = [];
  listaPipetas: Micropipeta[] = [];
  listaResponsables: Responsable[] = [];

  // ─── Diluciones fijas ────────────────────────────────────────────────────────
  readonly DILUCIONES: string[] = [...DILUCIONES_FIJAS];

  // ─── Datos de lectura (compartidos entre todas las muestras) ─────────────────
  fechaLectura24h = '';
  horaLectura24h = '';
  analista24h = '';
  fechaLectura48h = '';
  horaLectura48h = '';
  analista48h = '';
  errorHora24h = '';
  errorHora48h = '';

  // ─── Etapa 3: controles de calidad ──────────────────────────────────────────
  ct_controlKAerogenes: ControlPresencia = 'sin_registrar';
  ct_controlSAureus: ControlPresencia = 'sin_registrar';
  ct_controlEColi: ControlPresencia = 'sin_registrar';
  ct_controlBlanco = '';

  cf_controlEColi: ControlPresencia = 'sin_registrar';
  cf_controlKAerogenes: ControlPresencia = 'sin_registrar';
  cf_controlBlanco = '';

  ec_controlEColi: ControlPresencia = 'sin_registrar';
  ec_controlKAerogenes: ControlPresencia = 'sin_registrar';
  ec_controlBlanco = '';

  // ─── IDs locales para muestras creadas en el frontend ─────────────────────
  private localIdCounter = 0;

  // ─── Estado NMP ─────────────────────────────────────────────────────────────
  calculando = false;
  nmpCalculado = false;

  // ─── Observaciones ──────────────────────────────────────────────────────────
  observacionesFinales = '';

  // ─── Datos importados de solicitud ─────────────────────────────────────────
  datosImportados = {
    codigoAlimento: '',
    fechaIncubacion: '',
    horaIncubacion: '',
    analistaIncubacion: '',
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═════════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('idFormulario')
      || this.route.snapshot.queryParamMap.get('idFormulario')
      || this.route.snapshot.queryParamMap.get('analisis')?.split(',')[0];

    if (!idParam) {
      this.mostrarAlerta('Error', 'No se encontró el identificador del formulario.');
      this.router.navigate(['/home']);
      return;
    }
    this.idFormulario = Number(idParam);

    this.initForm();

    const vieneDeAliCard = !!this.route.snapshot.queryParamMap.get('analisis');
    const formulario$ = vieneDeAliCard
      ? this.coliService.obtenerPorAnalisis(this.idFormulario).pipe(
          map(resp => {
            if (!resp.existe || !resp.formulario) throw { status: 404 };
            return resp.formulario;
          })
        )
      : this.coliService.getFormulario(this.idFormulario);

    forkJoin({
      equipos: this.catalogosService.getEquiposIncubacion().pipe(
        catchError(() => {
          console.warn('[Coli] Catálogo equipos_incubacion no disponible');
          return of([] as EquipoIncubacion[]);
        })
      ),
      pipetas: this.catalogosService.getMicroPipetas().pipe(
        catchError(() => {
          console.warn('[Coli] Catálogo micropipetas no disponible');
          return of([] as Micropipeta[]);
        })
      ),
      responsables: this.catalogosService.getResponsables().pipe(
        catchError(() => {
          console.warn('[Coli] Catálogo responsables no disponible');
          return of([] as Responsable[]);
        })
      ),
      formulario: formulario$,
    }).subscribe({
      next: (res) => {
        this.listaEquiposIncubacion = res.equipos;
        this.listaPipetas = res.pipetas;
        this.listaResponsables = res.responsables;
        this.cargarFormulario(res.formulario);
      },
      error: (err: { status?: number }) => {
        if (err.status === 404) {
          this.mostrarAlerta(
            'Formulario no encontrado',
            'El formulario solicitado no existe o fue eliminado. Será redirigido al inicio.'
          );
          this.router.navigate(['/home']);
          return;
        }
        this.mostrarToast('Error al cargar datos del formulario.', 'danger');
      },
    });
  }

  ngOnDestroy(): void {
    // cleanup
  }

  private initForm(): void {
    this.form = this.fb.group({
      ct_analistaInicio: [''],
      ct_analistaTermino: [''],
      cf_analistaInicio: [''],
      cf_analistaTermino: [''],
      ec_analistaInicio: [''],
      ec_analistaTermino: [''],
      ct_fechaInicio: [''],
      ct_horaInicio: [''],
      ct_fechaTermino: [''],
      ct_horaTermino: [''],
      caldoLauril: [''],
      tween80: [''],
      estufas: [[] as number[]],
      micropipeta1ml: [null as Micropipeta | null],
      micropipeta10ml: [null as Micropipeta | null],
      muestra10g90ml: [''],
      muestra50g450ml: [''],
    });
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // CARGA DE FORMULARIO
  // ═════════════════════════════════════════════════════════════════════════════

  private cargarFormulario(formulario: ColiFormulario): void {
    // IMPORTANTE: sobrescribir con el id REAL del formulario
    // (cuando se navega desde ALI, idFormulario es el id del análisis, no del formulario)
    this.idFormulario = formulario.idColiFormulario;
    this.formularioUpdatedAt = formulario.updatedAt || '';
    this.etapaActual = formulario.faseActual || 1;
    this.muestras = formulario.muestras || [];

    // Inicializar entradas por muestra
    if (this.muestras.length > 0) {
      this.entradasMuestra = this.muestras.map((m) => crearEntradaDesdeMuestra(m));
    }

    // Cargar fase 1
    if (formulario.fase1) {
      const f1 = formulario.fase1;
      this.form.patchValue({
        ct_analistaInicio: f1.rutAnalistaInicio,
        ct_analistaTermino: f1.rutAnalistaTermino,
        cf_analistaInicio: f1.rutAnalistaInicio,
        cf_analistaTermino: f1.rutAnalistaTermino,
        ec_analistaInicio: f1.rutAnalistaInicio,
        ec_analistaTermino: f1.rutAnalistaTermino,
      });
    }

    // Cargar fase 2
    if (formulario.fase2) {
      const f2 = formulario.fase2;
      const normCap = (c: string) => c.replace(/\s+/g, '').toLowerCase();
      this.form.patchValue({
        caldoLauril: f2.codigoCaldoLauril,
        tween80: f2.codigoTween80,
        estufas: f2.estufas.map((e) => e.idIncubacion),
        micropipeta1ml: this.listaPipetas.find(p =>
          f2.micropipetas.some(mp => mp.idPipeta === p.idPipeta && normCap(mp.capacidad) === '1ml')
        ) || null,
        micropipeta10ml: this.listaPipetas.find(p =>
          f2.micropipetas.some(mp => mp.idPipeta === p.idPipeta && normCap(mp.capacidad) === '10ml')
        ) || null,
      });
    }

    // Cargar fase 3 (submuestras) — poblar las entradas con datos guardados
    if (formulario.fase3 && formulario.fase3.submuestras) {
      for (const sub of formulario.fase3.submuestras) {
        const entrada = this.entradasMuestra.find(e => Number(e.id) === sub.idColiMuestra);
        if (!entrada) continue;
        const target = entrada.submuestras24h; // Cargamos todo en 24h (legacy)
        if (target[sub.dilucion]) {
          target[sub.dilucion][sub.numeroTubo - 1] = sub.presencia === null
            ? 'sin_registrar'
            : sub.presencia ? 'positivo' : 'negativo';
        }
      }
    }

    // Cargar fase 3.5 (controles)
    if (formulario.fase35Controles) {
      const c = formulario.fase35Controles as unknown as Record<string, string>;
      this.ct_controlKAerogenes = this.toControlPresencia(c['ctrlTotKAerogenes'] ?? c['ctControlKAerogenes']);
      this.ct_controlSAureus = this.toControlPresencia(c['ctrlTotSAureus'] ?? c['ctControlSAureus']);
      this.ct_controlEColi = this.toControlPresencia(c['ctControlEColi']);
      this.ct_controlBlanco = c['blancoTotales'] ?? c['ctControlBlanco'] ?? '';
      this.cf_controlEColi = this.toControlPresencia(c['ctrlFecEColi'] ?? c['cfControlEColi']);
      this.cf_controlKAerogenes = this.toControlPresencia(c['ctrlFecKAerogenes'] ?? c['cfControlKAerogenes']);
      this.cf_controlBlanco = c['blancoFecales'] ?? c['cfControlBlanco'] ?? '';
      this.ec_controlEColi = this.toControlPresencia(c['ctrlEcoEColi'] ?? c['ecControlEColi']);
      this.ec_controlKAerogenes = this.toControlPresencia(c['ctrlEcoKAerogenes'] ?? c['ecControlKAerogenes']);
      this.ec_controlBlanco = c['blancoEcoli'] ?? c['ecControlBlanco'] ?? '';
    }

    // Cargar fase 4 (resultados NMP)
    if (formulario.fase4Resultado && formulario.fase4Resultado.length > 0) {
      this.nmpCalculado = true;
      for (const r of formulario.fase4Resultado) {
        const entrada = this.entradasMuestra.find(e => Number(e.id) === r.idColiMuestra);
        if (entrada) {
          entrada.resultados = {
            ct: String(r.coliformesTotales),
            cf: String(r.coliformesFecales),
            ecoli: String(r.eColi),
          };
        }
      }
    }
  }

  private toControlPresencia(valor: string): ControlPresencia {
    if (valor === 'presencia') return 'presencia';
    if (valor === 'ausencia') return 'ausencia';
    return 'sin_registrar';
  }

  private obtenerLabelMuestra(idColiMuestra: number): string {
    const muestra = this.muestras.find((m) => m.idColiMuestra === idColiMuestra);
    return muestra?.numeroMuestra || `Muestra ${idColiMuestra}`;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // NAVEGACIÓN
  // ═════════════════════════════════════════════════════════════════════════════

  get progresoPorcentaje(): number {
    return Math.round(((this.etapaActual - 1) / (this.TOTAL_ETAPAS - 1)) * 100);
  }

  avanzarEtapa(): void {
    if (this.etapaActual < this.TOTAL_ETAPAS) {
      this.etapaActual++;
    }
  }

  retrocederEtapa(): void {
    if (this.etapaActual > 1) this.etapaActual--;
  }

  irAEtapa(n: number): void {
    if (n >= 1 && n <= this.TOTAL_ETAPAS) this.etapaActual = n;
  }

  /** Guarda todo el formulario hasta la etapa actual (borrador) */
  async guardarFormularioBorrador(): Promise<void> {
    const exito = await this.guardarBorradorCompleto();
    if (exito) {
      this.mostrarToast('Borrador guardado correctamente', 'success');
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // SUBMUESTRAS (+/− buttons)
  // ═════════════════════════════════════════════════════════════════════════════

  setResultado(
    entrada: EntradaMuestra,
    submuestras: EntradaMuestra['submuestras24h'],
    dilucion: string,
    idx: number,
    valor: 'positivo' | 'negativo'
  ): void {
    submuestras[dilucion][idx] = submuestras[dilucion][idx] === valor ? 'sin_registrar' : valor;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // DUPLICAR / AGREGAR MUESTRA
  // ═════════════════════════════════════════════════════════════════════════════

  /** Solo la primera muestra original puede duplicarse */
  get puedeDuplicar(): boolean {
    return this.entradasMuestra.length > 0 && !this.entradasMuestra[0].esDuplicado;
  }

  duplicarMuestra(entrada: EntradaMuestra): void {
    this.localIdCounter--;
    const idx = this.entradasMuestra.indexOf(entrada);
    if (idx === -1) return;
    const dup: EntradaMuestra = JSON.parse(JSON.stringify(entrada));
    dup.id = String(this.localIdCounter);
    dup.esDuplicado = true;
    dup.label = entrada.label + ' Dup';
    dup.resultados = undefined;
    this.entradasMuestra.splice(idx + 1, 0, dup);
  }

  agregarMuestra(): void {
    this.localIdCounter--;
    const count = this.entradasMuestra.length + 1;
    const nueva: EntradaMuestra = {
      id: String(this.localIdCounter),
      esDuplicado: false,
      label: `Muestra ${count}`,
      submuestras24h: crearSubmuestrasDefault(),
      submuestras48h: crearSubmuestrasDefault(),
    };
    this.entradasMuestra.push(nueva);
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // VALIDACIÓN HORA ±2 HORAS
  // ═════════════════════════════════════════════════════════════════════════════

  private validarRangoHora(horaIngresada: string, horaProgramada: string): string {
    if (!horaIngresada) return 'La hora de lectura es obligatoria.';
    if (!horaProgramada) {
      horaProgramada = this.datosImportados.horaIncubacion || '10:00';
    }
    const parseHora = (h: string): number => {
      if (!h || typeof h !== 'string' || !h.includes(':')) return 0;
      const parts = h.split(':');
      if (parts.length < 2) return 0;
      const hh = Number(parts[0]) || 0;
      const mm = Number(parts[1]) || 0;
      return hh * 60 + mm;
    };
    const minutos = parseHora(horaIngresada);
    const base = parseHora(horaProgramada);
    if (Math.abs(minutos - base) > 120) {
      return 'La hora de lectura debe estar dentro del rango permitido de ±2 horas respecto de la hora programada.';
    }
    return '';
  }

  onHora24hChange(): void {
    this.errorHora24h = this.validarRangoHora(this.horaLectura24h, this.datosImportados.horaIncubacion);
  }

  onHora48hChange(): void {
    this.errorHora48h = this.validarRangoHora(this.horaLectura48h, this.datosImportados.horaIncubacion);
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // GUARDADO
  // ═════════════════════════════════════════════════════════════════════════════

  async guardarBorrador(): Promise<void> {
    await this.guardarFormularioBorrador();
  }

  private async manejarError409(httpErr: { error?: { codigo?: string } }): Promise<void> {
    if (httpErr.error?.codigo === 'INVALID_STAGE_PROGRESSION') {
      await this.mostrarAlerta(
        'Etapas previas incompletas',
        'Para continuar, primero se deben completar y persistir las etapas anteriores del formulario.'
      );
      return;
    }

    await this.mostrarAlerta(
      'Conflicto de concurrencia',
      'El formulario fue modificado por otro usuario. Recargue y vuelva a intentar.'
    );
  }

  private async guardarBorradorCompleto(): Promise<boolean> {
    try {
      for (let fase = 1; fase <= this.etapaActual; fase++) {
        await firstValueFrom(this.ejecutarGuardadoFase(fase, false));
      }
      return true;
    } catch (err: unknown) {
      const httpErr = err as { status?: number; error?: { codigo?: string } };
      if (httpErr.status === 409) {
        await this.manejarError409(httpErr);
      } else {
        this.mostrarToast('Error al guardar el borrador completo.', 'danger');
      }
      return false;
    }
  }

  private ejecutarGuardadoFase(fase: number, completada: boolean) {
    if (!this.idFormulario) {
      return of(undefined);
    }

    switch (fase) {
      case 1: {
        const v = this.form.value;
        const payload: SaveFase1Payload = {
          rutAnalistaInicio: v.ct_analistaInicio,
          rutAnalistaTermino: v.ct_analistaTermino,
          fechaInicioIncubacion: v.ct_fechaInicio && v.ct_horaInicio
            ? `${v.ct_fechaInicio}T${v.ct_horaInicio}:00`
            : undefined,
          fechaTerminoAnalisis: v.ct_fechaTermino && v.ct_horaTermino
            ? `${v.ct_fechaTermino}T${v.ct_horaTermino}:00`
            : undefined,
          completada,
        };
        return this.coliService.saveFase1(this.idFormulario, payload, this.formularioUpdatedAt).pipe(
          switchMap((res) => {
            this.formularioUpdatedAt = res.updatedAt;
            return of(undefined);
          })
        );
      }
      case 2: {
        const pip1 = this.form.value.micropipeta1ml as Micropipeta | null;
        const pip10 = this.form.value.micropipeta10ml as Micropipeta | null;
        const payload: SaveFase2Payload = {
          codigoCaldoLauril: this.form.value.caldoLauril,
          codigoTween80: this.form.value.tween80,
          estufas: (this.form.value.estufas as number[]).map((id: number) => ({ idIncubacion: id })),
          micropipetas: [
            ...(pip1 ? [{ idPipeta: pip1.idPipeta, capacidad: pip1.capacidad }] : []),
            ...(pip10 ? [{ idPipeta: pip10.idPipeta, capacidad: pip10.capacidad }] : []),
          ],
          completada,
        };
        return this.coliService.saveFase2(this.idFormulario, payload, this.formularioUpdatedAt).pipe(
          switchMap((res) => {
            this.formularioUpdatedAt = res.updatedAt;
            return of(undefined);
          })
        );
      }
      // Etapa 3 → backend fase 3.5 (controles de calidad)
      case 3: {
        const payload: SaveFase35Payload = {
          controles: {
            ctControlKAerogenes: this.ct_controlKAerogenes,
            ctControlSAureus: this.ct_controlSAureus,
            ctControlEColi: this.ct_controlEColi,
            ctControlBlanco: this.ct_controlBlanco,
            cfControlEColi: this.cf_controlEColi,
            cfControlKAerogenes: this.cf_controlKAerogenes,
            cfControlBlanco: this.cf_controlBlanco,
            ecControlEColi: this.ec_controlEColi,
            ecControlKAerogenes: this.ec_controlKAerogenes,
            ecControlBlanco: this.ec_controlBlanco,
          },
          completada,
        };
        return this.coliService.saveFase35(this.idFormulario, payload, this.formularioUpdatedAt).pipe(
          switchMap((res) => {
            this.formularioUpdatedAt = res.updatedAt;
            return of(undefined);
          })
        );
      }
      // Etapa 4 → backend fase 3 (submuestras)
      case 4: {
        const payload: SaveFase3Payload = {
          submuestras: this.buildSubmuestrasPayload(),
          completada,
          fechaLectura24h: this.fechaLectura24h && this.horaLectura24h
            ? `${this.fechaLectura24h}T${this.horaLectura24h}:00`
            : undefined,
          rutAnalista24h: this.analista24h || undefined,
          fechaLectura48h: this.fechaLectura48h && this.horaLectura48h
            ? `${this.fechaLectura48h}T${this.horaLectura48h}:00`
            : undefined,
          rutAnalista48h: this.analista48h || undefined,
        };
        return this.coliService.saveFase3(this.idFormulario, payload, this.formularioUpdatedAt).pipe(
          switchMap((res) => {
            this.formularioUpdatedAt = res.updatedAt;
            return of(undefined);
          })
        );
      }
      default:
        return of(undefined);
    }
  }

  /** Construye el array de submuestras para enviar al backend (fase 3 y 4) */
  private buildSubmuestrasPayload(): Array<{
    idColiMuestra: number;
    tipoLectura: 'totales';
    dilucion: string;
    numeroTubo: number;
    presencia: boolean | null;
  }> {
    const result: Array<{
      idColiMuestra: number;
      tipoLectura: 'totales';
      dilucion: string;
      numeroTubo: number;
      presencia: boolean | null;
    }> = [];

    for (const entrada of this.entradasMuestra) {
      for (const dil of this.DILUCIONES) {
        entrada.submuestras24h[dil].forEach((valor, idx) => {
          result.push({
            idColiMuestra: Number(entrada.id),
            tipoLectura: 'totales' as const,
            dilucion: dil,
            numeroTubo: idx + 1,
            presencia: valor === 'sin_registrar' ? null : valor === 'positivo',
          });
        });
      }
      for (const dil of this.DILUCIONES) {
        entrada.submuestras48h[dil].forEach((valor, idx) => {
          result.push({
            idColiMuestra: Number(entrada.id),
            tipoLectura: 'totales' as const,
            dilucion: dil,
            numeroTubo: idx + 1,
            presencia: valor === 'sin_registrar' ? null : valor === 'positivo',
          });
        });
      }
    }

    return result;
  }

  private contarPositivosPorDilucion(
    submuestras: EntradaMuestra['submuestras24h']
  ): [number, number, number] {
    return this.DILUCIONES.map((dil) => (
      submuestras[dil].filter((valor) => valor === 'positivo').length
    )) as [number, number, number];
  }

  private buildCalculoNmpPayload(): CalcularNmpPayload {
    return {
      muestras: this.entradasMuestra.map((entrada) => ({
        idColiMuestra: Number(entrada.id),
        tubosPositivos24h: this.contarPositivosPorDilucion(entrada.submuestras24h),
        tubosPositivos48h: this.contarPositivosPorDilucion(entrada.submuestras48h),
      })),
    };
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // NMP / CÁLCULO
  // ═════════════════════════════════════════════════════════════════════════════

  async calcularNMP(): Promise<void> {
    if (this.entradasMuestra.length === 0) return;
    this.calculando = true;
    try {
      const res = await firstValueFrom(
        this.coliService.calcularNmp(this.idFormulario, this.buildCalculoNmpPayload())
      );

      if (res.fase4Resultado && res.fase4Resultado.length > 0) {
        this.nmpCalculado = true;
        for (const r of res.fase4Resultado) {
          const entrada = this.entradasMuestra.find(e => Number(e.id) === r.idColiMuestra);
          if (entrada) {
            entrada.resultados = {
              ct: String(r.coliformesTotales),
              cf: String(r.coliformesFecales),
              ecoli: String(r.eColi),
            };
          }
        }
        this.mostrarToast('Resultados NMP calculados correctamente.', 'success');
      } else {
        this.mostrarToast('No se obtuvieron resultados del cálculo NMP.', 'warning');
      }
    } catch (err: unknown) {
      const httpErr = err as { status?: number; error?: { codigo?: string } };
      if (httpErr.status === 409) {
        await this.manejarError409(httpErr);
      } else {
        this.mostrarToast('Error al calcular NMP. Intente nuevamente.', 'danger');
      }
    } finally {
      this.calculando = false;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // ENVÍO Y CANCELACIÓN
  // ═════════════════════════════════════════════════════════════════════════════

  async enviarFormulario(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      await this.mostrarAlerta(
        'Campos incompletos',
        'Existen campos obligatorios sin completar. Revise cada etapa.'
      );
      return;
    }

    if (!this.nmpCalculado) {
      await this.mostrarAlerta(
        'Resultados Incompletos',
        'Por favor calcule los resultados NMP antes de enviar.'
      );
      return;
    }

    const exito = await this.guardarFaseActual(true);
    if (exito) {
      await this.mostrarAlerta('Éxito', 'Registro de análisis Coliformes enviado correctamente.');
      this.router.navigate(['/home']);
    }
  }

  private async guardarFaseActual(completada: boolean): Promise<boolean> {
    try {
      await firstValueFrom(this.ejecutarGuardadoFase(this.etapaActual, completada));
      return true;
    } catch (err: unknown) {
      const httpErr = err as { status?: number; error?: { codigo?: string } };
      if (httpErr.status === 409) {
        await this.manejarError409(httpErr);
      } else {
        this.mostrarToast('Error al guardar. Intente nuevamente.', 'danger');
      }
      return false;
    }
  }

  async confirmarCancelar(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cancelar registro',
      message: '¿Deseas cancelar el registro? Los datos ingresados se perderán.',
      buttons: [
        { text: 'Quedarme', role: 'cancel' },
        {
          text: 'Sí, cancelar',
          role: 'destructive',
          handler: () => this.router.navigate(['/home']),
        },
      ],
    });
    await alert.present();
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═════════════════════════════════════════════════════════════════════════════

  campoInvalido(campo: string): boolean {
    const ctrl = this.form.get(campo);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  private async mostrarAlerta(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['Entendido'] });
    await alert.present();
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color, position: 'top' });
    await toast.present();
  }
}
