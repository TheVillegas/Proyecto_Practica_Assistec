import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

// ─── Constantes de catálogo ───────────────────────────────────────────────────
const OPCIONES_ESTUFA = [
  { valor: 'Estufa 73-M (35.0 +/- 0.5 °C)', label: 'Estufa 73-M (35.0 +/- 0.5 °C)' },
  { valor: 'Estufa 2-M (35.5 +/- 0.5 °C)',  label: 'Estufa 2-M (35.5 +/- 0.5 °C)'  },
];

const OPCIONES_TIPO_MUESTRA = ['Mixta', 'Homogénea'];

// ─── Tipos de flujo ───────────────────────────────────────────────────────────
// Pasos del wizard (8 en total):
//  1 = Prep / Pesado
//  2 = Prep / Homogeneización
//  3 = Prep / Sembrado
//  4 = Prep / Incubación
//  5 = Análisis (Lectura)
//  6 = Conf / Incubación
//  7 = Conf / Lectura
//  8 = Conf / Resultados

// ─── Validator Reactivo de Oxidasa ────────────────────────────────────────────
// Formato: R69-AA-NN  donde AA = 2 dígitos (año), NN = 01 | 02
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

// ─── Tabla lectura de placas ──────────────────────────────────────────────────
interface TablaPlacas {
  muestraPlaca1: string;
  muestraPlaca2: string;
  duplicadoPlaca1: string;
  duplicadoPlaca2: string;
}

// ─── Tabla resultados ─────────────────────────────────────────────────────────
interface TablaResultados {
  muestraB: string;
  muestraA: string;
  d: string;
  n1: string;
  n2: string;
  m: string;
  sumaA: string;
}

@Component({
  selector: 'app-form-enterobacterias',
  templateUrl: './form-enterobacterias.page.html',
  styleUrls: ['./form-enterobacterias.page.scss'],
  standalone: false,
})
export class FormEnterobacteriasPage implements OnInit {

  // ─── Catálogos expuestos al template ─────────────────────────────────────────
  readonly opcionesEstufa = OPCIONES_ESTUFA;
  readonly opcionesTipoMuestra = OPCIONES_TIPO_MUESTRA;

  // ─── Definición de etapas/subetapas ──────────────────────────────────────────
  // Etapa principal: 0=Preparación, 1=Análisis, 2=Confirmación
  readonly ETAPAS_PRINCIPALES = ['Preparación', 'Análisis (Lectura)', 'Confirmación'];

  // Subetapas por etapa principal
  readonly SUBETAPAS_PREP = ['Pesado', 'Homogeneización', 'Sembrado', 'Incubación'];
  readonly SUBETAPAS_CONF = ['Incubación', 'Lectura', 'Resultados'];

  // Paso actual (1-8)
  pasoActual = 1;
  readonly TOTAL_PASOS = 8;

  // Completados (true si el paso fue validado ok)
  pasosCompletados: boolean[] = Array(this.TOTAL_PASOS + 1).fill(false);

  // Formulario reactivo global
  form!: FormGroup;

  // ─── Tablas manuales (fuera del FormGroup reactivo) ──────────────────────────
  tablaPlacas: TablaPlacas = {
    muestraPlaca1: '', muestraPlaca2: '',
    duplicadoPlaca1: '', duplicadoPlaca2: ''
  };


  tablaResultados: TablaResultados = {
    muestraB: '', muestraA: '', d: '', n1: '', n2: '', m: '', sumaA: ''
  };

  // ─── Errores de tablas (validación numérica) ──────────────────────────────────
  erroresTablaPlacas: Partial<Record<keyof TablaPlacas, string>> = {};
  erroresTablaResultados: Partial<Record<keyof TablaResultados, string>> = {};

  // ─── Formulario completado ────────────────────────────────────────────────────
  formularioCompletado = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) { }

  ngOnInit(): void {
    this.inicializarTablas();
    this.construirFormulario();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════════════════════
  private inicializarTablas(): void {
    this.tablaPlacas = {
      muestraPlaca1: '', muestraPlaca2: '',
      duplicadoPlaca1: '', duplicadoPlaca2: ''
    };
    this.tablaResultados = {
      muestraB: '', muestraA: '', d: '', n1: '', n2: '', m: '', sumaA: ''
    };
  }

  private construirFormulario(): void {
    this.form = this.fb.group({

      // ── PASO 1: Pesado ──────────────────────────────────────────────────
      codigoALI:        ['ALI-2025-00421', Validators.required],
      nActa:            ['', Validators.required],
      tipoMuestra:      ['', Validators.required],
      nMuestra10g90ml:  ['', [Validators.min(0)]],
      nMuestra50g450ml: ['', [Validators.min(0)]],
      fechaInicio:      ['', Validators.required],
      horaInicio:       ['', Validators.required],
      analistaInicio:   ['', Validators.required],

      // ── PASO 2: Homogeneización ──────────────────────────────────────────
      fechaHomog:    ['', Validators.required],
      horaHomog:     ['', Validators.required],
      analistaHomog: ['', Validators.required],

      // ── PASO 3: Sembrado ─────────────────────────────────────────────────
      agarVRBGSembrado:       ['', Validators.required],
      estufaSembrado:         ['', Validators.required],
      placasSembrado:         ['', Validators.required],
      micropipeta1mlSembrado: ['100', Validators.required],
      fechaSembrado:          ['', Validators.required],
      horaSembrado:           ['', Validators.required],
      analistaSembrado:       ['', Validators.required],

      // ── PASO 4: Incubación (Prep) ────────────────────────────────────────
      agarVRBGIncub:   ['', Validators.required],
      estufaIncub:     ['', Validators.required],
      fechaTermino:    ['', Validators.required],
      horaTermino:     ['', Validators.required],
      analistaIncub:   ['', Validators.required],

      // ── PASO 5: Análisis (Lectura) ───────────────────────────────────────
      fechaLectura24h:    ['', Validators.required],
      horaLectura24h:     ['', Validators.required],
      analistaLectura24h: ['', Validators.required],
      nMuestraLectura:    ['', [Validators.required, Validators.min(0)]],
      dilucion:           ['', [Validators.required, Validators.min(0)]],
      colonias:           ['', [Validators.required, Validators.min(0)]],
      equipoCuentaColonias: ['', Validators.required],

      // ── PASO 6: Confirmación / Incubación ────────────────────────────────
      fechaTraspaso:    ['', Validators.required],
      horaTraspaso:     ['', Validators.required],
      analistaTraspaso: ['', Validators.required],
      agarNutritivo:    ['', Validators.required],
      estufaConfIncub:  ['', Validators.required],

      // ── PASO 7: Confirmación / Lectura ───────────────────────────────────
      fechaLectConf:    ['', Validators.required],
      horaLectConf:     ['', Validators.required],
      analistaLectConf: ['', Validators.required],

      // Prueba de Oxidasa
      fechaOxidasa:    ['', Validators.required],
      horaOxidasa:     ['', Validators.required],
      analistaOxidasa: ['', Validators.required],
      reactivoOxidasa: ['', [Validators.required, reactivoOxidasaValidator]],
      desaireadoAgarGlucosa: ['', Validators.required],
      agarGlucosa:     ['', Validators.required],
      controlPosEcoli: ['', Validators.required],
      controlNegPaer:  ['', Validators.required],
      blanco:          ['', Validators.required],

      // ── PASO 8: Confirmación / Resultados ────────────────────────────────
      observaciones: [''],
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GETTERS DE NAVEGACIÓN
  // ════════════════════════════════════════════════════════════════════════════

  /** Índice de etapa principal activa (0, 1 o 2) */
  get etapaPrincipalActiva(): number {
    if (this.pasoActual <= 4) return 0;
    if (this.pasoActual === 5) return 1;
    return 2;
  }

  /** Label de la subetapa activa */
  get subetapaActivaLabel(): string {
    if (this.pasoActual <= 4) return this.SUBETAPAS_PREP[this.pasoActual - 1];
    if (this.pasoActual === 5) return 'Lectura 24 hrs';
    return this.SUBETAPAS_CONF[this.pasoActual - 6];
  }

  /** Porcentaje de progreso para la barra */
  get progresoPorcentaje(): number {
    return Math.round(((this.pasoActual - 1) / (this.TOTAL_PASOS - 1)) * 100);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // NAVEGACIÓN
  // ════════════════════════════════════════════════════════════════════════════
  avanzar(): void {
    if (!this.validarPasoActual()) return;
    this.pasosCompletados[this.pasoActual] = true;
    if (this.pasoActual < this.TOTAL_PASOS) {
      this.pasoActual++;
    }
  }

  retroceder(): void {
    if (this.pasoActual > 1) this.pasoActual--;
  }

  async finalizar(): Promise<void> {
    if (!this.validarPasoActual()) return;
    this.pasosCompletados[this.pasoActual] = true;
    this.formularioCompletado = true;

    const toast = await this.toastCtrl.create({
      message: 'Registro de análisis completado correctamente.',
      duration: 4000,
      color: 'success',
      position: 'top',
    });
    await toast.present();
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

  // ════════════════════════════════════════════════════════════════════════════
  // VALIDACIÓN POR PASO
  // ════════════════════════════════════════════════════════════════════════════
  private validarPasoActual(): boolean {
    let camposDelPaso: string[] = [];

    switch (this.pasoActual) {
      case 1:
        camposDelPaso = ['codigoALI', 'nActa', 'tipoMuestra', 'fechaInicio', 'horaInicio', 'analistaInicio'];
        if (this.form.get('nMuestra10g90ml')?.value) camposDelPaso.push('nMuestra10g90ml');
        if (this.form.get('nMuestra50g450ml')?.value) camposDelPaso.push('nMuestra50g450ml');
        break;
      case 2:
        camposDelPaso = ['fechaHomog', 'horaHomog', 'analistaHomog'];
        break;
      case 3:
        camposDelPaso = ['agarVRBGSembrado', 'estufaSembrado', 'placasSembrado',
                         'micropipeta1mlSembrado', 'fechaSembrado', 'horaSembrado', 'analistaSembrado'];
        break;
      case 4:
        camposDelPaso = ['agarVRBGIncub', 'estufaIncub', 'fechaTermino', 'horaTermino', 'analistaIncub'];
        break;
      case 5:
        camposDelPaso = ['fechaLectura24h', 'horaLectura24h', 'analistaLectura24h',
                         'nMuestraLectura', 'dilucion', 'colonias', 'equipoCuentaColonias'];
        break;
      case 6:
        camposDelPaso = ['fechaTraspaso', 'horaTraspaso', 'analistaTraspaso', 'agarNutritivo', 'estufaConfIncub'];
        break;
      case 7:
        camposDelPaso = [
          'fechaLectConf', 'horaLectConf', 'analistaLectConf',
          'fechaOxidasa', 'horaOxidasa', 'analistaOxidasa',
          'reactivoOxidasa', 'desaireadoAgarGlucosa', 'agarGlucosa',
          'controlPosEcoli', 'controlNegPaer', 'blanco'
        ];
        break;
      case 8:
        // Tabla de resultados: validar numéricos si tienen valor
        if (!this.validarTablaResultados()) return false;
        return true;
      default:
        return true;
    }

    // Marcar todos los campos del paso como touched
    camposDelPaso.forEach(c => this.form.get(c)?.markAsTouched());

    const hayError = camposDelPaso.some(c => this.form.get(c)?.invalid);
    if (hayError) {
      this.mostrarToast('Complete los campos obligatorios correctamente.', 'warning');
      return false;
    }

    // Paso 7: validar tabla de placas (opcional pero validar si tienen valor)
    if (this.pasoActual === 7) {
      if (!this.validarTablaPlacas()) return false;
    }

    return true;
  }

  private validarTablaPlacas(): boolean {
    this.erroresTablaPlacas = {};
    const campos: (keyof TablaPlacas)[] = ['muestraPlaca1', 'muestraPlaca2', 'duplicadoPlaca1', 'duplicadoPlaca2'];
    let valido = true;
    campos.forEach(c => {
      const val = this.tablaPlacas[c];
      if (val !== '' && (isNaN(Number(val)) || Number(val) < 0)) {
        this.erroresTablaPlacas[c] = 'Ingrese un valor numérico válido.';
        valido = false;
      }
    });
    if (!valido) this.mostrarToast('Verifique los valores numéricos de la tabla de placas.', 'warning');
    return valido;
  }

  private validarTablaResultados(): boolean {
    this.erroresTablaResultados = {};
    const campos: (keyof TablaResultados)[] = ['muestraB', 'muestraA', 'd', 'n1', 'n2', 'm', 'sumaA'];
    let valido = true;
    campos.forEach(c => {
      const val = this.tablaResultados[c];
      if (val !== '' && (isNaN(Number(val)) || Number(val) < 0)) {
        this.erroresTablaResultados[c] = 'Ingrese un valor numérico válido.';
        valido = false;
      }
    });
    if (!valido) this.mostrarToast('Verifique los valores numéricos de la tabla de resultados.', 'warning');
    return valido;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // HELPERS PARA EL TEMPLATE
  // ════════════════════════════════════════════════════════════════════════════
  campoInvalido(nombre: string): boolean {
    const ctrl = this.form.get(nombre);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  mensajeErrorReactivo(): string {
    const ctrl = this.form.get('reactivoOxidasa');
    if (!ctrl || !ctrl.touched) return '';
    if (ctrl.errors?.['required']) return 'El campo Test Oxidasa / Reactivo de Oxidasa es obligatorio.';
    if (ctrl.errors?.['reactivoInvalido']) return ctrl.errors['reactivoInvalido'];
    return '';
  }

  /** Retorna la fecha actual en formato YYYY-MM-DD para el atributo [max] de los inputs de fecha */
  hoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 3500, color, position: 'top' });
    await toast.present();
  }
}
