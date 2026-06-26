import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { forkJoin, of, catchError, firstValueFrom } from 'rxjs';
import { CatalogosService } from '../../services/catalogos.service';
import { SaureusApiService } from '../../services/saureus-api.service';
import {
  EquipoIncubacion,
  Micropipeta,
  Responsable,
  LoteReactivo,
} from '../../interfaces/catalogo.interfaces';
import { SauFormulario } from '../../interfaces/saureus.interfaces';

@Component({
  selector: 'app-form-s-aureus',
  templateUrl: './form-s-aureus.page.html',
  styleUrls: ['./form-s-aureus.page.scss'],
  standalone: false,
})
export class FormSAureusPage implements OnInit {
  readonly TOTAL_ETAPAS = 6;
  etapaActual = 1;
  readonly NOMBRES_ETAPAS = [
    'Inicio e Incubación',
    'Control de Siembra',
    'Traspaso a Caldo BHI',
    'Prueba de Coagulasa',
    'Resultados S. Aureus',
    'Conclusión Final',
  ];

  idFormulario = '';
  idAnalisis = '';
  form!: FormGroup;
  formularioUpdatedAt = '';

  listaEquiposIncubacion: EquipoIncubacion[] = [];
  listaPipetas: Micropipeta[] = [];
  listaResponsables: Responsable[] = [];
  listaLotesReactivo: LoteReactivo[] = [];

  datosImportados = {
    codigoAlimento: '',
    fechaIncubacion: '',
    horaIncubacion: '',
    analistaIncubacion: '',
  };

  e1_duplicadoAliCumple: string = 'sin_registrar';
  e1_controlBlancoCumple: string = 'sin_registrar';
  e1_controlSiembraCumple: string = 'sin_registrar';
  e6_desfavorable: string = 'sin_registrar';

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);
  private readonly catalogosService = inject(CatalogosService);
  private readonly saureusApi = inject(SaureusApiService);

  ngOnInit(): void {
    const idParam =
      this.route.snapshot.paramMap.get('id') ||
      this.route.snapshot.queryParamMap.get('analisis') ||
      this.route.snapshot.queryParamMap.get('idFormulario');

    if (!idParam) {
      this.mostrarAlerta(
        'Error',
        'No se encontró el identificador del análisis.'
      );
      this.router.navigate(['/home']);
      return;
    }

    this.idAnalisis = idParam;
    this.initForm();

    forkJoin({
      equipos: this.catalogosService.getEquiposIncubacion().pipe(
        catchError(() => {
          console.warn('[Sau] Catálogo equipos_incubacion no disponible');
          return of([] as EquipoIncubacion[]);
        })
      ),
      pipetas: this.catalogosService.getMicroPipetas().pipe(
        catchError(() => {
          console.warn('[Sau] Catálogo micropipetas no disponible');
          return of([] as Micropipeta[]);
        })
      ),
      responsables: this.catalogosService.getResponsables('analista').pipe(
        catchError(() => {
          console.warn('[Sau] Catálogo responsables no disponible');
          return of([] as Responsable[]);
        })
      ),
      lotes: this.catalogosService.getLotesReactivo('agar_baird_parker').pipe(
        catchError(() => {
          console.warn('[Sau] Catálogo lotes no disponible');
          return of([] as LoteReactivo[]);
        })
      ),
      formulario: this.saureusApi.obtenerPorAnalisis(this.idAnalisis),
    }).subscribe({
      next: (res) => {
        this.listaEquiposIncubacion = res.equipos;
        this.listaPipetas = res.pipetas;
        this.listaResponsables = res.responsables;
        this.listaLotesReactivo = res.lotes;
        this.cargarFormulario(res.formulario);
      },
      error: (err) => {
        if (err.message === 'NOT_FOUND') {
          this.mostrarAlerta(
            'Formulario no encontrado',
            'No existe un formulario S. Aureus para este análisis.'
          );
          this.router.navigate(['/home']);
          return;
        }
        this.mostrarToast('Error al cargar datos del formulario.', 'danger');
      },
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      e1_analistaInicio: [''],
      e1_fechaInicio: [''],
      e1_horaInicio: [''],
      e1_analistaTermino: [''],
      e1_fechaTermino: [''],
      e1_horaTermino: [''],
      e1_horaHomogeneizado: [''],
      e1_horaSiembra: [''],
      e1_agarBairdParker: [''],
      e1_micropipeta: [null as number | null],
      e1_codigoMicropipeta: [''],
      e1_nMuestra10g: [null as number | null],
      e1_nMuestra50g: [null as number | null],
      e1_estufa: [null as number | null],
      e1_duplicadoAnalisis: [''],
      e1_controlBlanco: [''],
      e1_controlSiembra: [''],

      e2_controlSAureusUFC: [''],
      e2_controlPositivoSAureus: [''],
      e2_controlNegativoSEpidermidis: [''],
      e2_blanco: [''],
      e2_sd: [''],
      e2_fecha24h: [''],
      e2_hora24h: [''],
      e2_analista24h: [''],
      e2_fecha48h: [''],
      e2_hora48h: [''],
      e2_analista48h: [''],

      e3_fechaTraspaso: [''],
      e3_horaTraspaso: [''],
      e3_analistaTraspaso: [''],
      e3_caldoBHI: [''],
      e3_estufa: [null as number | null],
      e3_controlPositivo: [''],
      e3_controlNegativo: [''],
      e3_blanco: [''],
      e3_fechaLectura: [''],
      e3_horaLectura: [''],
      e3_analistaLectura: [''],

      e4_fechaPrueba: [''],
      e4_horaPrueba: [''],
      e4_analistaPrueba: [''],
      e4_tubosEsteriles: [''],
      e4_puntas1ml: [''],
      e4_bacident: [''],
      e4_micropipeta: [null as number | null],
      e4_estufa: [null as number | null],
      e4_fechaLectura4h: [''],
      e4_horaLectura4h: [''],
      e4_analistaLectura4h: [''],
      e4_coagulasa4h: [''],
      e4_controlPositivo4h: [''],
      e4_controlNegativo4h: [''],
      e4_blanco4h: [''],
      e4_fechaLectura24h: [''],
      e4_horaLectura24h: [''],
      e4_analistaLectura24h: [''],
      e4_coagulasa24h: [''],
      e4_controlPositivo24h: [''],
      e4_controlNegativo24h: [''],
      e4_blanco24h: [''],

      e6_tablaPagina: [''],
      e6_limite: [''],
      e6_fechaEntrega: [''],
      e6_horaEntrega: [''],
    });
  }

  private cargarFormulario(formulario: SauFormulario): void {
    this.idFormulario = formulario.idSauFormulario;
    this.etapaActual = formulario.etapaActual || 1;
    this.formularioUpdatedAt = formulario.updatedAt;

    if (formulario.etapa1) {
      const e1 = formulario.etapa1;
      this.form.patchValue({
        e1_analistaInicio: e1.rutAnalistaInicio,
        e1_fechaInicio: e1.fechaInicioIncubacion
          ? e1.fechaInicioIncubacion.substring(0, 10)
          : '',
        e1_horaInicio: e1.fechaInicioIncubacion
          ? e1.fechaInicioIncubacion.substring(11, 16)
          : '',
        e1_analistaTermino: e1.rutAnalistaTermino,
        e1_fechaTermino: e1.fechaTerminoAnalisis
          ? e1.fechaTerminoAnalisis.substring(0, 10)
          : '',
        e1_horaTermino: e1.fechaTerminoAnalisis
          ? e1.fechaTerminoAnalisis.substring(11, 16)
          : '',
        e1_horaHomogeneizado: e1.horaHomogeneizado || '',
        e1_horaSiembra: e1.horaSiembra || '',
        e1_agarBairdParker: e1.codigoAgarBairdParker || '',
        e1_nMuestra10g: e1.nMuestra10g90ml || null,
        e1_nMuestra50g: e1.nMuestra50g450ml || null,
        e1_micropipeta: e1.idMicropipeta || null,
        e1_codigoMicropipeta: e1.codigoMicropipeta || '',
        e1_estufa: e1.idEstufa || null,
        e1_duplicadoAnalisis: e1.duplicadoAliRef || '',
        e1_controlBlanco: e1.ctrlPositivoBlancoAli || '',
        e1_controlSiembra: e1.ctrlSiembraAli || '',
      });
      this.e1_duplicadoAliCumple =
        e1.ctrlDuplicadoCumple || 'sin_registrar';
      this.e1_controlBlancoCumple =
        e1.ctrlPositivoCumple || 'sin_registrar';
      this.e1_controlSiembraCumple =
        e1.ctrlSiembraCumple || 'sin_registrar';
    }

    if (formulario.etapa2) {
      const e2 = formulario.etapa2;
      this.form.patchValue({
        e2_controlSAureusUFC: e2.ctrlSiembraSAureusUfc,
        e2_controlPositivoSAureus: e2.ctrlPositivoSAureus,
        e2_controlNegativoSEpidermidis: e2.ctrlNegativoSEpiderUfc,
        e2_blanco: e2.blancoUfc,
        e2_sd: e2.sd,
        e2_fecha24h: e2.fechaLectura24h
          ? e2.fechaLectura24h.substring(0, 10)
          : '',
        e2_hora24h: e2.fechaLectura24h
          ? e2.fechaLectura24h.substring(11, 16)
          : '',
        e2_analista24h: e2.rutAnalista24h,
        e2_fecha48h: e2.fechaLectura48h
          ? e2.fechaLectura48h.substring(0, 10)
          : '',
        e2_hora48h: e2.fechaLectura48h
          ? e2.fechaLectura48h.substring(11, 16)
          : '',
        e2_analista48h: e2.rutAnalista48h,
      });
    }

    if (formulario.etapa3) {
      const e3 = formulario.etapa3;
      this.form.patchValue({
        e3_fechaTraspaso: e3.fechaHoraTraspaso
          ? e3.fechaHoraTraspaso.substring(0, 10)
          : '',
        e3_horaTraspaso: e3.fechaHoraTraspaso
          ? e3.fechaHoraTraspaso.substring(11, 16)
          : '',
        e3_analistaTraspaso: e3.rutAnalistaTraspaso,
        e3_caldoBHI: e3.codigoCaldoBhi,
        e3_estufa: e3.idEstufa || null,
        e3_controlPositivo: e3.ctrlPositivoSAureus,
        e3_controlNegativo: e3.ctrlNegativoSEpider,
        e3_blanco: e3.blanco,
        e3_fechaLectura: e3.fechaHoraLectura
          ? e3.fechaHoraLectura.substring(0, 10)
          : '',
        e3_horaLectura: e3.fechaHoraLectura
          ? e3.fechaHoraLectura.substring(11, 16)
          : '',
        e3_analistaLectura: e3.rutAnalistaLectura,
      });
    }

    if (formulario.etapa4) {
      const e4 = formulario.etapa4;
      this.form.patchValue({
        e4_fechaPrueba: e4.fechaHoraPrueba
          ? e4.fechaHoraPrueba.substring(0, 10)
          : '',
        e4_horaPrueba: e4.fechaHoraPrueba
          ? e4.fechaHoraPrueba.substring(11, 16)
          : '',
        e4_analistaPrueba: e4.rutAnalistaPrueba,
        e4_tubosEsteriles: e4.codigoTubosEsteriles,
        e4_puntas1ml: e4.codigoPuntas1ml,
        e4_bacident: e4.codigoBacidentAgua,
        e4_micropipeta: e4.idMicropipeta || null,
        e4_estufa: e4.idEstufa || null,
        e4_fechaLectura4h: e4.fechaLectura46h
          ? e4.fechaLectura46h.substring(0, 10)
          : '',
        e4_horaLectura4h: e4.fechaLectura46h
          ? e4.fechaLectura46h.substring(11, 16)
          : '',
        e4_analistaLectura4h: e4.rutAnalista46h,
        e4_coagulasa4h: e4.resultadoCoagulasa46h,
        e4_controlPositivo4h: e4.ctrlPositivo46h,
        e4_controlNegativo4h: e4.ctrlNegativo46h,
        e4_blanco4h: e4.blanco46h,
        e4_fechaLectura24h: e4.fechaLectura24h
          ? e4.fechaLectura24h.substring(0, 10)
          : '',
        e4_horaLectura24h: e4.fechaLectura24h
          ? e4.fechaLectura24h.substring(11, 16)
          : '',
        e4_analistaLectura24h: e4.rutAnalista24h,
        e4_coagulasa24h: e4.resultadoCoagulasa24h,
        e4_controlPositivo24h: e4.ctrlPositivo24h,
        e4_controlNegativo24h: e4.ctrlNegativo24h,
        e4_blanco24h: e4.blanco24h,
      });
    }

    if (formulario.etapa6) {
      const e6 = formulario.etapa6;
      this.form.patchValue({
        e6_tablaPagina: e6.tablaPaginaReferencia,
        e6_limite: e6.limiteNormativo,
        e6_fechaEntrega: e6.fechaHoraEntrega
          ? e6.fechaHoraEntrega.substring(0, 10)
          : '',
        e6_horaEntrega: e6.fechaHoraEntrega
          ? e6.fechaHoraEntrega.substring(11, 16)
          : '',
      });
      this.e6_desfavorable =
        e6.desfavorable === true
          ? 'si'
          : e6.desfavorable === false
            ? 'no'
            : 'sin_registrar';
    }
  }

  get progresoPorcentaje(): number {
    return Math.round(
      ((this.etapaActual - 1) / (this.TOTAL_ETAPAS - 1)) * 100
    );
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

  async enviarFormulario(): Promise<void> {
    const ok = await this.guardarBorradorCompleto();
    if (ok) {
      const okFinal = await this.guardarEtapa(this.TOTAL_ETAPAS, true);
      if (okFinal) {
        await this.mostrarAlerta(
          'Éxito',
          'Registro de análisis S. Aureus enviado correctamente.'
        );
        this.router.navigate(['/home']);
      }
    }
  }

  /** Guarda todo el formulario hasta la etapa actual (borrador) */
  async guardarFormularioBorrador(): Promise<void> {
    const ok = await this.guardarBorradorCompleto();
    if (ok) {
      this.mostrarToast('Borrador guardado correctamente', 'success');
    }
  }

  async guardarBorrador(): Promise<void> {
    await this.guardarFormularioBorrador();
  }

  private async guardarBorradorCompleto(): Promise<boolean> {
    for (let etapa = 1; etapa <= this.etapaActual; etapa++) {
      const ok = await this.guardarEtapa(etapa, false);
      if (!ok) return false;
    }
    return true;
  }

  async recargarFormulario(): Promise<void> {
    try {
      const form = await firstValueFrom(this.saureusApi.obtenerPorAnalisis(this.idAnalisis));
      this.cargarFormulario(form);
    } catch (err) {
      this.mostrarToast('Error al recargar el formulario', 'danger');
    }
  }

  private async guardarEtapa(etapa: number, completada: boolean): Promise<boolean> {
    if (!this.idFormulario) {
      this.mostrarToast('No hay formulario activo para guardar.', 'danger');
      return false;
    }

    try {
      const payload = this.construirPayload(etapa, completada);
      payload['updated_at'] = this.formularioUpdatedAt;

      const result = await firstValueFrom(
        this.saureusApi.saveEtapa(
          this.idFormulario,
          etapa,
          payload
        )
      );

      this.formularioUpdatedAt = result.updatedAt;
      return true;
    } catch (err: unknown) {
      const httpErr = err as { status?: number; error?: { mensaje?: string } };
      if (httpErr.status === 409) {
        await this.mostrarAlerta(
          'Conflicto de concurrencia',
          httpErr.error?.mensaje ||
            'El formulario fue modificado por otro usuario. Recargando...'
        );
        await this.recargarFormulario();
      } else {
        this.mostrarToast('Error al guardar. Intente nuevamente.', 'danger');
      }
      return false;
    }
  }

  private construirPayload(etapa: number, completada: boolean): Record<string, unknown> {
    const v = this.form.value;
    const base: Record<string, unknown> = { completada };

    if (etapa === 1) {
      let tiempoHomoSiembraMin: number | undefined;
      let tiempoHomoValido: boolean | undefined;
      if (v.e1_horaHomogeneizado && v.e1_horaSiembra) {
        const [h1, m1] = v.e1_horaHomogeneizado.split(':').map(Number);
        const [h2, m2] = v.e1_horaSiembra.split(':').map(Number);
        tiempoHomoSiembraMin = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (tiempoHomoSiembraMin < 0) tiempoHomoSiembraMin += 24 * 60;
        tiempoHomoValido = tiempoHomoSiembraMin < 15;
      }

      base['etapa'] = {
        fecha_inicio_incubacion:
          v.e1_fechaInicio && v.e1_horaInicio
            ? `${v.e1_fechaInicio}T${v.e1_horaInicio}:00`
            : undefined,
        rut_analista_inicio: v.e1_analistaInicio || undefined,
        fecha_termino_analisis:
          v.e1_fechaTermino && v.e1_horaTermino
            ? `${v.e1_fechaTermino}T${v.e1_horaTermino}:00`
            : undefined,
        rut_analista_termino: v.e1_analistaTermino || undefined,
        codigo_agar_baird_parker: v.e1_agarBairdParker || undefined,
        n_muestra_10g_90ml: v.e1_nMuestra10g ? Number(v.e1_nMuestra10g) : undefined,
        n_muestra_50g_450ml: v.e1_nMuestra50g ? Number(v.e1_nMuestra50g) : undefined,
        id_micropipeta: v.e1_micropipeta ? Number(v.e1_micropipeta) : undefined,
        codigo_micropipeta: v.e1_codigoMicropipeta || undefined,
        id_estufa: v.e1_estufa || undefined,
        duplicado_ali_ref: v.e1_duplicadoAnalisis || undefined,
        ctrl_duplicado_cumple:
          this.e1_duplicadoAliCumple !== 'sin_registrar'
            ? this.e1_duplicadoAliCumple === 'cumple'
            : undefined,
        ctrl_positivo_blanco_ali: v.e1_controlBlanco || undefined,
        ctrl_positivo_cumple:
          this.e1_controlBlancoCumple !== 'sin_registrar'
            ? this.e1_controlBlancoCumple === 'cumple'
            : undefined,
        ctrl_siembra_ali: v.e1_controlSiembra || undefined,
        ctrl_siembra_cumple:
          this.e1_controlSiembraCumple !== 'sin_registrar'
            ? this.e1_controlSiembraCumple === 'cumple'
            : undefined,
        tiempo_homo_siembra_min: tiempoHomoSiembraMin,
        tiempo_homo_valido: tiempoHomoValido,
        hora_homogeneizado: v.e1_horaHomogeneizado || undefined,
        hora_siembra: v.e1_horaSiembra || undefined,
      };
    }

    if (etapa === 2) {
      base['etapa'] = {
        ctrl_siembra_s_aureus_ufc: v.e2_controlSAureusUFC
          ? Number(v.e2_controlSAureusUFC)
          : undefined,
        ctrl_positivo_s_aureus: v.e2_controlPositivoSAureus || undefined,
        ctrl_negativo_s_epider_ufc: v.e2_controlNegativoSEpidermidis
          ? Number(v.e2_controlNegativoSEpidermidis)
          : undefined,
        blanco_ufc: v.e2_blanco ? Number(v.e2_blanco) : undefined,
        sd: v.e2_sd ? Number(v.e2_sd) : undefined,
        fecha_lectura_24h:
          v.e2_fecha24h && v.e2_hora24h
            ? `${v.e2_fecha24h}T${v.e2_hora24h}:00`
            : undefined,
        rut_analista_24h: v.e2_analista24h || undefined,
        fecha_lectura_48h:
          v.e2_fecha48h && v.e2_hora48h
            ? `${v.e2_fecha48h}T${v.e2_hora48h}:00`
            : undefined,
        rut_analista_48h: v.e2_analista48h || undefined,
      };
    }

    if (etapa === 3) {
      base['etapa'] = {
        fecha_hora_traspaso:
          v.e3_fechaTraspaso && v.e3_horaTraspaso
            ? `${v.e3_fechaTraspaso}T${v.e3_horaTraspaso}:00`
            : undefined,
        rut_analista_traspaso: v.e3_analistaTraspaso || undefined,
        codigo_caldo_bhi: v.e3_caldoBHI || undefined,
        id_estufa: v.e3_estufa || undefined,
        ctrl_positivo_s_aureus: v.e3_controlPositivo || undefined,
        ctrl_negativo_s_epider: v.e3_controlNegativo || undefined,
        blanco: v.e3_blanco || undefined,
        fecha_hora_lectura:
          v.e3_fechaLectura && v.e3_horaLectura
            ? `${v.e3_fechaLectura}T${v.e3_horaLectura}:00`
            : undefined,
        rut_analista_lectura: v.e3_analistaLectura || undefined,
      };
    }

    if (etapa === 4) {
      base['etapa'] = {
        fecha_hora_prueba:
          v.e4_fechaPrueba && v.e4_horaPrueba
            ? `${v.e4_fechaPrueba}T${v.e4_horaPrueba}:00`
            : undefined,
        rut_analista_prueba: v.e4_analistaPrueba || undefined,
        codigo_tubos_esteriles: v.e4_tubosEsteriles || undefined,
        codigo_puntas_1ml: v.e4_puntas1ml || undefined,
        codigo_bacident_agua: v.e4_bacident || undefined,
        id_micropipeta: v.e4_micropipeta || undefined,
        id_estufa: v.e4_estufa || undefined,
        fecha_lectura_46h:
          v.e4_fechaLectura4h && v.e4_horaLectura4h
            ? `${v.e4_fechaLectura4h}T${v.e4_horaLectura4h}:00`
            : undefined,
        rut_analista_46h: v.e4_analistaLectura4h || undefined,
        resultado_coagulasa_46h: v.e4_coagulasa4h || undefined,
        ctrl_positivo_46h: v.e4_controlPositivo4h || undefined,
        ctrl_negativo_46h: v.e4_controlNegativo4h || undefined,
        blanco_46h: v.e4_blanco4h || undefined,
        fecha_lectura_24h:
          v.e4_fechaLectura24h && v.e4_horaLectura24h
            ? `${v.e4_fechaLectura24h}T${v.e4_horaLectura24h}:00`
            : undefined,
        rut_analista_24h: v.e4_analistaLectura24h || undefined,
        resultado_coagulasa_24h: v.e4_coagulasa24h || undefined,
        ctrl_positivo_24h: v.e4_controlPositivo24h || undefined,
        ctrl_negativo_24h: v.e4_controlNegativo24h || undefined,
        blanco_24h: v.e4_blanco24h || undefined,
        lecturas: [],
      };
    }

    if (etapa === 5) {
      base['resultados'] = [];
    }

    if (etapa === 6) {
      base['etapa'] = {
        desfavorable:
          this.e6_desfavorable === 'si'
            ? true
            : this.e6_desfavorable === 'no'
              ? false
              : undefined,
        tabla_pagina_referencia: v.e6_tablaPagina || undefined,
        limite_normativo: v.e6_limite || undefined,
        fecha_hora_entrega:
          v.e6_fechaEntrega && v.e6_horaEntrega
            ? `${v.e6_fechaEntrega}T${v.e6_horaEntrega}:00`
            : undefined,
        cerrado: completada || undefined,
      };
    }

    return base;
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

  campoInvalido(campo: string): boolean {
    const ctrl = this.form.get(campo);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  private async mostrarAlerta(
    header: string,
    message: string
  ): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['Entendido'],
    });
    await alert.present();
  }

  private async mostrarToast(
    message: string,
    color: 'success' | 'warning' | 'danger'
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
