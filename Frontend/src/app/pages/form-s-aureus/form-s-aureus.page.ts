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
      responsables: this.catalogosService.getResponsables().pipe(
        catchError(() => {
          console.warn('[Sau] Catálogo responsables no disponible');
          return of([] as Responsable[]);
        })
      ),
      formulario: this.saureusApi.obtenerPorAnalisis(this.idAnalisis),
    }).subscribe({
      next: (res) => {
        this.listaEquiposIncubacion = res.equipos;
        this.listaPipetas = res.pipetas;
        this.listaResponsables = res.responsables;
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
      e1_tiempoMenor15: [false],
      e1_agarBairdParker: [''],
      e1_micropipeta1ml: [false],
      e1_micropipeta10ml: [false],
      e1_nroMuestraRadio: [''],
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
        e1_tiempoMenor15: e1.tiempoHomoSiembraMin ?? false,
        e1_agarBairdParker: e1.codigoAgarBairdParker,
        e1_nroMuestraRadio: e1.pesoMuestraTipo || '',
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

  async avanzarEtapa(): Promise<void> {
    if (!this.validarEtapaActual()) return;
    const ok = await this.guardarEtapa(true);
    if (ok && this.etapaActual < this.TOTAL_ETAPAS) {
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
    return true;
  }

  async enviarFormulario(): Promise<void> {
    const ok = await this.guardarEtapa(true);
    if (ok) {
      await this.mostrarAlerta(
        'Éxito',
        'Registro de análisis S. Aureus enviado correctamente.'
      );
      this.router.navigate(['/home']);
    }
  }

  async guardarBorrador(): Promise<void> {
    const ok = await this.guardarEtapa(false);
    if (ok) {
      this.mostrarToast('Borrador guardado', 'success');
    }
  }

  private async guardarEtapa(completada: boolean): Promise<boolean> {
    if (!this.idFormulario) {
      this.mostrarToast('No hay formulario activo para guardar.', 'danger');
      return false;
    }

    try {
      const payload = this.construirPayload(completada);
      payload['updated_at'] = this.formularioUpdatedAt;

      const result = await firstValueFrom(
        this.saureusApi.saveEtapa(
          this.idFormulario,
          this.etapaActual,
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
            'El formulario fue modificado por otro usuario. Recargue y vuelva a intentar.'
        );
      } else {
        this.mostrarToast('Error al guardar. Intente nuevamente.', 'danger');
      }
      return false;
    }
  }

  private construirPayload(completada: boolean): Record<string, unknown> {
    const v = this.form.value;
    const payload: Record<string, unknown> = {
      completada,
      etapaActual: this.etapaActual,
    };

    if (this.etapaActual === 1) {
      Object.assign(payload, {
        fechaInicioIncubacion:
          v.e1_fechaInicio && v.e1_horaInicio
            ? `${v.e1_fechaInicio}T${v.e1_horaInicio}:00`
            : undefined,
        rutAnalistaInicio: v.e1_analistaInicio || undefined,
        fechaTerminoAnalisis:
          v.e1_fechaTermino && v.e1_horaTermino
            ? `${v.e1_fechaTermino}T${v.e1_horaTermino}:00`
            : undefined,
        rutAnalistaTermino: v.e1_analistaTermino || undefined,
        codigoAgarBairdParker: v.e1_agarBairdParker || undefined,
        pesoMuestraTipo: v.e1_nroMuestraRadio || undefined,
        idEstufa: v.e1_estufa || undefined,
        duplicadoAliRef: v.e1_duplicadoAnalisis || undefined,
        ctrlDuplicadoCumple:
          this.e1_duplicadoAliCumple !== 'sin_registrar'
            ? this.e1_duplicadoAliCumple
            : undefined,
        ctrlPositivoBlancoAli: v.e1_controlBlanco || undefined,
        ctrlPositivoCumple:
          this.e1_controlBlancoCumple !== 'sin_registrar'
            ? this.e1_controlBlancoCumple
            : undefined,
        ctrlSiembraAli: v.e1_controlSiembra || undefined,
        ctrlSiembraCumple:
          this.e1_controlSiembraCumple !== 'sin_registrar'
            ? this.e1_controlSiembraCumple
            : undefined,
        tiempoHomoSiembraMin: v.e1_tiempoMenor15,
      });
    }

    if (this.etapaActual === 2) {
      Object.assign(payload, {
        ctrlSiembraSAureusUfc: v.e2_controlSAureusUFC
          ? Number(v.e2_controlSAureusUFC)
          : undefined,
        ctrlPositivoSAureus: v.e2_controlPositivoSAureus || undefined,
        ctrlNegativoSEpiderUfc: v.e2_controlNegativoSEpidermidis
          ? Number(v.e2_controlNegativoSEpidermidis)
          : undefined,
        blancoUfc: v.e2_blanco ? Number(v.e2_blanco) : undefined,
        sd: v.e2_sd ? Number(v.e2_sd) : undefined,
        fechaLectura24h:
          v.e2_fecha24h && v.e2_hora24h
            ? `${v.e2_fecha24h}T${v.e2_hora24h}:00`
            : undefined,
        rutAnalista24h: v.e2_analista24h || undefined,
        fechaLectura48h:
          v.e2_fecha48h && v.e2_hora48h
            ? `${v.e2_fecha48h}T${v.e2_hora48h}:00`
            : undefined,
        rutAnalista48h: v.e2_analista48h || undefined,
      });
    }

    if (this.etapaActual === 3) {
      Object.assign(payload, {
        fechaHoraTraspaso:
          v.e3_fechaTraspaso && v.e3_horaTraspaso
            ? `${v.e3_fechaTraspaso}T${v.e3_horaTraspaso}:00`
            : undefined,
        rutAnalistaTraspaso: v.e3_analistaTraspaso || undefined,
        codigoCaldoBhi: v.e3_caldoBHI || undefined,
        idEstufa: v.e3_estufa || undefined,
        ctrlPositivoSAureus: v.e3_controlPositivo || undefined,
        ctrlNegativoSEpider: v.e3_controlNegativo || undefined,
        blanco: v.e3_blanco || undefined,
        fechaHoraLectura:
          v.e3_fechaLectura && v.e3_horaLectura
            ? `${v.e3_fechaLectura}T${v.e3_horaLectura}:00`
            : undefined,
        rutAnalistaLectura: v.e3_analistaLectura || undefined,
      });
    }

    if (this.etapaActual === 4) {
      Object.assign(payload, {
        fechaHoraPrueba:
          v.e4_fechaPrueba && v.e4_horaPrueba
            ? `${v.e4_fechaPrueba}T${v.e4_horaPrueba}:00`
            : undefined,
        rutAnalistaPrueba: v.e4_analistaPrueba || undefined,
        codigoTubosEsteriles: v.e4_tubosEsteriles || undefined,
        codigoPuntas1ml: v.e4_puntas1ml || undefined,
        codigoBacidentAgua: v.e4_bacident || undefined,
        idMicropipeta: v.e4_micropipeta || undefined,
        idEstufa: v.e4_estufa || undefined,
        fechaLectura46h:
          v.e4_fechaLectura4h && v.e4_horaLectura4h
            ? `${v.e4_fechaLectura4h}T${v.e4_horaLectura4h}:00`
            : undefined,
        rutAnalista46h: v.e4_analistaLectura4h || undefined,
        resultadoCoagulasa46h: v.e4_coagulasa4h || undefined,
        ctrlPositivo46h: v.e4_controlPositivo4h || undefined,
        ctrlNegativo46h: v.e4_controlNegativo4h || undefined,
        blanco46h: v.e4_blanco4h || undefined,
        fechaLectura24h:
          v.e4_fechaLectura24h && v.e4_horaLectura24h
            ? `${v.e4_fechaLectura24h}T${v.e4_horaLectura24h}:00`
            : undefined,
        rutAnalista24h: v.e4_analistaLectura24h || undefined,
        resultadoCoagulasa24h: v.e4_coagulasa24h || undefined,
        ctrlPositivo24h: v.e4_controlPositivo24h || undefined,
        ctrlNegativo24h: v.e4_controlNegativo24h || undefined,
        blanco24h: v.e4_blanco24h || undefined,
        lecturas: [],
      });
    }

    if (this.etapaActual === 5) {
      payload['resultados'] = [];
    }

    if (this.etapaActual === 6) {
      Object.assign(payload, {
        desfavorable:
          this.e6_desfavorable === 'si'
            ? true
            : this.e6_desfavorable === 'no'
              ? false
              : undefined,
        tablaPaginaReferencia: v.e6_tablaPagina || undefined,
        limiteNormativo: v.e6_limite || undefined,
        fechaHoraEntrega:
          v.e6_fechaEntrega && v.e6_horaEntrega
            ? `${v.e6_fechaEntrega}T${v.e6_horaEntrega}:00`
            : undefined,
        cerrado: completada || undefined,
      });
    }

    return payload;
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
