import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

// ─── Tipos e Interfaces ──────────────────────────────────────────────────────
type Cumple = 'cumple' | 'no_cumple' | 'sin_registrar';
type Desfavorable = 'si' | 'no' | 'sin_registrar';

const MOCK_SOLICITUD = {
  codigoAlimento: 'ALI-2025-00421',
  fechaIncubacion: '06/05',
  horaIncubacion: '10:00',
  analistaIncubacion: 'Dra. Valentina Rojas',
};

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

  // ─── Etapa 1: controles ALI (los recuentos se manejan en Etapa 5) ─────────
  e1_duplicadoAliCumple: Cumple = 'sin_registrar';
  e1_controlBlancoCumple: Cumple = 'sin_registrar';
  e1_controlSiembraCumple: Cumple = 'sin_registrar';

  // ─── Etapa 6 ──────────────────────────────────────────────────────────────
  e6_desfavorable: Desfavorable = 'sin_registrar';

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);

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

  async guardarBorrador(): Promise<void> {
    await this.mostrarToast('Borrador guardado (mock)', 'success');
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
