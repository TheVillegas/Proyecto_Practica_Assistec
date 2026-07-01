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
import { MediosCultivosService, MedioCultivo } from '../../services/medios-cultivos.service';
import { EquipoIncubacion, Micropipeta, Responsable } from '../../interfaces/catalogo.interfaces';
import {
  CalcularNmpPayload,
  ColiFormulario,
  ColiMuestra,
  ColiFase4CalidadManual,
  ColiOrganismoResultado,
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
  private mediosCultivosService = inject(MediosCultivosService);

  // ─── Wizard ──────────────────────────────────────────────────────────────────
  readonly TOTAL_ETAPAS = 4;
  etapaActual = 1;
  readonly NOMBRES_ETAPAS = [
    'Incubación',
    'Siembra',
    'Lecturas',
    'Controles',
  ];

  // ─── Formulario ──────────────────────────────────────────────────────────────
  idFormulario = 0;
  formularioUpdatedAt = '';
  form!: FormGroup;
  muestras: ColiMuestra[] = [];
  /** Entradas por muestra para las tarjetas de la etapa 3 */
  entradasMuestra: EntradaMuestra[] = [];

  // ─── Catálogos ──────────────────────────────────────────────────────────────
  listaEquiposIncubacion: EquipoIncubacion[] = [];
  listaPipetas: Micropipeta[] = [];
  listaResponsables: Responsable[] = [];
  listaMediosCaldoLauril: MedioCultivo[] = [];
  listaMediosTween80: MedioCultivo[] = [];

  // ─── Diluciones fijas ────────────────────────────────────────────────────────
  readonly DILUCIONES: string[] = [...DILUCIONES_FIJAS];

  // ─── Etapa 1: análisis activos ───────────────────────────────────────────────
  ctActivo = true;
  cfActivo = true;
  ecActivo = true;

  // ─── Datos de lectura (compartidos entre todas las muestras) ─────────────────
  fechaLectura24h = '';
  horaLectura24h = '';
  analista24h = '';
  fechaLectura48h = '';
  horaLectura48h = '';
  analista48h = '';
  errorHora24h = '';
  errorHora48h = '';

  // ─── Etapa 2: validación homogeneizado → siembra (≤30 min) ─────────────────
  errorHomogSiembra = '';

  // ─── Etapa 4: controles de calidad (24h) ────────────────────────────────────
  ct_controlKAerogenes24h: ControlPresencia = 'sin_registrar';
  ct_controlSAureus24h: ControlPresencia = 'sin_registrar';
  ct_controlEColi: ControlPresencia = 'sin_registrar';
  ct_controlBlanco24h = '';

  cf_controlEColi24h: ControlPresencia = 'sin_registrar';
  cf_controlKAerogenes24h: ControlPresencia = 'sin_registrar';
  cf_controlBlanco24h = '';

  ec_controlEColi24h: ControlPresencia = 'sin_registrar';
  ec_controlKAerogenes24h: ControlPresencia = 'sin_registrar';
  ec_controlBlanco24h = '';

  // ─── Etapa 4: controles de calidad (48h) ────────────────────────────────────
  ct_controlKAerogenes48h: ControlPresencia = 'sin_registrar';
  ct_controlSAureus48h: ControlPresencia = 'sin_registrar';
  ct_controlBlanco48h = '';

  cf_controlEColi48h: ControlPresencia = 'sin_registrar';
  cf_controlKAerogenes48h: ControlPresencia = 'sin_registrar';
  cf_controlBlanco48h = '';

  ec_controlEColi48h: ControlPresencia = 'sin_registrar';
  ec_controlKAerogenes48h: ControlPresencia = 'sin_registrar';
  ec_controlBlanco48h = '';

  // ─── Etapa 4: Manual de Inocuidad ───────────────────────────────────────────
  fase4Calidad: ColiFase4CalidadManual = {
    duplicadoAli: null,
    duplicadoAliCumple: null,
    controlBlancoAliCumple: null,
    desfavorable: false,
    desfavorableTabla: '',
    desfavorableLimite: null as unknown as number,
    desfavorableFechaEntrega: '',
  };

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
      medios: this.mediosCultivosService.getAll().pipe(
        catchError(() => {
          console.warn('[Coli] Catálogo medios_cultivos no disponible');
          return of([] as MedioCultivo[]);
        })
      ),
      formulario: formulario$,
    }).subscribe({
      next: (res) => {
        this.listaEquiposIncubacion = res.equipos;
        this.listaPipetas = res.pipetas;
        this.listaResponsables = res.responsables;
        this.listaMediosCaldoLauril = res.medios;
        this.listaMediosTween80 = res.medios;
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
      // Etapa 1 — CT
      ct_analistaInicio: [''],
      ct_fechaInicio: [''],
      ct_horaInicio: [''],
      ct_analistaTermino: [''],
      ct_fechaTermino: [''],
      ct_horaTermino: [''],
      // Etapa 1 — CF
      cf_analistaInicio: [''],
      cf_fechaInicio: [''],
      cf_horaInicio: [''],
      cf_analistaTermino: [''],
      cf_fechaTermino: [''],
      cf_horaTermino: [''],
      // Etapa 1 — EC
      ec_analistaInicio: [''],
      ec_fechaInicio: [''],
      ec_horaInicio: [''],
      ec_analistaTermino: [''],
      ec_fechaTermino: [''],
      ec_horaTermino: [''],
      // Etapa 2 — medios (IDs)
      idMedioCaldoLauril: [null as number | null],
      idMedioTween80: [null as number | null],
      estufas: [[] as number[]],
      micropipeta1ml: [null as Micropipeta | null],
      micropipeta10ml: [null as Micropipeta | null],
      // Etapa 2 — homogeneizado / siembra
      fechaHomog: [null as string | null],
      horaHomog: [null as string | null],
      rutAnalistaHomog: [null as string | null],
      fechaSiembra: [null as string | null],
      horaSiembra: [null as string | null],
      rutAnalistaSiembra: [null as string | null],
      nMuestra10g90ml: [null as number | null],
      nMuestra50g450ml: [null as number | null],
    });
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // CARGA DE FORMULARIO
  // ═════════════════════════════════════════════════════════════════════════════

  private cargarFormulario(formulario: ColiFormulario): void {
    this.idFormulario = formulario.idColiFormulario;
    this.formularioUpdatedAt = formulario.updatedAt || '';
    this.etapaActual = formulario.faseActual || 1;
    this.muestras = formulario.muestras || [];

    // Inicializar entradas por muestra (M1 + duplicado siempre presentes)
    if (this.muestras.length > 0) {
      this.entradasMuestra = this.muestras.map((m) => crearEntradaDesdeMuestra(m));
    } else {
      // Sin muestras del backend: crear M1 y su duplicado locales
      this.localIdCounter--;
      const m1: EntradaMuestra = {
        id: String(this.localIdCounter),
        esDuplicado: false,
        label: '1',
        submuestras24h: crearSubmuestrasDefault(),
        submuestras48h: crearSubmuestrasDefault(),
      };
      this.localIdCounter--;
      const dup: EntradaMuestra = {
        id: String(this.localIdCounter),
        esDuplicado: true,
        label: '1 Dup',
        submuestras24h: crearSubmuestrasDefault(),
        submuestras48h: crearSubmuestrasDefault(),
      };
      this.entradasMuestra = [m1, dup];
    }

    // Cargar fase 1
    if (formulario.fase1) {
      const f1 = formulario.fase1 as unknown as Record<string, string>;
      this.form.patchValue({
        ct_analistaInicio: f1['ct_rutAnalistaInicio'] ?? f1['rutAnalistaInicio'] ?? '',
        ct_analistaTermino: f1['ct_rutAnalistaTermino'] ?? f1['rutAnalistaTermino'] ?? '',
        cf_analistaInicio: f1['cf_rutAnalistaInicio'] ?? f1['rutAnalistaInicio'] ?? '',
        cf_analistaTermino: f1['cf_rutAnalistaTermino'] ?? f1['rutAnalistaTermino'] ?? '',
        ec_analistaInicio: f1['ec_rutAnalistaInicio'] ?? f1['rutAnalistaInicio'] ?? '',
        ec_analistaTermino: f1['ec_rutAnalistaTermino'] ?? f1['rutAnalistaTermino'] ?? '',
      });
    }

    // Cargar fase 2
    if (formulario.fase2) {
      const f2 = formulario.fase2;
      const normCap = (c: string) => c.replace(/\s+/g, '').toLowerCase();
      const splitFechaHora = (iso?: string): [string | null, string | null] => {
        if (!iso) return [null, null];
        const [fecha, hora] = iso.split('T');
        return [fecha ?? null, hora ? hora.slice(0, 5) : null];
      };
      const [fechaHomog, horaHomog] = splitFechaHora(f2.fechaHomog);
      const [fechaSiembra, horaSiembra] = splitFechaHora(f2.fechaSiembra);
      this.form.patchValue({
        idMedioCaldoLauril: (f2 as unknown as Record<string, number>)['idMedioCaldoLauril'] ?? null,
        idMedioTween80: (f2 as unknown as Record<string, number>)['idMedioTween80'] ?? null,
        estufas: f2.estufas.map((e) => e.idIncubacion),
        micropipeta1ml: this.listaPipetas.find(p =>
          f2.micropipetas.some(mp => mp.idPipeta === p.idPipeta && normCap(mp.capacidad) === '1ml')
        ) || null,
        micropipeta10ml: this.listaPipetas.find(p =>
          f2.micropipetas.some(mp => mp.idPipeta === p.idPipeta && normCap(mp.capacidad) === '10ml')
        ) || null,
        fechaHomog,
        horaHomog,
        rutAnalistaHomog: f2.rutAnalistaHomog ?? null,
        fechaSiembra,
        horaSiembra,
        rutAnalistaSiembra: f2.rutAnalistaSiembra ?? null,
        nMuestra10g90ml: f2.nMuestra10g90ml ?? null,
        nMuestra50g450ml: f2.nMuestra50g450ml ?? null,
      });
    }

    // Cargar fase 3 (submuestras)
    if (formulario.fase3 && formulario.fase3.submuestras) {
      for (const sub of formulario.fase3.submuestras) {
        const entrada = this.entradasMuestra.find(e => Number(e.id) === sub.idColiMuestra);
        if (!entrada) continue;
        if (sub.tipoLectura === 'ecoli') continue;
        const target = sub.tipoLectura === 'fecales' ? entrada.submuestras48h : entrada.submuestras24h;
        if (target[sub.dilucion]) {
          target[sub.dilucion][sub.numeroTubo - 1] = sub.presencia === null
            ? 'sin_registrar'
            : sub.presencia ? 'positivo' : 'negativo';
        }
      }
    }

    // Cargar fase 3.5 (controles) — ahora en Etapa 4
    if (formulario.fase35Controles) {
      const c = formulario.fase35Controles as unknown as Record<string, string>;
      this.ct_controlKAerogenes24h = this.toControlPresencia(c['ctrlTotKAerogenes24h'] ?? c['ctControlKAerogenes24h']);
      this.ct_controlKAerogenes48h = this.toControlPresencia(c['ctrlTotKAerogenes48h'] ?? c['ctControlKAerogenes48h']);
      this.ct_controlSAureus24h = this.toControlPresencia(c['ctrlTotSAureus24h'] ?? c['ctControlSAureus24h']);
      this.ct_controlSAureus48h = this.toControlPresencia(c['ctrlTotSAureus48h'] ?? c['ctControlSAureus48h']);
      this.ct_controlEColi = this.toControlPresencia(c['ctControlEColi']);
      this.ct_controlBlanco24h = c['blancoTotales24h'] ?? c['ctControlBlanco24h'] ?? '';
      this.ct_controlBlanco48h = c['blancoTotales48h'] ?? c['ctControlBlanco48h'] ?? '';
      this.cf_controlEColi24h = this.toControlPresencia(c['ctrlFecEColi24h'] ?? c['cfControlEColi24h']);
      this.cf_controlEColi48h = this.toControlPresencia(c['ctrlFecEColi48h'] ?? c['cfControlEColi48h']);
      this.cf_controlKAerogenes24h = this.toControlPresencia(c['ctrlFecKAerogenes24h'] ?? c['cfControlKAerogenes24h']);
      this.cf_controlKAerogenes48h = this.toControlPresencia(c['ctrlFecKAerogenes48h'] ?? c['cfControlKAerogenes48h']);
      this.cf_controlBlanco24h = c['blancoFecales24h'] ?? c['cfControlBlanco24h'] ?? '';
      this.cf_controlBlanco48h = c['blancoFecales48h'] ?? c['cfControlBlanco48h'] ?? '';
      this.ec_controlEColi24h = this.toControlPresencia(c['ctrlEcoEColi24h'] ?? c['ecControlEColi24h']);
      this.ec_controlEColi48h = this.toControlPresencia(c['ctrlEcoEColi48h'] ?? c['ecControlEColi48h']);
      this.ec_controlKAerogenes24h = this.toControlPresencia(c['ctrlEcoKAerogenes24h'] ?? c['ecControlKAerogenes24h']);
      this.ec_controlKAerogenes48h = this.toControlPresencia(c['ctrlEcoKAerogenes48h'] ?? c['ecControlKAerogenes48h']);
      this.ec_controlBlanco24h = c['blancoEcoli24h'] ?? c['ecControlBlanco24h'] ?? '';
      this.ec_controlBlanco48h = c['blancoEcoli48h'] ?? c['ecControlBlanco48h'] ?? '';
    }

    // Cargar fase 4 (resultados NMP) — ahora en Etapa 5
    if (formulario.fase4Resultado && formulario.fase4Resultado.length > 0) {
      this.nmpCalculado = true;
      for (const r of formulario.fase4Resultado) {
        const entrada = this.entradasMuestra.find(e => Number(e.id) === r.idColiMuestra);
        if (entrada) {
          entrada.resultados = {
            ct: this.formatearResultadoNmp(r.coliformesTotales, r.totales),
            cf: this.formatearResultadoNmp(r.coliformesFecales, r.fecales),
            ecoli: 'Pendiente confirmación',
          };
        }
      }
    }
  }

  private formatearResultadoNmp(mpn: number | null, detalle?: ColiOrganismoResultado): string {
    if (mpn !== null && mpn !== undefined) return String(mpn);
    if (detalle?.estado === 'mayor_que' && detalle.limiteInferior != null) {
      return `> ${detalle.limiteInferior}`;
    }
    return 'Sin resultado válido';
  }

  private toControlPresencia(valor: string): ControlPresencia {
    if (valor === 'presencia') return 'presencia';
    if (valor === 'ausencia') return 'ausencia';
    return 'sin_registrar';
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

  async guardarFormularioBorrador(): Promise<void> {
    const exito = await this.guardarBorradorCompleto();
    if (exito) {
      this.mostrarToast('Borrador guardado correctamente', 'success');
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // ANÁLISIS TOGGLE (Etapa 1)
  // ═════════════════════════════════════════════════════════════════════════════

  get algunAnalisisActivo(): boolean {
    return this.ctActivo || this.cfActivo || this.ecActivo;
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
  // MUESTRAS (Etapa 3)
  // ═════════════════════════════════════════════════════════════════════════════

  /** M1 y su duplicado son fijos (índices 0 y 1 si el duplicado existe) */
  esMuestraFija(entrada: EntradaMuestra): boolean {
    const idx = this.entradasMuestra.indexOf(entrada);
    return idx === 0 || (idx === 1 && entrada.esDuplicado);
  }

  agregarMuestra(): void {
    this.localIdCounter--;
    const count = this.entradasMuestra.filter(e => !e.esDuplicado).length + 1;
    const nueva: EntradaMuestra = {
      id: String(this.localIdCounter),
      esDuplicado: false,
      label: `${count}`,
      submuestras24h: crearSubmuestrasDefault(),
      submuestras48h: crearSubmuestrasDefault(),
    };
    this.entradasMuestra.push(nueva);
  }

  eliminarMuestra(entrada: EntradaMuestra): void {
    if (this.esMuestraFija(entrada)) return;
    const idx = this.entradasMuestra.indexOf(entrada);
    if (idx !== -1) {
      this.entradasMuestra.splice(idx, 1);
    }
  }

  async calcularNmpPorMuestra(entrada: EntradaMuestra): Promise<void> {
    this.calculando = true;
    try {
      const res = await firstValueFrom(
        this.coliService.calcularNmp(this.idFormulario, this.buildCalculoNmpPayloadParaEntrada(entrada))
      );

      if (res.fase4Resultado && res.fase4Resultado.length > 0) {
        const r = res.fase4Resultado[0];
        entrada.resultados = {
          ct: this.formatearResultadoNmp(r.coliformesTotales, r.totales),
          cf: this.formatearResultadoNmp(r.coliformesFecales, r.fecales),
          ecoli: 'Pendiente confirmación',
        };
        this.nmpCalculado = true;
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
  // VALIDACIÓN HOMOGENEIZADO → SIEMBRA (≤30 MINUTOS)
  // ═════════════════════════════════════════════════════════════════════════════

  private validarHomogSiembra(horaHomog: string, horaSiembra: string): string {
    if (!horaHomog || !horaSiembra) return '';
    const parseHora = (h: string): number => {
      if (!h || typeof h !== 'string' || !h.includes(':')) return 0;
      const parts = h.split(':');
      if (parts.length < 2) return 0;
      const hh = Number(parts[0]) || 0;
      const mm = Number(parts[1]) || 0;
      return hh * 60 + mm;
    };
    const minutos = parseHora(horaSiembra);
    const base = parseHora(horaHomog);
    if (Math.abs(minutos - base) > 30) {
      return 'El tiempo entre homogeneizado y siembra debe ser menor a 30 minutos.';
    }
    return '';
  }

  onHomogChange(): void {
    const v = this.form.value;
    this.errorHomogSiembra = this.validarHomogSiembra(v.horaHomog, v.horaSiembra);
  }

  onSiembraChange(): void {
    const v = this.form.value;
    this.errorHomogSiembra = this.validarHomogSiembra(v.horaHomog, v.horaSiembra);
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
        // Wizard Etapa 1 → backend fase 1
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
        // Wizard Etapa 2 → backend fase 2
        const pip1 = this.form.value.micropipeta1ml as Micropipeta | null;
        const pip10 = this.form.value.micropipeta10ml as Micropipeta | null;
        const v2 = this.form.value;
        const payload: SaveFase2Payload = {
          idMedioCaldoLauril: this.form.value.idMedioCaldoLauril,
          idMedioTween80: this.form.value.idMedioTween80 ?? undefined,
          estufas: (this.form.value.estufas as number[]).map((id: number) => ({ idIncubacion: id })),
          micropipetas: [
            ...(pip1 ? [{ idPipeta: pip1.idPipeta, capacidad: pip1.capacidad }] : []),
            ...(pip10 ? [{ idPipeta: pip10.idPipeta, capacidad: pip10.capacidad }] : []),
          ],
          fechaHomog: v2.fechaHomog && v2.horaHomog
            ? `${v2.fechaHomog}T${v2.horaHomog}:00`
            : undefined,
          rutAnalistaHomog: v2.rutAnalistaHomog || undefined,
          fechaSiembra: v2.fechaSiembra && v2.horaSiembra
            ? `${v2.fechaSiembra}T${v2.horaSiembra}:00`
            : undefined,
          rutAnalistaSiembra: v2.rutAnalistaSiembra || undefined,
          nMuestra10g90ml: v2.nMuestra10g90ml ?? undefined,
          nMuestra50g450ml: v2.nMuestra50g450ml ?? undefined,
          completada,
        };
        return this.coliService.saveFase2(this.idFormulario, payload, this.formularioUpdatedAt).pipe(
          switchMap((res) => {
            this.formularioUpdatedAt = res.updatedAt;
            return of(undefined);
          })
        );
      }
      case 3: {
        // Wizard Etapa 3 → backend fase 3 (submuestras / lecturas)
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
      case 4: {
        // Wizard Etapa 4 → backend fase 3.5 (controles de calidad)
        const payload: SaveFase35Payload = {
          controles: {
            ctControlKAerogenes24h: this.ct_controlKAerogenes24h,
            ctControlKAerogenes48h: this.ct_controlKAerogenes48h,
            ctControlSAureus24h: this.ct_controlSAureus24h,
            ctControlSAureus48h: this.ct_controlSAureus48h,
            ctControlEColi: this.ct_controlEColi,
            ctControlBlanco24h: this.ct_controlBlanco24h,
            ctControlBlanco48h: this.ct_controlBlanco48h,
            cfControlEColi24h: this.cf_controlEColi24h,
            cfControlEColi48h: this.cf_controlEColi48h,
            cfControlKAerogenes24h: this.cf_controlKAerogenes24h,
            cfControlKAerogenes48h: this.cf_controlKAerogenes48h,
            cfControlBlanco24h: this.cf_controlBlanco24h,
            cfControlBlanco48h: this.cf_controlBlanco48h,
            ecControlEColi24h: this.ec_controlEColi24h,
            ecControlEColi48h: this.ec_controlEColi48h,
            ecControlKAerogenes24h: this.ec_controlKAerogenes24h,
            ecControlKAerogenes48h: this.ec_controlKAerogenes48h,
            ecControlBlanco24h: this.ec_controlBlanco24h,
            ecControlBlanco48h: this.ec_controlBlanco48h,
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
      case 5: {
        // Wizard Etapa 5 → backend fase 4 (resultados NMP) — TBD, no-op for now
        return of(undefined);
      }
      default:
        return of(undefined);
    }
  }

  private buildSubmuestrasPayload(): Array<{
    idColiMuestra: number;
    tipoLectura: 'totales' | 'fecales' | 'ecoli';
    dilucion: string;
    numeroTubo: number;
    presencia: boolean | null;
  }> {
    const result: Array<{
      idColiMuestra: number;
      tipoLectura: 'totales' | 'fecales' | 'ecoli';
      dilucion: string;
      numeroTubo: number;
      presencia: boolean | null;
    }> = [];

    const push = (
      entrada: EntradaMuestra,
      submuestras: EntradaMuestra['submuestras24h'],
      tipoLectura: 'totales' | 'fecales' | 'ecoli'
    ): void => {
      for (const dil of this.DILUCIONES) {
        submuestras[dil].forEach((valor, idx) => {
          result.push({
            idColiMuestra: Number(entrada.id),
            tipoLectura,
            dilucion: dil,
            numeroTubo: idx + 1,
            presencia: valor === 'sin_registrar' ? null : valor === 'positivo',
          });
        });
      }
    };

    for (const entrada of this.entradasMuestra) {
      push(entrada, entrada.submuestras24h, 'totales');
      push(entrada, entrada.submuestras48h, 'fecales');
    }

    return result;
  }

  private submuestrasALecturas(
    submuestras: EntradaMuestra['submuestras24h']
  ): boolean[][] {
    return this.DILUCIONES.map((dil) =>
      submuestras[dil].map((valor) => valor === 'positivo')
    );
  }

  private buildCalculoNmpPayloadParaEntrada(entrada: EntradaMuestra): CalcularNmpPayload {
    return {
      muestras: [{
        idColiMuestra: Number(entrada.id),
        lecturas: {
          totales: this.submuestrasALecturas(entrada.submuestras24h),
          fecales: this.submuestrasALecturas(entrada.submuestras48h),
        },
      }],
    };
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
