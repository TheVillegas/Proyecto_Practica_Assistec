import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { EnterobacteriasApiService } from '../../services/enterobacterias-api.service';
import { AuthService } from '../../services/auth-service';
import { EntEtapaPayload } from '../../interfaces/enterobacterias.interfaces';

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

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.idFormulario = idParam ? Number(idParam) : 0;
    this.inicializarFormulario();
  }

  private inicializarFormulario(): void {
    this.form = this.fb.group({
      pesado: this.fb.group({
        codigoALI: ['ALI-2025-00421', Validators.required],
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
        estufaSembrado: ['', Validators.required],
        placasSembrado: ['', Validators.required],
        micropipeta1mlSembrado: ['100', Validators.required],
        fechaSembrado: ['', Validators.required],
        horaSembrado: ['', Validators.required],
        analistaSembrado: ['', Validators.required],
      }),
      incubacionPrep: this.fb.group({
        agarVRBGIncub: ['', Validators.required],
        estufaIncub: ['', Validators.required],
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
        estufaConfIncub: ['', Validators.required],
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
    const etapa = this.etapaActual;
    const exito = await this.guardarEtapa(etapa, false);
    if (exito) {
      this.mostrarToast('Borrador guardado.', 'success');
    }
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
      const httpErr = err as { status?: number };
      if (httpErr.status === 409) {
        await this.mostrarAlerta('Conflicto de concurrencia', 'El formulario fue modificado por otro usuario. Recargue y vuelva a intentar.');
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
