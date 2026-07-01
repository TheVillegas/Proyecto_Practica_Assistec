import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { firstValueFrom, forkJoin } from 'rxjs';
import { EnterobacteriasApiService } from '../../services/enterobacterias-api.service';
import { AuthService } from '../../services/auth-service';
import { CatalogosService } from '../../services/catalogos.service';
import { MediosCultivosService, MedioCultivo } from '../../services/medios-cultivos.service';
import {
  EntControlCalidadAli,
  EntDilucionLectura,
  EntEtapa1Payload,
  EntEtapa2Payload,
  EntEtapa3Payload,
  EntEtapa3ResultadoPayload,
  EntEtapaPayload,
  EntFormularioCompleto,
  EntMuestraLectura,
  EntResultadoCalculo,
} from '../../interfaces/enterobacterias.interfaces';
import { crearMuestraVacia } from './components/ent-analisis-lectura.component';
import {
  EquipoIncubacion,
  Micropipeta,
  Responsable,
} from '../../interfaces/catalogo.interfaces';

interface PesadoFormValue {
  codigoALI?: string;
  nActa?: string;
  tipoMuestra?: string;
  nMuestra10g90ml?: number | string | null;
  nMuestra50g450ml?: number | string | null;
  fechaInicio?: string;
  horaInicio?: string;
  analistaInicio?: string;
}

interface HomogeneizacionFormValue {
  fechaHomog?: string;
  horaHomog?: string;
  analistaHomog?: string;
}

interface SembradoFormValue {
  agarVRBGSembrado?: number | string | null;
  tween80Medio?: number | string | null;
  estufaSembrado?: number | string | null;
  placasSembrado?: number | string | null;
  micropipeta1mlSembrado?: number | string | null;
  fechaSembrado?: string;
  horaSembrado?: string;
  analistaSembrado?: string;
}

interface IncubacionPrepFormValue {
  estufaIncub?: number | string | null;
  fechaTermino?: string;
  horaTermino?: string;
  analistaIncub?: string;
}

interface AnalisisLecturaFormValue {
  fechaLectura24h?: string;
  horaLectura24h?: string;
  analistaLectura24h?: string;
  equipoCuentaColonias?: number | string | null;
}

interface TraspasoConfFormValue {
  fechaTraspaso?: string;
  horaTraspaso?: string;
  analistaTraspaso?: string;
  agarNutritivo?: string;
  estufaConfIncub?: number | string | null;
}

interface ConfirmacionFormValue {
  fechaLectConf?: string;
  horaLectConf?: string;
  analistaLectConf?: string;
  muestraPlaca1?: number | string | null;
  muestraPlaca2?: number | string | null;
  duplicadoPlaca1?: number | string | null;
  duplicadoPlaca2?: number | string | null;
  fechaOxidasa?: string;
  horaOxidasa?: string;
  analistaOxidasa?: string;
  reactivoOxidasa?: string;
  desaireadoAgarGlucosa?: string;
  agarGlucosa?: string;
  controlPosEcoli?: string;
  controlNegPaer?: string;
  blanco?: string;
}

interface CierreFormValue {
  desfavorable?: string;
  tablaPagina?: string;
  limite?: string;
  fechaHoraEntrega?: string;
  observaciones?: string;
}

interface ResultadoGrupoFormValue {
  muestraB?: number | string | null;
  muestraA?: number | string | null;
  d?: number | string | null;
  n1?: number | string | null;
  n2?: number | string | null;
  m?: number | string | null;
  sumaA?: number | string | null;
}

interface LegacyLecturaFields {
  n_muestra_lectura?: number;
  dilucion?: number;
  colonias_contadas?: number;
}

@Component({
  selector: 'app-form-enterobacterias',
  templateUrl: './form-enterobacterias.page.html',
  styleUrls: ['./form-enterobacterias.page.scss'],
  standalone: false,
})
export class FormEnterobacteriasPage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private apiService = inject(EnterobacteriasApiService);
  private authService = inject(AuthService);
  private catalogosService = inject(CatalogosService);
  private mediosCultivosService = inject(MediosCultivosService);

  readonly TOTAL_ETAPAS = 6;
  readonly NOMBRES_ETAPAS = [
    'Pesado y Homogeneización',
    'Siembra e Incubación',
    'Controles ALI + Lectura 24h',
    'Confirmación Bioquímica',
    'Cálculo Final',
    'Manual de Inocuidad',
  ];

  idFormulario = 0;
  etapaActual = signal<number>(1);
  form!: FormGroup;
  formularioCompletado = false;
  updatedAt = '';
  cargando = signal(true);

  muestrasLectura: EntMuestraLectura[] = [
    crearMuestraVacia('M1'),
    crearMuestraVacia('Duplicado'),
  ];

  listaMediosCultivos: MedioCultivo[] = [];

  private resultadosGroupsMap = new Map<string, FormGroup>();

  get pesadoGroup(): FormGroup { return this.form.get('pesado') as FormGroup; }
  get homogeneizacionGroup(): FormGroup { return this.form.get('homogeneizacion') as FormGroup; }
  get sembradoGroup(): FormGroup { return this.form.get('sembrado') as FormGroup; }
  get incubacionPrepGroup(): FormGroup { return this.form.get('incubacionPrep') as FormGroup; }
  get analisisLecturaGroup(): FormGroup { return this.form.get('analisisLectura') as FormGroup; }
  get controlCalidadAliGroup(): FormGroup { return this.form.get('controlCalidadAli') as FormGroup; }
  get traspasoConfGroup(): FormGroup { return this.form.get('traspasoConf') as FormGroup; }
  get confirmacionGroup(): FormGroup { return this.form.get('confirmacion') as FormGroup; }
  get cierreGroup(): FormGroup { return this.form.get('cierre') as FormGroup; }

  catalogos = {
    equiposIncubacion: signal<EquipoIncubacion[]>([]),
    responsables: signal<Responsable[]>([]),
    micropipetas: signal<Micropipeta[]>([]),
  };

  get tiempoHomoSiembraInfo(): { minutos: number; valido: boolean } | null {
    const horaHomog = this.form.get('homogeneizacion.horaHomog')?.value as string;
    const horaSembrado = this.form.get('sembrado.horaSembrado')?.value as string;
    if (!horaHomog || !horaSembrado) return null;
    const [hH, mH] = horaHomog.split(':').map(Number);
    const [hS, mS] = horaSembrado.split(':').map(Number);
    const diff = (hS * 60 + mS) - (hH * 60 + mH);
    if (diff < 0) return null;
    return { minutos: diff, valido: diff < 20 };
  }

  ngOnInit(): void {
    const idParam = this.route.parent?.snapshot.paramMap.get('id')
      || this.route.snapshot.paramMap.get('id');
    this.idFormulario = idParam ? Number(idParam) : 0;
    this.inicializarFormulario();

    if (this.idFormulario <= 0) {
      this.cargando.set(false);
      return;
    }

    forkJoin({
      formularioResp: this.apiService.obtenerPorAnalisis(this.idFormulario),
      equiposIncubacion: this.catalogosService.getEquiposIncubacion(),
      responsables: this.catalogosService.getResponsables('analista'),
      micropipetas: this.catalogosService.getMicroPipetas(),
      mediosCultivos: this.mediosCultivosService.getAll(),
    }).subscribe({
      next: (res) => {
        this.catalogos.equiposIncubacion.set(res.equiposIncubacion);
        this.catalogos.responsables.set(res.responsables);
        this.catalogos.micropipetas.set(res.micropipetas);
        this.listaMediosCultivos = res.mediosCultivos;
        if (res.formularioResp.existe && res.formularioResp.formulario) {
          this.idFormulario = Number(res.formularioResp.formulario.idEntFormulario) || this.idFormulario;
          this.cargarFormulario(res.formularioResp.formulario);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.mostrarToast('Error al cargar datos del formulario.', 'danger');
      },
    });
  }

  private inicializarFormulario(): void {
    this.form = this.fb.group({
      pesado: this.fb.group({
        tipoMuestra: [''],
        nMuestra10g90ml: [null, [Validators.min(0)]],
        nMuestra50g450ml: [null, [Validators.min(0)]],
        fechaInicio: [''],
        horaInicio: [''],
        analistaInicio: [''],
      }),
      homogeneizacion: this.fb.group({
        fechaHomog: [''],
        horaHomog: [''],
        analistaHomog: [''],
      }),
      sembrado: this.fb.group({
        agarVRBGSembrado: [''],
        tween80Medio: [''],
        estufaSembrado: [null],
        placasSembrado: [null],
        micropipeta1mlSembrado: [null],
        fechaSembrado: [''],
        horaSembrado: [''],
        analistaSembrado: [''],
      }),
      incubacionPrep: this.fb.group({
        agarVRBGIncub: [''],
        estufaIncub: [null],
        fechaTermino: [''],
        horaTermino: [''],
        analistaIncub: [''],
      }),
      analisisLectura: this.fb.group({
        fechaLectura24h: [''],
        horaLectura24h: [''],
        analistaLectura24h: [''],
        equipoCuentaColonias: [''],
      }),
      controlCalidadAli: this.fb.group({
        duplicadoAli: [''],
        controlPositivoBlancoAli: [''],
        controlSiembraAli: [''],
      }),
      traspasoConf: this.fb.group({
        fechaTraspaso: [''],
        horaTraspaso: [''],
        analistaTraspaso: [''],
        agarNutritivo: [''],
        estufaConfIncub: [null],
      }),
      confirmacion: this.fb.group({
        fechaLectConf: [''],
        horaLectConf: [''],
        analistaLectConf: [''],
        muestraPlaca1: [null],
        muestraPlaca2: [null],
        duplicadoPlaca1: [null],
        duplicadoPlaca2: [null],
        fechaOxidasa: [''],
        horaOxidasa: [''],
        analistaOxidasa: [''],
        reactivoOxidasa: [''],
        desaireadoAgarGlucosa: [''],
        agarGlucosa: [''],
        controlPosEcoli: [''],
        controlNegPaer: [''],
        blanco: [''],
      }),
      cierre: this.fb.group({
        desfavorable: [''],
        tablaPagina: [''],
        limite: [''],
        fechaHoraEntrega: [''],
        observaciones: [''],
      }),
    });
  }

  private cargarFormulario(formulario: EntFormularioCompleto): void {
    this.updatedAt = formulario.updatedAt ?? '';

    const e1 = formulario.etapa1;
    if (e1) {
      this.form.get('pesado')?.patchValue({
        tipoMuestra: e1.tipoMuestra,
        nMuestra10g90ml: e1.nMuestra10g90ml,
        nMuestra50g450ml: e1.nMuestra50g450ml,
        fechaInicio: e1.fechaInicio,
        horaInicio: e1.horaInicio,
        analistaInicio: e1.rutAnalistaInicio,
      });
      this.form.get('homogeneizacion')?.patchValue({
        fechaHomog: e1.fechaHomog,
        horaHomog: e1.horaHomog,
        analistaHomog: e1.rutAnalistaHomog,
      });
      this.form.get('sembrado')?.patchValue({
        agarVRBGSembrado: e1.idMedioAgarVrbg ? String(e1.idMedioAgarVrbg) : '',
        tween80Medio: e1.idMedioTween80 ? String(e1.idMedioTween80) : '',
        estufaSembrado: e1.idEstufaSembrado,
        placasSembrado: e1.placasSembrado,
        micropipeta1mlSembrado: e1.idMicropipeta,
        fechaSembrado: e1.fechaSembrado,
        horaSembrado: e1.horaSembrado,
        analistaSembrado: e1.rutAnalistaSembrado,
      });
      this.form.get('incubacionPrep')?.patchValue({
        estufaIncub: e1.idEstufaIncub,
        fechaTermino: e1.fechaFinIncubacion ? e1.fechaFinIncubacion.split('T')[0] : '',
        horaTermino: e1.fechaFinIncubacion ? e1.fechaFinIncubacion.split('T')[1]?.substring(0, 5) : '',
        analistaIncub: e1.rutAnalistaIncub,
      });
    }

    const e2 = formulario.etapa2;
    if (e2) {
      this.form.get('analisisLectura')?.patchValue({
        fechaLectura24h: e2.fechaLectura24h ? e2.fechaLectura24h.split('T')[0] : '',
        horaLectura24h: e2.horaLectura24h,
        analistaLectura24h: e2.rutAnalistaLectura,
        equipoCuentaColonias: e2.idEquipoCuentaColonias ? String(e2.idEquipoCuentaColonias) : '',
      });
      this.form.get('controlCalidadAli')?.patchValue({
        duplicadoAli: e2.duplicadoAli ?? '',
        controlPositivoBlancoAli: e2.controlPositivoBlancoAli ?? '',
        controlSiembraAli: e2.controlSiembraAli ?? '',
      });
      if (e2.lecturaMuestras?.length) {
        this.muestrasLectura = e2.lecturaMuestras;
      }
    }

    const e3 = formulario.etapa3;
    if (e3) {
      this.form.get('traspasoConf')?.patchValue({
        fechaTraspaso: e3.fechaTraspaso ? e3.fechaTraspaso.split('T')[0] : '',
        horaTraspaso: e3.horaTraspaso,
        analistaTraspaso: e3.rutAnalistaTraspaso,
        agarNutritivo: e3.idAgarNutritivo ?? '',
        estufaConfIncub: e3.idEstufaConf,
      });
      this.form.get('confirmacion')?.patchValue({
        fechaLectConf: e3.fechaLectConf ? e3.fechaLectConf.split('T')[0] : '',
        horaLectConf: e3.horaLectConf,
        analistaLectConf: e3.rutAnalistaLectConf,
        fechaOxidasa: e3.fechaOxidasa ? e3.fechaOxidasa.split('T')[0] : '',
        horaOxidasa: e3.horaOxidasa,
        analistaOxidasa: e3.rutAnalistaOxidasa,
        reactivoOxidasa: e3.reactivoOxidasa ?? '',
        desaireadoAgarGlucosa: e3.desaireadoAgarGlucosa ?? '',
        agarGlucosa: e3.agarGlucosa ?? '',
        controlPosEcoli: e3.controlPosEcoli ?? '',
        controlNegPaer: e3.controlNegPaer ?? '',
        blanco: e3.blanco ?? '',
      });
      this.form.get('cierre')?.patchValue({
        desfavorable: e3.desfavorable === true ? 'si' : e3.desfavorable === false ? 'no' : '',
        tablaPagina: e3.tablaPagina ?? '',
        limite: e3.limite ?? '',
        fechaHoraEntrega: e3.fechaHoraEntrega ?? '',
        observaciones: e3.observaciones ?? '',
      });
    }

    this.enlazarMuestrasConBackend(formulario);
    this.etapaActual.set(this.uiEtapaFromFormulario(formulario));
  }

  private enlazarMuestrasConBackend(formulario: EntFormularioCompleto): void {
    const backendMuestras = formulario.muestras ?? [];
    this.muestrasLectura = this.muestrasLectura.map((m, i) => ({
      ...m,
      idEntMuestra: backendMuestras[i]?.idEntMuestra ?? m.idEntMuestra,
    }));

    backendMuestras.forEach((bm, i) => {
      const uiMuestra = this.muestrasLectura[i];
      if (!uiMuestra || !bm.resultado) return;

      const group = this.getResultadosGroup(uiMuestra);
      group.patchValue({
        muestraB: bm.resultado.muestraB ?? null,
        muestraA: bm.resultado.muestraA ?? null,
        d: bm.resultado.d ?? null,
        n1: bm.resultado.n1 ?? null,
        n2: bm.resultado.n2 ?? null,
        m: bm.resultado.m ?? null,
        sumaA: bm.resultado.sumaA ?? null,
      }, { emitEvent: false });

      uiMuestra.resultado = {
        nEnterobacterias: bm.resultado.nEnterobacterias ?? null,
        ufcPorG: bm.resultado.ufcPorG ?? null,
        casoAplicado: bm.resultado.casoAplicado ?? '',
        operador: (bm.resultado.operador as '=' | '<' | '>') ?? '=',
        esEstimado: bm.resultado.esEstimado ?? false,
        incongruenciaDetectada: bm.resultado.incongruenciaDetectada ?? false,
        observacionIncongruencia: bm.resultado.observacionIncongruencia ?? null,
        esSd: bm.resultado.esSd,
        sumaA: bm.resultado.sumaA,
        n1: bm.resultado.n1,
        n2: bm.resultado.n2,
        d: bm.resultado.d,
      };
    });
  }

  private uiEtapaFromFormulario(formulario: EntFormularioCompleto): number {
    const e1 = formulario.etapa1;
    const e2 = formulario.etapa2;
    const e3 = formulario.etapa3;
    if (!e1) return 1;
    if (!e1.completada) return 2;
    if (!e2 || !e2.completada) return 3;
    if (!e3 || !e3.completada) return 4;
    return this.TOTAL_ETAPAS;
  }

  get progresoPorcentaje(): number {
    return Math.round(((this.etapaActual() - 1) / (this.TOTAL_ETAPAS - 1)) * 100);
  }

  get rol(): number {
    return this.authService.getUsuario()?.primaryRole ?? 0;
  }

  get modoLectura(): boolean {
    return ![0, 4].includes(this.rol);
  }

  get muestrasConResultado(): EntMuestraLectura[] {
    return this.muestrasLectura.filter(m => m.resultado !== undefined);
  }

  getResultadosGroup(muestra: EntMuestraLectura): FormGroup {
    let group = this.resultadosGroupsMap.get(muestra.label);
    if (!group) {
      group = this.fb.group({
        muestraB: [null],
        muestraA: [null],
        d: [null],
        n1: [null],
        n2: [null],
        m: [null],
        sumaA: [null],
      });
      this.resultadosGroupsMap.set(muestra.label, group);
    }
    return group;
  }

  onMuestrasChange(muestras: EntMuestraLectura[]): void {
    this.muestrasLectura = muestras;
  }

  onResultadoCalculado(evento: { muestra: EntMuestraLectura; resultado: EntResultadoCalculo }): void {
    const group = this.getResultadosGroup(evento.muestra);
    const detalleBase = evento.resultado.detalle?.[0];
    group.patchValue({
      muestraB: detalleBase?.b ?? group.value.muestraB,
      muestraA: detalleBase?.A ?? group.value.muestraA,
      d: evento.resultado.d ?? group.value.d,
      n1: evento.resultado.n1 ?? group.value.n1,
      n2: evento.resultado.n2 ?? group.value.n2,
      sumaA: evento.resultado.sumaA ?? group.value.sumaA,
    }, { emitEvent: false });
  }

  onSiguiente(): void {
    if (this.etapaActual() < this.TOTAL_ETAPAS) {
      this.etapaActual.update(e => e + 1);
    }
  }

  onAnterior(): void {
    if (this.etapaActual() > 1) this.etapaActual.update(e => e - 1);
  }

  async finalizarFormulario(): Promise<void> {
    if (!await this.validarFinalizacion()) return;

    let ok = await this.guardarEtapa(1, true);
    if (!ok) return;
    ok = await this.guardarEtapa(2, true);
    if (!ok) return;
    ok = await this.guardarEtapa(3, true);
    if (ok) {
      this.formularioCompletado = true;
      this.mostrarToast('Registro de análisis completado correctamente.', 'success');
    }
  }

  async guardarFormularioBorrador(): Promise<void> {
    if (this.modoLectura) return;
    const ui = this.etapaActual();
    let ok = await this.guardarEtapa(1, ui > 2);
    if (!ok) return;
    if (ui >= 3) {
      ok = await this.guardarEtapa(2, ui > 3);
      if (!ok) return;
    }
    if (ui >= 4) {
      ok = await this.guardarEtapa(3, false);
      if (!ok) return;
    }
    this.mostrarToast('Borrador guardado correctamente.', 'success');
  }

  private async guardarEtapa(etapa: 1 | 2 | 3, completada: boolean): Promise<boolean> {
    try {
      const payload = this.construirPayloadEtapa(etapa, completada);
      const respuesta = await firstValueFrom(
        this.apiService.guardarEtapa(this.idFormulario, etapa, payload, this.updatedAt)
      );
      this.updatedAt = respuesta.updatedAt;
      return true;
    } catch (err: unknown) {
      const httpErr = err as { status?: number; error?: { codigo?: string; detalles?: { horas_restantes?: number } } };
      if (httpErr.status === 409) {
        await this.mostrarAlerta('Conflicto de concurrencia', 'El formulario fue modificado por otro usuario. Recargue y vuelva a intentar.');
      } else if (httpErr.status === 422 && httpErr.error?.codigo === 'INCUBATION_LOCKOUT') {
        const horas = httpErr.error.detalles?.horas_restantes ?? 0;
        await this.mostrarAlerta('Bloqueo de incubación', `Deben transcurrir 24 horas. Faltan aproximadamente ${horas} horas.`);
      } else {
        this.mostrarToast('Error al guardar. Intente nuevamente.', 'danger');
      }
      return false;
    }
  }

  private construirPayloadEtapa(etapa: 1 | 2 | 3, completada: boolean): EntEtapaPayload {
    switch (etapa) {
      case 1: return { completada, etapa: this.construirPayloadEtapa1() };
      case 2: return { completada, etapa: this.construirPayloadEtapa2() };
      case 3: return { completada, etapa: this.construirPayloadEtapa3() };
    }
  }

  private construirPayloadEtapa1(): EntEtapa1Payload {
    const pesado = this.groupValue<PesadoFormValue>('pesado');
    const homogeneizacion = this.groupValue<HomogeneizacionFormValue>('homogeneizacion');
    const sembrado = this.groupValue<SembradoFormValue>('sembrado');
    const incubacion = this.groupValue<IncubacionPrepFormValue>('incubacionPrep');
    const fechaInicioIncubacion = this.toIsoDateTime(sembrado.fechaSembrado, sembrado.horaSembrado);
    const fechaFinIncubacion = this.toIsoDateTime(incubacion.fechaTermino, incubacion.horaTermino);

    return this.omitirVacios({
      codigo_ali: pesado.codigoALI,
      n_acta: pesado.nActa,
      tipo_muestra: pesado.tipoMuestra,
      n_muestra_10g_90ml: this.toNumberOrUndefined(pesado.nMuestra10g90ml),
      n_muestra_50g_450ml: this.toNumberOrUndefined(pesado.nMuestra50g450ml),
      fecha_inicio: pesado.fechaInicio,
      hora_inicio: pesado.horaInicio,
      rut_analista_inicio: pesado.analistaInicio,
      fecha_homog: homogeneizacion.fechaHomog,
      hora_homog: homogeneizacion.horaHomog,
      rut_analista_homog: homogeneizacion.analistaHomog,
      id_medio_agar_vrbg: this.toNumberOrUndefined(sembrado.agarVRBGSembrado),
      id_medio_tween_80: this.toNumberOrUndefined(sembrado.tween80Medio),
      id_estufa_sembrado: this.toNumberOrUndefined(sembrado.estufaSembrado),
      placas_sembrado: this.toNumberOrUndefined(sembrado.placasSembrado),
      id_micropipeta: this.toNumberOrUndefined(sembrado.micropipeta1mlSembrado),
      fecha_sembrado: sembrado.fechaSembrado,
      hora_sembrado: sembrado.horaSembrado,
      rut_analista_sembrado: sembrado.analistaSembrado,
      id_estufa_incub: this.toNumberOrUndefined(incubacion.estufaIncub),
      fecha_inicio_incubacion: fechaInicioIncubacion,
      fecha_fin_incubacion: fechaFinIncubacion,
      rut_analista_incub: incubacion.analistaIncub,
    });
  }

  private construirPayloadEtapa2(): EntEtapa2Payload {
    const lectura = this.groupValue<AnalisisLecturaFormValue>('analisisLectura');
    const controlCalidad = this.construirControlCalidadAli();

    return this.omitirVacios({
      fecha_lectura_24h: this.toIsoDateTime(lectura.fechaLectura24h, lectura.horaLectura24h),
      hora_lectura_24h: lectura.horaLectura24h,
      rut_analista_lectura: lectura.analistaLectura24h,
      id_equipo_cuenta_colonias: this.toNumberOrUndefined(lectura.equipoCuentaColonias),
      ...this.resolverCamposLecturaLegacy(),
      lecturaMuestras: this.muestrasLectura,
      control_calidad: Object.keys(controlCalidad).length > 0 ? controlCalidad : undefined,
    });
  }

  private construirPayloadEtapa3(): EntEtapa3Payload {
    const traspaso = this.groupValue<TraspasoConfFormValue>('traspasoConf');
    const confirmacion = this.groupValue<ConfirmacionFormValue>('confirmacion');
    const cierre = this.groupValue<CierreFormValue>('cierre');

    return this.omitirVacios({
      control_pos_ecoli: confirmacion.controlPosEcoli,
      control_neg_paer: confirmacion.controlNegPaer,
      blanco: confirmacion.blanco,
      desfavorable: cierre.desfavorable === 'si' ? true : cierre.desfavorable === 'no' ? false : undefined,
      tabla_pagina: cierre.tablaPagina,
      limite: cierre.limite,
      fecha_hora_entrega: cierre.fechaHoraEntrega || undefined,
      observaciones: cierre.observaciones,
      fechaTraspaso: traspaso.fechaTraspaso,
      horaTraspaso: traspaso.horaTraspaso,
      rutAnalistaTraspaso: traspaso.analistaTraspaso,
      idEstufaConf: this.toNumberOrUndefined(traspaso.estufaConfIncub),
      fechaLectConf: confirmacion.fechaLectConf,
      horaLectConf: confirmacion.horaLectConf,
      rutAnalistaLectConf: confirmacion.analistaLectConf,
      fechaOxidasa: confirmacion.fechaOxidasa,
      horaOxidasa: confirmacion.horaOxidasa,
      rutAnalistaOxidasa: confirmacion.analistaOxidasa,
      reactivoOxidasa: confirmacion.reactivoOxidasa,
      desaireadoAgarGlucosa: confirmacion.desaireadoAgarGlucosa,
      agarGlucosa: confirmacion.agarGlucosa,
      resultados: this.construirResultadosPayload(),
    });
  }

  private construirResultadosPayload(): EntEtapa3ResultadoPayload[] {
    const resultados: EntEtapa3ResultadoPayload[] = [];

    for (const muestra of this.muestrasLectura) {
      if (muestra.idEntMuestra === undefined || muestra.idEntMuestra === null) continue;

      const group = this.resultadosGroupsMap.get(muestra.label);
      const gv = group ? this.gruposValue(group) : {};
      if (!muestra.resultado && !group) continue;

      resultados.push({
        idEntMuestra: muestra.idEntMuestra,
        muestraB: this.toNumberOrUndefined(gv.muestraB),
        muestraA: this.toNumberOrUndefined(gv.muestraA),
        d: this.toNumberOrUndefined(gv.d),
        n1: this.toNumberOrUndefined(gv.n1),
        n2: this.toNumberOrUndefined(gv.n2),
        m: this.toNumberOrUndefined(gv.m),
        sumaA: this.toNumberOrUndefined(gv.sumaA),
        nEnterobacterias: muestra.resultado?.nEnterobacterias ?? undefined,
        ufcPorG: muestra.resultado?.ufcPorG ?? undefined,
        operador: muestra.resultado?.operador,
        esEstimado: muestra.resultado?.esEstimado,
        esSd: muestra.resultado?.esSd,
        casoAplicado: muestra.resultado?.casoAplicado,
        incongruenciaDetectada: muestra.resultado?.incongruenciaDetectada,
        observacionIncongruencia: muestra.resultado?.observacionIncongruencia ?? undefined,
      });
    }

    return resultados;
  }

  private gruposValue(group: FormGroup): ResultadoGrupoFormValue {
    return group.getRawValue() as ResultadoGrupoFormValue;
  }

  private construirControlCalidadAli(): EntControlCalidadAli {
    const control = this.groupValue<EntControlCalidadAli>('controlCalidadAli');
    return this.omitirVacios({
      duplicadoAli: control.duplicadoAli,
      controlPositivoBlancoAli: control.controlPositivoBlancoAli,
      controlSiembraAli: control.controlSiembraAli,
    });
  }

  private resolverCamposLecturaLegacy(): LegacyLecturaFields {
    const primeraDilucion = this.primeraDilucionConColonias();
    if (!primeraDilucion) return {};
    const coloniasA = primeraDilucion.coloniasA ?? 0;
    const coloniasB = primeraDilucion.coloniasB ?? 0;
    return this.omitirVacios({
      n_muestra_lectura: 1,
      dilucion: Math.pow(10, primeraDilucion.exponent),
      colonias_contadas: coloniasA + coloniasB,
    });
  }

  private async validarFinalizacion(): Promise<boolean> {
    if (this.muestrasConResultado.length === 0) {
      await this.mostrarAlerta('Lectura incompleta', 'Debe calcular al menos una muestra antes de finalizar el registro.');
      return false;
    }
    return true;
  }

  private groupValue<T>(groupName: string): T {
    return (this.form.get(groupName)?.getRawValue() ?? {}) as T;
  }

  private toNumberOrUndefined(value: number | string | null | undefined): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private toIsoDateTime(date?: string, time?: string): string | undefined {
    if (!date) return undefined;
    const resolvedTime = time || '00:00';
    return new Date(`${date}T${resolvedTime}:00`).toISOString();
  }

  private numeroMuestraDesdeEtiqueta(label: string): number {
    const match = label.match(/\d+/);
    return match ? Number(match[0]) : 1;
  }

  private primeraDilucionConColonias(): EntDilucionLectura | undefined {
    for (const muestra of this.muestrasLectura) {
      const dilucion = muestra.diluciones.find((d) => d.coloniasA !== null || d.coloniasB !== null);
      if (dilucion) return dilucion;
    }
    return undefined;
  }

  private omitirVacios<T extends object>(payload: T): T {
    const limpio: Partial<T> = {};
    for (const key of Object.keys(payload) as Array<keyof T>) {
      const value = payload[key];
      if (value !== undefined && value !== null && value !== '') {
        limpio[key] = value;
      }
    }
    return limpio as T;
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

  campoInvalido(grupo: string, nombre: string): boolean {
    const ctrl = this.form.get(`${grupo}.${nombre}`);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  hoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  private async mostrarAlerta(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['Entendido'] });
    await alert.present();
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 3500, color, position: 'top' });
    await toast.present();
  }
}
