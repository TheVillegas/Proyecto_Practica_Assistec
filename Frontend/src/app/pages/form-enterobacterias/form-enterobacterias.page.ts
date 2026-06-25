import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { firstValueFrom, forkJoin } from 'rxjs';
import { EnterobacteriasApiService } from '../../services/enterobacterias-api.service';
import { AuthService } from '../../services/auth-service';
import { CatalogosService } from '../../services/catalogos.service';
import { EntEtapaPayload, EntFormularioCompleto } from '../../interfaces/enterobacterias.interfaces';
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

interface CatalogosEnterobacterias {
  equiposIncubacion: EquipoIncubacion[];
  responsables: Responsable[];
  micropipetas: Micropipeta[];
  lotesAgarVRBG: LoteReactivo[];
  lotesTween80: LoteReactivo[];
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

  readonly TOTAL_PASOS = 8;
  readonly NOMBRES_ETAPAS = ['Preparación', 'Análisis', 'Confirmación'];
  readonly SUBETAPAS = [
    'Pesado',
    'Homogeneización',
    'Sembrado',
    'Incubación',
    'Lectura 24h',
    'Incubación confirmación',
    'Lectura oxidasa',
    'Resultados',
  ];

  idFormulario = 0;
  pasoActual = 1;
  form!: FormGroup;
  formularioCompletado = false;
  updatedAt = '';
  cargando = signal(true);

  /** Getters tipados para el template — form.get() retorna AbstractControl */
  get pesadoGroup(): FormGroup { return this.form.get('pesado') as FormGroup; }
  get homogeneizacionGroup(): FormGroup { return this.form.get('homogeneizacion') as FormGroup; }
  get sembradoGroup(): FormGroup { return this.form.get('sembrado') as FormGroup; }
  get incubacionPrepGroup(): FormGroup { return this.form.get('incubacionPrep') as FormGroup; }
  get analisisLecturaGroup(): FormGroup { return this.form.get('analisisLectura') as FormGroup; }
  get incubacionConfGroup(): FormGroup { return this.form.get('incubacionConf') as FormGroup; }
  get lecturaOxidasaGroup(): FormGroup { return this.form.get('lecturaOxidasa') as FormGroup; }
  get resultadosGroup(): FormGroup { return this.form.get('resultados') as FormGroup; }

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
      responsables: this.catalogosService.getResponsables(),
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
        codigoALI: ['', Validators.required],
        nActa: ['', Validators.required],
        tipoMuestra: ['', Validators.required],
        nMuestra10g90ml: [null, [Validators.min(0)]],
        nMuestra50g450ml: [null, [Validators.min(0)]],
        fechaInicio: ['', Validators.required],
        horaInicio: ['', Validators.required],
        analistaInicio: ['', Validators.required],
      }),
      homogeneizacion: this.fb.group({
        fechaHomog: ['', Validators.required],
        horaHomog: ['', Validators.required],
        analistaHomog: ['', Validators.required],
      }),
      sembrado: this.fb.group({
        agarVRBGSembrado: ['', Validators.required],
        estufaSembrado: [null, Validators.required],
        placasSembrado: [null, Validators.required],
        micropipeta1mlSembrado: [null, Validators.required],
        fechaSembrado: ['', Validators.required],
        horaSembrado: ['', Validators.required],
        analistaSembrado: ['', Validators.required],
      }),
      incubacionPrep: this.fb.group({
        agarVRBGIncub: [''],
        estufaIncub: [null, Validators.required],
        fechaTermino: ['', Validators.required],
        horaTermino: ['', Validators.required],
        analistaIncub: ['', Validators.required],
      }),
      analisisLectura: this.fb.group({
        fechaLectura24h: ['', Validators.required],
        horaLectura24h: ['', Validators.required],
        analistaLectura24h: ['', Validators.required],
        nMuestraLectura: [null, [Validators.required, Validators.min(0)]],
        dilucion: [null, [Validators.required, Validators.min(0)]],
        colonias: [null, [Validators.required, Validators.min(0)]],
        equipoCuentaColonias: ['', Validators.required],
      }),
      incubacionConf: this.fb.group({
        fechaTraspaso: ['', Validators.required],
        horaTraspaso: ['', Validators.required],
        analistaTraspaso: ['', Validators.required],
        agarNutritivo: ['', Validators.required],
        estufaConfIncub: [null, Validators.required],
      }),
      lecturaOxidasa: this.fb.group({
        fechaLectConf: ['', Validators.required],
        horaLectConf: ['', Validators.required],
        analistaLectConf: ['', Validators.required],
        fechaOxidasa: ['', Validators.required],
        horaOxidasa: ['', Validators.required],
        analistaOxidasa: ['', Validators.required],
        reactivoOxidasa: ['', [Validators.required, reactivoOxidasaValidator]],
        desaireadoAgarGlucosa: ['', Validators.required],
        agarGlucosa: ['', Validators.required],
        controlPosEcoli: ['', Validators.required],
        controlNegPaer: ['', Validators.required],
        blanco: ['', Validators.required],
      }),
      resultados: this.fb.group({
        observaciones: [''],
      }),
    });
  }

  private cargarFormulario(formulario: EntFormularioCompleto): void {
    this.updatedAt = formulario.updatedAt ?? '';
    this.pasoActual = formulario.subetapaActual ?? 1;

    const e1 = formulario.etapa1;
    if (e1) {
      this.form.get('pesado')?.patchValue({
        codigoALI: e1.codigoAli,
        nActa: e1.nActa,
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
        nMuestraLectura: e2.nMuestraLectura,
        dilucion: e2.dilucion,
        colonias: e2.coloniasContadas,
        equipoCuentaColonias: e2.idEquipoCuentaColonias ? String(e2.idEquipoCuentaColonias) : '',
      });
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
      this.form.get('lecturaOxidasa')?.patchValue({
        fechaLectConf: e3.fechaLectConf,
        horaLectConf: e3.horaLectConf,
        analistaLectConf: e3.rutAnalistaLectConf,
        fechaOxidasa: e3.fechaOxidasa,
        horaOxidasa: e3.horaOxidasa,
        analistaOxidasa: e3.rutAnalistaOxidasa,
        reactivoOxidasa: e3.reactivoOxidasa,
        desaireadoAgarGlucosa: e3.desaireadoAgarGlucosa,
        agarGlucosa: e3.agarGlucosa,
        controlPosEcoli: e3.controlPosEcoli,
        controlNegPaer: e3.controlNegPaer,
        blanco: e3.blanco,
      });
      this.form.get('resultados')?.patchValue({
        observaciones: e3.observaciones,
      });
    }
  }

  get etapaActual(): number {
    if (this.pasoActual <= 4) return 1;
    if (this.pasoActual === 5) return 2;
    return 3;
  }

  get subetapaActualLabel(): string {
    return this.SUBETAPAS[this.pasoActual - 1];
  }

  get progresoPorcentaje(): number {
    return Math.round(((this.pasoActual - 1) / (this.TOTAL_PASOS - 1)) * 100);
  }

  get rol(): number {
    return this.authService.getUsuario()?.primaryRole ?? 0;
  }

  get modoLectura(): boolean {
    return ![0, 4].includes(this.rol);
  }

  get pasoEsFinDeEtapa(): boolean {
    return this.pasoActual === 4 || this.pasoActual === 5 || this.pasoActual === this.TOTAL_PASOS;
  }

  async onSiguiente(): Promise<void> {
    if (!this.validarPasoActual()) return;

    if (this.pasoEsFinDeEtapa && !this.modoLectura) {
      const etapa = this.etapaActual;
      const exito = await this.guardarEtapa(etapa, true);
      if (!exito) return;
    }

    if (this.pasoActual < this.TOTAL_PASOS) {
      this.pasoActual++;
    } else {
      this.formularioCompletado = true;
      this.mostrarToast('Registro de análisis completado correctamente.', 'success');
    }
  }

  onAnterior(): void {
    if (this.pasoActual > 1) this.pasoActual--;
  }

  async onGuardarBorrador(): Promise<void> {
    if (this.modoLectura) return;
    const exito = await this.guardarBorradorCompleto();
    if (exito) {
      this.mostrarToast('Borrador completo guardado.', 'success');
    }
  }

  private async guardarBorradorCompleto(): Promise<boolean> {
    for (let etapa = 1; etapa <= this.etapaActual; etapa++) {
      const exito = await this.guardarEtapa(etapa, false);
      if (!exito) return false;
    }
    return true;
  }

  private async guardarEtapa(etapa: number, completada: boolean): Promise<boolean> {
    try {
      const payload = this.construirPayloadEtapa(etapa, completada);
      const respuesta = await firstValueFrom(
        this.apiService.guardarEtapa(this.idFormulario, etapa as 1 | 2 | 3, payload, this.updatedAt)
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

  private construirPayloadEtapa(etapa: number, completada: boolean): EntEtapaPayload {
    switch (etapa) {
      case 1:
        return { completada, etapa: { ...this.form.value.pesado, ...this.form.value.homogeneizacion, ...this.form.value.sembrado, ...this.form.value.incubacionPrep } };
      case 2:
        return { completada, etapa: { ...this.form.value.analisisLectura } };
      case 3:
        return { completada, etapa: { ...this.form.value.incubacionConf, ...this.form.value.lecturaOxidasa, ...this.form.value.resultados } };
      default:
        return { completada, etapa: {} };
    }
  }

  private validarPasoActual(): boolean {
    let grupo: string | null = null;

    switch (this.pasoActual) {
      case 1: grupo = 'pesado'; break;
      case 2: grupo = 'homogeneizacion'; break;
      case 3: grupo = 'sembrado'; break;
      case 4: grupo = 'incubacionPrep'; break;
      case 5: grupo = 'analisisLectura'; break;
      case 6: grupo = 'incubacionConf'; break;
      case 7: grupo = 'lecturaOxidasa'; break;
      case 8: grupo = 'resultados'; break;
    }

    if (!grupo) return true;

    const fg = this.form.get(grupo) as FormGroup;
    fg.markAllAsTouched();

    if (fg.invalid) {
      this.mostrarToast('Complete los campos obligatorios correctamente.', 'warning');
      return false;
    }

    return true;
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
