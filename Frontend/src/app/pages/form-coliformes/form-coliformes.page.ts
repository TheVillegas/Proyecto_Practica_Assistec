import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import {
  Subject,
  Subscription,
  forkJoin,
  of,
  switchMap,
  debounceTime,
  catchError,
  firstValueFrom,
} from 'rxjs';
import { CatalogosService } from '../../services/catalogos.service';
import { ColiformesApiService } from '../../services/coliformes-api.service';
import { EquipoIncubacion, Micropipeta, Responsable } from '../../interfaces/catalogo.interfaces';
import {
  ColiFormulario,
  ColiMuestra,
  SaveFase1Payload,
  SaveFase2Payload,
  SaveFase3Payload,
  SaveFase35Payload,
  SaveFase4Payload,
} from '../../interfaces/coliformes.interfaces';

export type ResultadoSubmuestra = 'positivo' | 'negativo' | 'sin_registrar';
export type Dilucion = string;
export type ControlPresencia = 'presencia' | 'ausencia' | 'sin_registrar';

export interface EntradaMuestra {
  id: string;
  esDuplicado: boolean;
  label: string;
  submuestras: Record<string, [ResultadoSubmuestra, ResultadoSubmuestra, ResultadoSubmuestra]>;
}

export interface BloqueTabla {
  fechaLectura: string;
  horaLectura: string;
  analistaResponsable: string;
  entradas: EntradaMuestra[];
}

export interface ResultadoMuestraFinal {
  id: string;
  label: string;
  ct: string;
  cf: string;
  ecoli: string;
}

const DILUCIONES_FALLBACK: string[] = ['1ml', '0.1ml', '0.01ml'];
const RESULTADO_DEFAULT: ResultadoSubmuestra = 'sin_registrar';

function crearEntradaDesdeMuestra(muestra: ColiMuestra, diluciones: string[]): EntradaMuestra {
  const submuestras: EntradaMuestra['submuestras'] = {};
  diluciones.forEach(d => {
    submuestras[d] = [RESULTADO_DEFAULT, RESULTADO_DEFAULT, RESULTADO_DEFAULT];
  });
  return {
    id: String(muestra.idColiMuestra),
    esDuplicado: muestra.esDuplicado,
    label: muestra.numeroMuestra,
    submuestras,
  };
}

function crearBloqueTabla(): BloqueTabla {
  return {
    fechaLectura: '',
    horaLectura: '',
    analistaResponsable: '',
    entradas: [],
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
  readonly TOTAL_ETAPAS = 5;
  etapaActual = 1;
  readonly NOMBRES_ETAPAS = [
    'Alimento e Incubación',
    'Detalles de Siembra',
    'Control de Análisis',
    'Control de Calidad',
    'Datos Finales',
  ];

  // ─── Formulario ──────────────────────────────────────────────────────────────
  idFormulario = 0;
  form!: FormGroup;
  muestras: ColiMuestra[] = [];

  // ─── Catálogos ─────────────────────────────────────────────────────────────────
  listaEquiposIncubacion: EquipoIncubacion[] = [];
  listaPipetas: Micropipeta[] = [];
  listaResponsables: Responsable[] = [];

  // ─── Etapa 3: tablas de lectura ───────────────────────────────────────────────
  tabla24h: BloqueTabla = crearBloqueTabla();
  tabla48h: BloqueTabla = crearBloqueTabla();
  DILUCIONES: string[] = [...DILUCIONES_FALLBACK];

  // ─── Errores de hora ──────────────────────────────────────────────────────────
  errorHora24h = '';
  errorHora48h = '';

  // ─── Etapa 4: controles de calidad por bloque ────────────────────────────────
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

  // ─── Etapa 5: tabla de resultados finales ─────────────────────────────────────
  resultadosFinales: ResultadoMuestraFinal[] = [];
  observacionesFinales = '';

  // ─── Auto-save ─────────────────────────────────────────────────────────────────
  private autoSaveSubject = new Subject<void>();
  private autoSaveSubscription?: Subscription;
  hasChanges = false;
  lastSaveTime: Date | null = null;
  lastSaveText = '';
  lastSaveError = false;
  private saveIndicatorInterval?: ReturnType<typeof setInterval>;

  // ─── Datos importados de solicitud ────────────────────────────────────────────
  datosImportados = {
    codigoAlimento: '',
    fechaIncubacion: '',
    horaIncubacion: '',
    analistaIncubacion: '',
  };

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
    this.setupAutoSave();
    this.startSaveIndicator();

    // Usar endpoint correcto según el tipo de ID recibido
    const vieneDeAliCard = !!this.route.snapshot.queryParamMap.get('analisis');
    const formulario$ = vieneDeAliCard
      ? this.coliService.obtenerPorAnalisis(this.idFormulario)
      : this.coliService.getFormulario(this.idFormulario);

    // LAB-65 CDS-01: catchError por catálogo individual para carga parcial
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
        this.actualizarDiluciones();
        this.cargarFormulario(res.formulario);
      },
      error: (err: { status?: number }) => {
        // LAB-65 CFI-01: No inicializar wizard si formulario no existe (404)
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
    this.autoSaveSubscription?.unsubscribe();
    if (this.saveIndicatorInterval) {
      clearInterval(this.saveIndicatorInterval);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      ct_analistaInicio: ['', Validators.required],
      ct_analistaTermino: ['', Validators.required],
      cf_analistaInicio: ['', Validators.required],
      cf_analistaTermino: ['', Validators.required],
      ec_analistaInicio: ['', Validators.required],
      ec_analistaTermino: ['', Validators.required],
      caldoLauril: ['', Validators.required],
      tween80: [''],
      estufas: [[] as number[], Validators.required],
      micropipeta1ml: [null as Micropipeta | null, Validators.required],
      micropipeta10ml: [null as Micropipeta | null, Validators.required],
      muestra10g90ml: [''],
      muestra50g450ml: [''],
    });

    this.form.valueChanges.subscribe(() => {
      this.hasChanges = true;
      this.autoSaveSubject.next();
    });
  }

  private setupAutoSave(): void {
    this.autoSaveSubscription = this.autoSaveSubject
      .pipe(
        debounceTime(30000),
        switchMap(() => {
          if (!this.hasChanges || this.idFormulario <= 0) {
            return of(undefined);
          }
          // LAB-65 DSI-02: indicador visual de error
          this.lastSaveError = false;
          return this.ejecutarGuardadoFaseActual(false).pipe(
            catchError(() => {
              this.lastSaveError = true;
              this.actualizarTextoGuardado();
              return of(undefined);
            })
          );
        })
      )
      .subscribe();
  }

  private startSaveIndicator(): void {
    this.saveIndicatorInterval = setInterval(() => this.actualizarTextoGuardado(), 1000);
  }

  private actualizarTextoGuardado(): void {
    // LAB-65 DSI-02: mostrar estado de error si auto-save falló
    if (this.lastSaveError) {
      this.lastSaveText = 'Guardado fallido — intente nuevamente';
      return;
    }
    if (!this.lastSaveTime) {
      this.lastSaveText = '';
      return;
    }
    const segundos = Math.floor((Date.now() - this.lastSaveTime.getTime()) / 1000);
    this.lastSaveText = `Guardado hace ${segundos} segundos`;
  }

  private cargarFormulario(formulario: ColiFormulario): void {
    this.etapaActual = formulario.faseActual || 1;
    this.muestras = formulario.muestras || [];

    if (this.muestras.length > 0) {
      this.tabla24h.entradas = this.muestras.map((m) => crearEntradaDesdeMuestra(m, this.DILUCIONES));
      this.tabla48h.entradas = this.muestras.map((m) => crearEntradaDesdeMuestra(m, this.DILUCIONES));
    }

    if (formulario.fase1) {
      this.form.patchValue({
        ct_analistaInicio: formulario.fase1.ctAnalistaInicio,
        ct_analistaTermino: formulario.fase1.ctAnalistaTermino,
        cf_analistaInicio: formulario.fase1.cfAnalistaInicio,
        cf_analistaTermino: formulario.fase1.cfAnalistaTermino,
        ec_analistaInicio: formulario.fase1.ecAnalistaInicio,
        ec_analistaTermino: formulario.fase1.ecAnalistaTermino,
      });
    }

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

    if (formulario.fase35Controles) {
      const c = formulario.fase35Controles;
      this.ct_controlKAerogenes = this.toControlPresencia(c.ctControlKAerogenes);
      this.ct_controlSAureus = this.toControlPresencia(c.ctControlSAureus);
      this.ct_controlEColi = this.toControlPresencia(c.ctControlEColi);
      this.ct_controlBlanco = c.ctControlBlanco;
      this.cf_controlEColi = this.toControlPresencia(c.cfControlEColi);
      this.cf_controlKAerogenes = this.toControlPresencia(c.cfControlKAerogenes);
      this.cf_controlBlanco = c.cfControlBlanco;
      this.ec_controlEColi = this.toControlPresencia(c.ecControlEColi);
      this.ec_controlKAerogenes = this.toControlPresencia(c.ecControlKAerogenes);
      this.ec_controlBlanco = c.ecControlBlanco;
    }

    if (formulario.fase4Resultado) {
      this.resultadosFinales = formulario.fase4Resultado.map((r) => ({
        id: String(r.idColiMuestra),
        label: this.obtenerLabelMuestra(r.idColiMuestra),
        ct: String(r.coliformesTotales),
        cf: String(r.coliformesFecales),
        ecoli: String(r.eColi),
      }));
    }

    this.hasChanges = false;
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

  private actualizarDiluciones(): void {
    const capacidades = [...new Set(
      this.listaPipetas
        .filter(p => /^\d+(\.\d+)?\s*ml$/i.test(p.capacidad))
        .map(p => p.capacidad.toLowerCase().replace(/\s+/g, ''))
    )];
    if (capacidades.length > 0) {
      capacidades.sort((a, b) => parseFloat(b) - parseFloat(a));
      this.DILUCIONES = capacidades;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // NAVEGACIÓN
  // ══════════════════════════════════════════════════════════════════════════════
  get progresoPorcentaje(): number {
    return Math.round(((this.etapaActual - 1) / (this.TOTAL_ETAPAS - 1)) * 100);
  }

  async avanzarEtapa(): Promise<void> {
    if (!this.validarEtapaActual()) return;
    const exito = await this.guardarFaseActual(true);
    if (exito && this.etapaActual < this.TOTAL_ETAPAS) {
      this.etapaActual++;
    }
  }

  retrocederEtapa(): void {
    if (this.etapaActual > 1) this.etapaActual--;
  }

  irAEtapa(n: number): void {
    if (n > this.etapaActual) {
      if (!this.validarEtapaActual()) return;
      if (n > this.etapaActual + 1) {
        this.mostrarToast('Debe avanzar paso a paso.', 'warning');
        return;
      }
    }
    if (n >= 1 && n <= this.TOTAL_ETAPAS) this.etapaActual = n;
  }

  private validarEtapaActual(): boolean {
    let valido = true;

    if (this.etapaActual === 1) {
      const camposEtapa1 = [
        'ct_analistaInicio', 'ct_analistaTermino',
        'cf_analistaInicio', 'cf_analistaTermino',
        'ec_analistaInicio', 'ec_analistaTermino',
      ];

      camposEtapa1.forEach((c) => {
        const ctrl = this.form.get(c);
        ctrl?.markAsTouched();
        if (ctrl?.invalid) valido = false;
      });

      if (!valido) {
        this.mostrarToast('Complete los campos obligatorios con el formato correcto.', 'warning');
        return false;
      }
    }

    if (this.etapaActual === 2) {
      const camposEtapa2 = ['caldoLauril', 'estufas', 'micropipeta1ml', 'micropipeta10ml'];
      camposEtapa2.forEach((c) => {
        const ctrl = this.form.get(c);
        ctrl?.markAsTouched();
        if (ctrl?.invalid) valido = false;
      });

      if (!valido) {
        this.mostrarToast('Debe completar el Caldo Lauril, la Estufa y seleccionar una micropipeta de cada tipo.', 'warning');
      }
    }

    if (this.etapaActual === 3) {
      if (!this.tabla24h.fechaLectura || !this.tabla24h.horaLectura || !this.tabla24h.analistaResponsable) {
        this.mostrarToast('Debe ingresar los datos generales de la lectura de 24 horas.', 'warning');
        return false;
      }
      if (!this.tabla48h.fechaLectura || !this.tabla48h.horaLectura || !this.tabla48h.analistaResponsable) {
        this.mostrarToast('Debe ingresar los datos generales de la lectura de 48 horas.', 'warning');
        return false;
      }

      const err24 = this.validarRangoHora(this.tabla24h.horaLectura, this.datosImportados.horaIncubacion);
      const err48 = this.validarRangoHora(this.tabla48h.horaLectura, this.datosImportados.horaIncubacion);
      this.errorHora24h = err24;
      this.errorHora48h = err48;

      if (err24 || err48) {
        this.mostrarToast('Corrija los errores de horario de lectura.', 'danger');
        return false;
      }

      let submuestrasIncompletas = false;
      const verificarSubmuestras = (tabla: BloqueTabla) => {
        tabla.entradas.forEach((ent) => {
          this.DILUCIONES.forEach((dil) => {
            ent.submuestras[dil].forEach((res) => {
              if (res === 'sin_registrar') submuestrasIncompletas = true;
            });
          });
        });
      };

      verificarSubmuestras(this.tabla24h);
      verificarSubmuestras(this.tabla48h);

      if (submuestrasIncompletas) {
        this.mostrarToast('Debe registrar los resultados de todas las submuestras para 24h y 48h.', 'warning');
        return false;
      }
    }

    if (this.etapaActual === 4) {
      const ctIncompleto =
        this.ct_controlKAerogenes === 'sin_registrar' ||
        this.ct_controlSAureus === 'sin_registrar' ||
        !this.ct_controlBlanco.trim();

      const cfIncompleto =
        this.cf_controlEColi === 'sin_registrar' ||
        this.cf_controlKAerogenes === 'sin_registrar' ||
        !this.cf_controlBlanco.trim();

      const ecIncompleto =
        this.ec_controlEColi === 'sin_registrar' ||
        this.ec_controlKAerogenes === 'sin_registrar' ||
        !this.ec_controlBlanco.trim();

      if (ctIncompleto || cfIncompleto || ecIncompleto) {
        valido = false;
        this.mostrarToast('Complete todos los controles de calidad de los 3 bloques.', 'warning');
      }
    }

    return valido;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // TABLA DE SUBMUESTRAS
  // ══════════════════════════════════════════════════════════════════════════════
  ciclarResultado(entrada: EntradaMuestra, dilucion: string, idx: number): void {
    const orden: ResultadoSubmuestra[] = ['sin_registrar', 'positivo', 'negativo'];
    const actual = entrada.submuestras[dilucion][idx];
    const siguiente = orden[(orden.indexOf(actual) + 1) % orden.length];
    entrada.submuestras[dilucion][idx] = siguiente;
    this.hasChanges = true;
    this.autoSaveSubject.next();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // VALIDACIÓN HORA ±2 HORAS
  // ══════════════════════════════════════════════════════════════════════════════
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
    this.errorHora24h = this.validarRangoHora(this.tabla24h.horaLectura, this.datosImportados.horaIncubacion);
  }

  onHora48hChange(): void {
    this.errorHora48h = this.validarRangoHora(this.tabla48h.horaLectura, this.datosImportados.horaIncubacion);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // GUARDADO
  // ══════════════════════════════════════════════════════════════════════════════
  private async guardarFaseActual(completada: boolean): Promise<boolean> {
    try {
      await firstValueFrom(this.ejecutarGuardadoFase(this.etapaActual, completada));
      return true;
    } catch (err: unknown) {
      const httpErr = err as { status?: number };
      if (httpErr.status === 409) {
        await this.mostrarAlerta(
          'Conflicto de concurrencia',
          'El formulario fue modificado por otro usuario. Recargue y vuelva a intentar.'
        );
      } else {
        this.mostrarToast('Error al guardar. Intente nuevamente.', 'danger');
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
        const payload: SaveFase1Payload = {
          ctAnalistaInicio: this.form.value.ct_analistaInicio,
          ctAnalistaTermino: this.form.value.ct_analistaTermino,
          cfAnalistaInicio: this.form.value.cf_analistaInicio,
          cfAnalistaTermino: this.form.value.cf_analistaTermino,
          ecAnalistaInicio: this.form.value.ec_analistaInicio,
          ecAnalistaTermino: this.form.value.ec_analistaTermino,
          completada,
        };
        return this.coliService.saveFase1(this.idFormulario, payload).pipe(
          switchMap(() => {
            this.hasChanges = false;
            this.lastSaveError = false;
            this.lastSaveTime = new Date();
            this.actualizarTextoGuardado();
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
        return this.coliService.saveFase2(this.idFormulario, payload).pipe(
          switchMap(() => {
            this.hasChanges = false;
            this.lastSaveError = false;
            this.lastSaveTime = new Date();
            this.actualizarTextoGuardado();
            return of(undefined);
          })
        );
      }
      case 3: {
        const payload: SaveFase3Payload = {
          submuestras: [
            ...this.coliService.mapSubmuestrasToPayload(this.tabla24h, 24, this.DILUCIONES),
            ...this.coliService.mapSubmuestrasToPayload(this.tabla48h, 48, this.DILUCIONES),
          ],
          completada,
        };
        return this.coliService.saveFase3(this.idFormulario, payload).pipe(
          switchMap(() => {
            this.hasChanges = false;
            this.lastSaveError = false;
            this.lastSaveTime = new Date();
            this.actualizarTextoGuardado();
            return of(undefined);
          })
        );
      }
      case 4: {
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
        return this.coliService.saveFase35(this.idFormulario, payload).pipe(
          switchMap(() => {
            this.hasChanges = false;
            this.lastSaveError = false;
            this.lastSaveTime = new Date();
            this.actualizarTextoGuardado();
            return of(undefined);
          })
        );
      }
      case 5: {
        const payload: SaveFase4Payload = {
          submuestras: [
            ...this.coliService.mapSubmuestrasToPayload(this.tabla24h, 24, this.DILUCIONES),
            ...this.coliService.mapSubmuestrasToPayload(this.tabla48h, 48, this.DILUCIONES),
          ],
          completada,
        };
        return this.coliService.saveFase4(this.idFormulario, payload).pipe(
          switchMap((res) => {
            this.hasChanges = false;
            this.lastSaveError = false;
            this.lastSaveTime = new Date();
            this.actualizarTextoGuardado();
            if (res.fase4Resultado) {
              this.resultadosFinales = res.fase4Resultado.map((r) => ({
                id: String(r.idColiMuestra),
                label: this.obtenerLabelMuestra(r.idColiMuestra),
                ct: String(r.coliformesTotales),
                cf: String(r.coliformesFecales),
                ecoli: String(r.eColi),
              }));
            }
            return of(undefined);
          })
        );
      }
      default:
        return of(undefined);
    }
  }

  async guardarBorrador(): Promise<void> {
    const exito = await this.guardarBorradorCompleto();
    if (exito) {
      this.mostrarToast('Borrador completo guardado', 'success');
    }
  }

  private async guardarBorradorCompleto(): Promise<boolean> {
    try {
      for (let fase = 1; fase <= this.etapaActual; fase++) {
        await firstValueFrom(this.ejecutarGuardadoFase(fase, false));
      }
      return true;
    } catch (err: unknown) {
      const httpErr = err as { status?: number };
      if (httpErr.status === 409) {
        await this.mostrarAlerta(
          'Conflicto de concurrencia',
          'El formulario fue modificado por otro usuario. Recargue y vuelva a intentar.'
        );
      } else {
        this.mostrarToast('Error al guardar el borrador completo.', 'danger');
      }
      return false;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // NMP / CÁLCULO
  // ══════════════════════════════════════════════════════════════════════════════
  async calcularNMP(): Promise<void> {
    if (this.etapaActual !== 5) return;
    const exito = await this.guardarFaseActual(true);
    if (exito) {
      this.mostrarToast('Resultados NMP calculados correctamente.', 'success');
    }
  }

  get puedeCalcularNMP(): boolean {
    let completas = true;
    const verificar = (tabla: BloqueTabla) => {
      tabla.entradas.forEach((ent) => {
        this.DILUCIONES.forEach((dil) => {
          ent.submuestras[dil].forEach((res) => {
            if (res === 'sin_registrar') completas = false;
          });
        });
      });
    };
    verificar(this.tabla24h);
    verificar(this.tabla48h);
    return completas;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ENVÍO Y CANCELACIÓN
  // ══════════════════════════════════════════════════════════════════════════════
  async enviarFormulario(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      await this.mostrarAlerta('Campos incompletos', 'Existen campos obligatorios sin completar. Revise cada etapa.');
      return;
    }

    if (this.resultadosFinales.length === 0) {
      await this.mostrarAlerta('Resultados Incompletos', 'Por favor calcule los resultados NMP antes de enviar.');
      return;
    }

    const exito = await this.guardarFaseActual(true);
    if (exito) {
      await this.mostrarAlerta('Éxito', 'Registro de análisis enviado correctamente.');
      this.router.navigate(['/home']);
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

  // ══════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════════
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
