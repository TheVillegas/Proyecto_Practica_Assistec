import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { firstValueFrom, forkJoin } from 'rxjs';
import { EnterobacteriasApiService } from '../../services/enterobacterias-api.service';
import { AuthService } from '../../services/auth-service';
import { CatalogosService } from '../../services/catalogos.service';
import {
  EntControlCalidadAli,
  EntControlConfirmacion,
  EntDilucionLectura,
  EntEtapa1Payload,
  EntEtapa2Payload,
  EntEtapa3Payload,
  EntEtapaPayload,
  EntFormularioCompleto,
  EntMuestraLectura,
} from '../../interfaces/enterobacterias.interfaces';
import { crearMuestraVacia } from './components/ent-analisis-lectura.component';
import {
  EquipoIncubacion,
  Micropipeta,
  Responsable,
  LoteReactivo
} from '../../interfaces/catalogo.interfaces';

function reactivoOxidasaValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const patron = /^R69-(\d{2})-(0[12])$/;
  if (!patron.test(control.value)) {
    return {
      reactivoInvalido: 'El formato del Reactivo de Oxidasa debe ser R69-AA-NN donde AA es el año en 2 dígitos y NN es 01 o 02. Ejemplo: R69-25-01.'
    };
  }
  return null;
}

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

interface ControlCalidadFormValue extends EntControlCalidadAli, EntControlConfirmacion {}

interface IncubacionConfFormValue {
  fechaTraspaso?: string;
  horaTraspaso?: string;
  analistaTraspaso?: string;
  agarNutritivo?: number | string | null;
  estufaConfIncub?: number | string | null;
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

  readonly TOTAL_ETAPAS = 5;
  readonly NOMBRES_ETAPAS = [
    'Pesado y Siembra',
    'Incubación',
    'Control de Calidad',
    'Lectura 24h',
    'Traspaso / Confirmación',
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

  get pesadoGroup(): FormGroup { return this.form.get('pesado') as FormGroup; }
  get homogeneizacionGroup(): FormGroup { return this.form.get('homogeneizacion') as FormGroup; }
  get sembradoGroup(): FormGroup { return this.form.get('sembrado') as FormGroup; }
  get incubacionPrepGroup(): FormGroup { return this.form.get('incubacionPrep') as FormGroup; }
  get controlCalidadGroup(): FormGroup { return this.form.get('controlCalidad') as FormGroup; }
  get analisisLecturaGroup(): FormGroup { return this.form.get('analisisLectura') as FormGroup; }
  get incubacionConfGroup(): FormGroup { return this.form.get('incubacionConf') as FormGroup; }

  catalogos = {
    equiposIncubacion: signal<EquipoIncubacion[]>([]),
    responsables: signal<Responsable[]>([]),
    micropipetas: signal<Micropipeta[]>([]),
    lotesAgarVRBG: signal<LoteReactivo[]>([]),
    lotesTween80: signal<LoteReactivo[]>([]),
  };

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
      lotesAgarVRBG: this.catalogosService.getLotesReactivo('agar_vrbg'),
      lotesTween80: this.catalogosService.getLotesReactivo('tween_80'),
    }).subscribe({
      next: (res) => {
        this.catalogos.equiposIncubacion.set(res.equiposIncubacion);
        this.catalogos.responsables.set(res.responsables);
        this.catalogos.micropipetas.set(res.micropipetas);
        this.catalogos.lotesAgarVRBG.set(res.lotesAgarVRBG);
        this.catalogos.lotesTween80.set(res.lotesTween80);
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
      controlCalidad: this.fb.group({
        duplicadoAli: [''],
        controlPositivoBlancoAli: [''],
        controlSiembraAli: [''],
        controlPosEcoli: [''],
        controlNegPaer: [''],
        blanco: [''],
        desfavorable: [''],
        tablaPagina: [''],
        limite: [''],
        fechaHoraEntrega: [''],
        observaciones: [''],
      }),
      incubacionConf: this.fb.group({
        fechaTraspaso: [''],
        horaTraspaso: [''],
        analistaTraspaso: [''],
        agarNutritivo: [''],
        estufaConfIncub: [null],
      }),
    });
  }

  private cargarFormulario(formulario: EntFormularioCompleto): void {
    this.updatedAt = formulario.updatedAt ?? '';
    this.etapaActual.set(this.uiEtapaFromFormulario(formulario));

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
        agarVRBGSembrado: e1.idLoteAgarVrbgSembrado ? String(e1.idLoteAgarVrbgSembrado) : '',
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
      this.form.get('controlCalidad')?.patchValue({
        duplicadoAli: e2.duplicadoAli ?? '',
        controlPositivoBlancoAli: e2.controlPositivoBlancoAli ?? '',
        controlSiembraAli: e2.controlSiembraAli ?? '',
        desfavorable: e2.desfavorable ?? '',
        tablaPagina: e2.tablaPagina ?? '',
        limite: e2.limite ?? '',
        fechaHoraEntrega: e2.fechaHoraEntrega ?? '',
      });
      if (e2.muestras?.length) {
        this.muestrasLectura = e2.muestras;
      }
    }

    const e3 = formulario.etapa3;
    if (e3) {
      this.form.get('incubacionConf')?.patchValue({
        fechaTraspaso: e3.fechaTraspaso,
        horaTraspaso: e3.horaTraspaso,
        analistaTraspaso: e3.rutAnalistaTraspaso,
        agarNutritivo: e3.idAgarNutritivo ? String(e3.idAgarNutritivo) : '',
        estufaConfIncub: e3.idEstufaConf,
      });
      // Controls and observaciones were previously stored in e3; keep loading them for backwards compatibility.
      this.form.get('controlCalidad')?.patchValue({
        controlPosEcoli: e3.controlPosEcoli ?? '',
        controlNegPaer: e3.controlNegPaer ?? '',
        blanco: e3.blanco ?? '',
        duplicadoAli: e3.duplicadoAli ?? this.form.get('controlCalidad.duplicadoAli')?.value ?? '',
        controlPositivoBlancoAli: e3.controlPositivoBlancoAli ?? this.form.get('controlCalidad.controlPositivoBlancoAli')?.value ?? '',
        controlSiembraAli: e3.controlSiembraAli ?? this.form.get('controlCalidad.controlSiembraAli')?.value ?? '',
        desfavorable: e3.desfavorable ?? this.form.get('controlCalidad.desfavorable')?.value ?? '',
        tablaPagina: e3.tablaPagina ?? this.form.get('controlCalidad.tablaPagina')?.value ?? '',
        limite: e3.limite ?? this.form.get('controlCalidad.limite')?.value ?? '',
        fechaHoraEntrega: e3.fechaHoraEntrega ?? this.form.get('controlCalidad.fechaHoraEntrega')?.value ?? '',
        observaciones: e3.observaciones ?? '',
      });
    }
  }

  private uiEtapaFromFormulario(formulario: EntFormularioCompleto): number {
    const e1 = formulario.etapa1;
    const e2 = formulario.etapa2;
    const e3 = formulario.etapa3;
    if (!e1) return 1;
    if (!e1.completada) return 2;
    if (!e2) return 3;
    if (!e2.completada) return this.tieneControlCalidad(e2) ? 4 : 3;
    if (!e3 || !e3.completada) return 5;
    return 5;
  }

  private tieneControlCalidad(etapa: EntFormularioCompleto['etapa2']): boolean {
    if (!etapa) return false;
    return Boolean(
      etapa.duplicadoAli
      || etapa.controlPositivoBlancoAli
      || etapa.controlSiembraAli
      || etapa.desfavorable
      || etapa.tablaPagina
      || etapa.limite
      || etapa.fechaHoraEntrega
    );
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

    // Save all API etapas in order so completada flags are correct
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
    // Mark prior API etapas as completed so backend stage-progression check passes
    let ok = await this.guardarEtapa(1, ui > 2);
    if (!ok) return;
    if (ui >= 3) {
      ok = await this.guardarEtapa(2, ui > 4);
      if (!ok) return;
    }
    if (ui >= 5) {
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
      case 1:
        return { completada, etapa: this.construirPayloadEtapa1() };
      case 2:
        return { completada, etapa: this.construirPayloadEtapa2() };
      case 3:
        return { completada, etapa: this.construirPayloadEtapa3() };
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
      id_lote_agar_vrbg_sembrado: this.toNumberOrUndefined(sembrado.agarVRBGSembrado),
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
      muestras: this.muestrasLectura,
      control_calidad: Object.keys(controlCalidad).length > 0 ? controlCalidad : undefined,
    });
  }

  private construirPayloadEtapa3(): EntEtapa3Payload {
    const incubacionConf = this.groupValue<IncubacionConfFormValue>('incubacionConf');
    const controles = this.construirControlConfirmacion();

    return this.omitirVacios({
      fecha_traspaso: incubacionConf.fechaTraspaso,
      hora_traspaso: incubacionConf.horaTraspaso,
      rut_analista_traspaso: incubacionConf.analistaTraspaso,
      id_agar_nutritivo: this.toNumberOrUndefined(incubacionConf.agarNutritivo),
      id_estufa_conf: this.toNumberOrUndefined(incubacionConf.estufaConfIncub),
      control_pos_ecoli: controles.controlPosEcoli,
      control_neg_paer: controles.controlNegPaer,
      blanco: controles.blanco,
      observaciones: controles.observaciones,
    });
  }

  private construirControlCalidadAli(): EntControlCalidadAli {
    const control = this.groupValue<ControlCalidadFormValue>('controlCalidad');
    return this.omitirVacios({
      duplicadoAli: control.duplicadoAli,
      controlPositivoBlancoAli: control.controlPositivoBlancoAli,
      controlSiembraAli: control.controlSiembraAli,
      desfavorable: control.desfavorable,
      tablaPagina: control.tablaPagina,
      limite: control.limite,
      fechaHoraEntrega: control.fechaHoraEntrega,
    });
  }

  private construirControlConfirmacion(): EntControlConfirmacion {
    const control = this.groupValue<ControlCalidadFormValue>('controlCalidad');
    return this.omitirVacios({
      controlPosEcoli: control.controlPosEcoli,
      controlNegPaer: control.controlNegPaer,
      blanco: control.blanco,
      observaciones: control.observaciones,
    });
  }

  private resolverCamposLecturaLegacy(): LegacyLecturaFields {
    const muestraConResultado = this.muestrasLectura.find((m) => m.resultado);
    if (muestraConResultado?.resultado) {
      return this.omitirVacios({
        n_muestra_lectura: this.numeroMuestraDesdeEtiqueta(muestraConResultado.label),
        dilucion: muestraConResultado.resultado.d,
        colonias_contadas: muestraConResultado.resultado.sumaA,
      });
    }

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

    const traspaso = this.groupValue<IncubacionConfFormValue>('incubacionConf');
    if (!traspaso.fechaTraspaso || !traspaso.horaTraspaso || !traspaso.analistaTraspaso) {
      await this.mostrarAlerta('Traspaso incompleto', 'Complete fecha, hora y analista de traspaso antes de finalizar.');
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
