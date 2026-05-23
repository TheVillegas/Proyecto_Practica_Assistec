import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

// ─── Tipos e Interfaces ──────────────────────────────────────────────────────
type Cumple = 'cumple' | 'no_cumple' | 'sin_registrar';

interface MuestraEtapa3 {
  id: string;
  esDuplicado: boolean;
  label: string;
  caldoApt: boolean;
  selenito: boolean;
  rappaport: boolean;
}

interface MuestraEtapa4 {
  id: string;
  esDuplicado: boolean;
  label: string;
  // Selenito
  xld24hSel: string;
  ss24hSel: string;
  xld48hSel: string;
  ss48hSel: string;
  // Rappaport
  xld24hRap: string;
  ss24hRap: string;
  xld48hRap: string;
  ss48hRap: string;
}

interface MuestraEtapa5 {
  id: string;
  esDuplicado: boolean;
  label: string;
  resultadoFinal: string;
}

const N_MUESTRAS = 6;
const MOCK_SOLICITUD = {
  codigoAlimento: 'ALI-2025-00422',
  fechaIncubacion: '06/05',
  horaIncubacion: '10:00',
  analistaIncubacion: 'Dra. Valentina Rojas',
};

function crearMuestrasEtapa3(): MuestraEtapa3[] {
  const arr: MuestraEtapa3[] = [];
  for (let i = 1; i <= N_MUESTRAS; i++) {
    arr.push({ id: `M${i}`, esDuplicado: false, label: `Muestra ${i}`, caldoApt: false, selenito: false, rappaport: false });
  }
  arr.push({ id: 'DUP', esDuplicado: true, label: 'Duplicado', caldoApt: false, selenito: false, rappaport: false });
  return arr;
}

function crearMuestrasEtapa4(): MuestraEtapa4[] {
  const arr: MuestraEtapa4[] = [];
  for (let i = 1; i <= N_MUESTRAS; i++) {
    arr.push({
      id: `M${i}`, esDuplicado: false, label: `Muestra ${i}`,
      xld24hSel: '-', ss24hSel: '-', xld48hSel: '-', ss48hSel: '-',
      xld24hRap: '-', ss24hRap: '-', xld48hRap: '-', ss48hRap: '-'
    });
  }
  arr.push({
    id: 'DUP', esDuplicado: true, label: 'Duplicado',
    xld24hSel: '-', ss24hSel: '-', xld48hSel: '-', ss48hSel: '-',
    xld24hRap: '-', ss24hRap: '-', xld48hRap: '-', ss48hRap: '-'
  });
  return arr;
}

function crearMuestrasEtapa5(): MuestraEtapa5[] {
  const arr: MuestraEtapa5[] = [];
  for (let i = 1; i <= N_MUESTRAS; i++) {
    arr.push({ id: `M${i}`, esDuplicado: false, label: `Muestra ${i}`, resultadoFinal: '' });
  }
  arr.push({ id: 'DUP', esDuplicado: true, label: 'Duplicado', resultadoFinal: '' });
  return arr;
}

@Component({
  selector: 'app-form-salmonella',
  templateUrl: './form-salmonella.page.html',
  styleUrls: ['./form-salmonella.page.scss'],
  standalone: false
})
export class FormSalmonellaPage implements OnInit {

  readonly TOTAL_ETAPAS = 5;
  etapaActual = 1;
  readonly NOMBRES_ETAPAS = [
    'Inicio y Trazabilidad',
    'Insumos y Calidad',
    'Traspaso a Caldos',
    'Resultados en Agar',
    'Conclusión Final'
  ];

  datosImportados = { ...MOCK_SOLICITUD };
  form!: FormGroup;

  // ─── Variables Globales para Radios Personalizados ───
  e2_resultadoAnalisis: Cumple = 'sin_registrar';
  e2_resultadoControlBlanco: Cumple = 'sin_registrar';
  e2_resultadoControlSiembra: Cumple = 'sin_registrar';

  e3_controlPositivo: Cumple = 'sin_registrar';
  e3_controlNegativo: Cumple = 'sin_registrar';
  e3_blanco: Cumple = 'sin_registrar';

  e4_controlPositivo: Cumple = 'sin_registrar';
  e4_controlNegativo: Cumple = 'sin_registrar';
  e4_blanco: Cumple = 'sin_registrar';

  // ─── Colecciones de Muestras ───
  muestrasEtapa3: MuestraEtapa3[] = crearMuestrasEtapa3();
  muestrasEtapa4: MuestraEtapa4[] = crearMuestrasEtapa4();
  muestrasEtapa5: MuestraEtapa5[] = crearMuestrasEtapa5();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      // ── Etapa 1: Configuración Inicial y Trazabilidad ──
      e1_fechaIncubacion: [this.datosImportados.fechaIncubacion],
      e1_horaIncubacion: [this.datosImportados.horaIncubacion],
      e1_tipoMatriz: [''],
      e1_pesoMuestra: [''],
      e1_caldoAPT: [''],
      e1_horaInicioHidratacion: [''],
      e1_horaTerminoHidratacion: [''],
      e1_fechaSiembra: [''],
      e1_horaHomogeneizacion: [''],
      e1_horaTerminoHomogeneizacion: [''],
      e1_horaIngresoEstufa: [''],
      e1_analistaResponsable: [''],
      e1_fechaTerminoAnalisis: [''],

      // ── Etapa 2: Insumos y Controles de Calidad ──
      e2_loteCaldo: [''],
      e2_tween80: [false],
      e2_micropipetas: [false],
      e2_estufaIncubacion: [''],
      e2_analisisDescripcion: [''],
      e2_controlBlancoAli: [''],
      e2_controlSiembraAli: [''],

      // ── Etapa 3: Datos y Resultados de Traspaso ──
      e3_fechaTraspaso: [''],
      e3_horaLecturaAPT: [''],
      e3_analistaLecturaAPT: [''],
      e3_horaLecturaCaldos: [''],
      e3_analistaLecturaCaldos: [''],
      e3_selenitoEstufa: [''],
      e3_puntas1ml: [false],
      e3_micropipetasUtilizadas: [false],
      e3_pipetasDesechables: [false],
      e3_micropipetasExtra: [false],

      // ── Etapa 4: Resultados en Agar ──
      e4_fechaTraspasoAgares: [''],
      e4_horaTraspasoAgares: [''],
      e4_analistaTraspasoAgares: [''],
      e4_loteAgarXLD: [''],
      e4_loteAgarSS: [''],
      e4_estufaIncubacionAgares: [''],
      e4_fechaLectura24h: [''],
      e4_horaLectura24h: [''],
      e4_analistaLectura24h: [''],
      e4_fechaLectura48h: [''],
      e4_horaLectura48h: [''],
      e4_analistaLectura48h: [''],

    });

    this.form.get('e1_tipoMatriz')?.valueChanges.subscribe(val => {
      if (val === 'Normal' || val === 'Polvo') {
        this.form.get('e1_caldoAPT')?.setValue('Caldo APT');
      } else if (val === 'Chocolate') {
        this.form.get('e1_caldoAPT')?.setValue('Leche descremada');
      }
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
    // Sin validación estricta para propósitos de la demo/diseño.
    return true;
  }

  async enviarFormulario(): Promise<void> {
    await this.mostrarAlerta('Éxito', 'Registro de análisis de Salmonella enviado correctamente.');
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
