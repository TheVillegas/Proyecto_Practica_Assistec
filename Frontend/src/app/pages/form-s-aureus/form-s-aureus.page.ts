import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

// ─── Tipos e Interfaces ──────────────────────────────────────────────────────
type Cumple = 'cumple' | 'no_cumple' | 'sin_registrar';
type Desfavorable = 'si' | 'no' | 'sin_registrar';

interface MuestraEtapa1 {
  id: string;
  esDuplicado: boolean;
  label: string;
  lectura24h1: string;
  lectura24h2: string;
  lectura48h1: string;
  lectura48h2: string;
}

interface MuestraEtapa3 {
  id: string;
  label: string;
  placa1: string;
  placa2: string;
}

interface MuestraEtapa4 {
  id: string;
  label: string;
  placa1: string;
  placa2: string;
}

interface MuestraEtapa5 {
  id: string;
  label: string;
  numSAureus: string;
  ufc: string;
}

const N_MUESTRAS = 6;
const MOCK_SOLICITUD = {
  codigoAlimento: 'ALI-2025-00421',
  fechaIncubacion: '06/05',
  horaIncubacion: '10:00',
  analistaIncubacion: 'Dra. Valentina Rojas',
};

function crearMuestrasEtapa1(): MuestraEtapa1[] {
  const arr: MuestraEtapa1[] = [];
  for (let i = 1; i <= N_MUESTRAS; i++) {
    arr.push({ id: `M${i}`, esDuplicado: false, label: `Muestra ${i}`, lectura24h1: '', lectura24h2: '', lectura48h1: '', lectura48h2: '' });
  }
  arr.push({ id: 'DUP', esDuplicado: true, label: 'Duplicado', lectura24h1: '', lectura24h2: '', lectura48h1: '', lectura48h2: '' });
  return arr;
}

function crearMuestrasEtapa3(): MuestraEtapa3[] {
  const arr: MuestraEtapa3[] = [];
  for (let i = 1; i <= N_MUESTRAS; i++) {
    arr.push({ id: `M${i}`, label: `Muestra ${i}`, placa1: '', placa2: '' });
  }
  arr.push({ id: 'DUP', label: 'Duplicado', placa1: '', placa2: '' });
  return arr;
}

function crearMuestrasEtapa4(): MuestraEtapa4[] {
  const arr: MuestraEtapa4[] = [];
  for (let i = 1; i <= N_MUESTRAS; i++) {
    arr.push({ id: `M${i}`, label: `Muestra ${i}`, placa1: '', placa2: '' });
  }
  arr.push({ id: 'DUP', label: 'Duplicado', placa1: '', placa2: '' });
  return arr;
}

function crearMuestrasEtapa5(): MuestraEtapa5[] {
  const arr: MuestraEtapa5[] = [];
  for (let i = 1; i <= N_MUESTRAS; i++) {
    arr.push({ id: `M${i}`, label: `Muestra ${i}`, numSAureus: '', ufc: '' });
  }
  arr.push({ id: 'DUP', label: 'Duplicado', numSAureus: '', ufc: '' });
  return arr;
}

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

  datosImportados = { ...MOCK_SOLICITUD };
  form!: FormGroup;

  // ─── Etapa 1 ──────────────────────────────────────────────────────────────
  muestrasEtapa1: MuestraEtapa1[] = crearMuestrasEtapa1();
  e1_duplicadoAliCumple: Cumple = 'sin_registrar';
  e1_controlBlancoCumple: Cumple = 'sin_registrar';
  e1_controlSiembraCumple: Cumple = 'sin_registrar';

  // ─── Etapa 3 ──────────────────────────────────────────────────────────────
  muestrasEtapa3: MuestraEtapa3[] = crearMuestrasEtapa3();

  // ─── Etapa 4 ──────────────────────────────────────────────────────────────
  muestrasEtapa4_4a6h: MuestraEtapa4[] = crearMuestrasEtapa4();
  muestrasEtapa4_24h: MuestraEtapa4[] = crearMuestrasEtapa4();

  // ─── Etapa 5 ──────────────────────────────────────────────────────────────
  muestrasEtapa5: MuestraEtapa5[] = crearMuestrasEtapa5();

  // ─── Etapa 6 ──────────────────────────────────────────────────────────────
  e6_desfavorable: Desfavorable = 'sin_registrar';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      // ── Etapa 1 ──
      e1_analistaInicio: [this.datosImportados.analistaIncubacion],
      e1_fechaInicio: [this.datosImportados.fechaIncubacion],
      e1_horaInicio: [this.datosImportados.horaIncubacion],
      e1_analistaTermino: [''],
      e1_fechaTermino: [''],
      e1_horaTermino: [''],
      e1_tiempoMenor15: [false],
      e1_agarBairdParker: [''],
      e1_micropipeta1ml: [false],
      e1_micropipeta10ml: [false],
      e1_nroMuestraRadio: [''], // 10gr/90ml o 50gr/450ml
      e1_estufa: [''], // 73-M o 2-M
      e1_duplicadoAnalisis: [''],
      e1_controlBlanco: [''],
      e1_controlSiembra: [''],

      // ── Etapa 2 ──
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

      // ── Etapa 3 ──
      e3_fechaTraspaso: [''],
      e3_horaTraspaso: [''],
      e3_analistaTraspaso: [''],
      e3_caldoBHI: [''],
      e3_estufa: [''],
      e3_controlPositivo: [''],
      e3_controlNegativo: [''],
      e3_blanco: [''],
      e3_fechaLectura: [''],
      e3_horaLectura: [''],
      e3_analistaLectura: [''],

      // ── Etapa 4 ──
      e4_fechaPrueba: [''],
      e4_horaPrueba: [''],
      e4_analistaPrueba: [''],
      e4_tubosEsteriles: [''],
      e4_puntas1ml: [''],
      e4_bacident: [''],
      e4_micropipeta: [''], // 22-M o 23-M
      e4_estufa: [''],
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

      // ── Etapa 6 ──
      e6_tablaPagina: [''],
      e6_limite: [''],
      e6_fechaEntrega: [''],
      e6_horaEntrega: ['']
    });
  }

  get progresoPorcentaje(): number {
    return Math.round(((this.etapaActual - 1) / (this.TOTAL_ETAPAS - 1)) * 100);
  }

  avanzarEtapa(): void {
    if (!this.validarEtapaActual()) return;
    if (this.etapaActual < this.TOTAL_ETAPAS) this.etapaActual++;
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
    // Para pruebas de diseño: forzamos que ninguna etapa sea obligatoria.
    return true;
  }

  async enviarFormulario(): Promise<void> {
    // Validación deshabilitada para pruebas de diseño
    await this.mostrarAlerta('Éxito', 'Registro de análisis S. Aureus enviado correctamente.');
    this.router.navigate(['/home']);
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
          handler: () => this.router.navigate(['/home'])
        }
      ]
    });
    await alert.present();
  }

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
