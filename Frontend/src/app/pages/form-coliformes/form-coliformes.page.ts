import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

// ─── Tipos e Interfaces ──────────────────────────────────────────────────────
type ResultadoSubmuestra = 'positivo' | 'negativo' | 'sin_registrar';
type Dilucion = '1ml' | '0.1ml' | '0.01ml';
type ControlPresencia = 'presencia' | 'ausencia' | 'sin_registrar';

interface LecturaSubmuestra {
  muestraId: string;
  esDuplicado: boolean;
  dilucion: Dilucion;
  submuestra: 1 | 2 | 3;
  resultado: ResultadoSubmuestra;
}

interface EntradaMuestra {
  id: string;
  esDuplicado: boolean;
  label: string;
  submuestras: {
    '1ml': [ResultadoSubmuestra, ResultadoSubmuestra, ResultadoSubmuestra];
    '0.1ml': [ResultadoSubmuestra, ResultadoSubmuestra, ResultadoSubmuestra];
    '0.01ml': [ResultadoSubmuestra, ResultadoSubmuestra, ResultadoSubmuestra];
  };
}

interface BloqueTabla {
  fechaLectura: string;
  horaLectura: string;
  analistaResponsable: string;
  numeroMuestraIncluyeDuplicado: string;
  entradas: EntradaMuestra[];
}

// ─── Datos mock importados de solicitud de ingreso ───────────────────────────
const MOCK_SOLICITUD = {
  codigoAlimento: 'ALI-2025-00421',
  fechaIncubacion: '06/05',
  horaIncubacion: '10:00',
  analistaIncubacion: 'Dra. Valentina Rojas',
};

const DILUCIONES: Dilucion[] = ['1ml', '0.1ml', '0.01ml'];
const RESULTADO_DEFAULT: ResultadoSubmuestra = 'sin_registrar';
const N_MUESTRAS = 6; // 6 muestras + 1 duplicado

// ─── Helpers ─────────────────────────────────────────────────────────────────
function crearEntradas(): EntradaMuestra[] {
  const entradas: EntradaMuestra[] = [];
  for (let i = 1; i <= N_MUESTRAS; i++) {
    entradas.push({
      id: `M${i}`,
      esDuplicado: false,
      label: `Muestra ${i}`,
      submuestras: {
        '1ml': [RESULTADO_DEFAULT, RESULTADO_DEFAULT, RESULTADO_DEFAULT],
        '0.1ml': [RESULTADO_DEFAULT, RESULTADO_DEFAULT, RESULTADO_DEFAULT],
        '0.01ml': [RESULTADO_DEFAULT, RESULTADO_DEFAULT, RESULTADO_DEFAULT],
      },
    });
  }
  // Duplicado
  entradas.push({
    id: 'DUP',
    esDuplicado: true,
    label: 'Duplicado',
    submuestras: {
      '1ml': [RESULTADO_DEFAULT, RESULTADO_DEFAULT, RESULTADO_DEFAULT],
      '0.1ml': [RESULTADO_DEFAULT, RESULTADO_DEFAULT, RESULTADO_DEFAULT],
      '0.01ml': [RESULTADO_DEFAULT, RESULTADO_DEFAULT, RESULTADO_DEFAULT],
    },
  });
  return entradas;
}

function crearBloqueTabla(): BloqueTabla {
  return {
    fechaLectura: '',
    horaLectura: '',
    analistaResponsable: '',
    numeroMuestraIncluyeDuplicado: '',
    entradas: crearEntradas(),
  };
}

@Component({
  selector: 'app-form-coliformes',
  templateUrl: './form-coliformes.page.html',
  styleUrls: ['./form-coliformes.page.scss'],
  standalone: false,
})
export class FormColiformesPage implements OnInit {

  // ─── Wizard ──────────────────────────────────────────────────────────────────
  readonly TOTAL_ETAPAS = 5;
  etapaActual = 1;
  readonly NOMBRES_ETAPAS = [
    'Alimento e Incubación',
    'Detalles de Siembra',
    'Control de Análisis',
    'Control de Calidad',
    'Datos Finales',
  ];

  // ─── Etapa 1: datos importados (no editables) ────────────────────────────────
  datosImportados = { ...MOCK_SOLICITUD };

  // ─── Etapa 1: formulario reactivo (campos editables) ─────────────────────────
  form!: FormGroup;

  // ─── Etapa 2: siembra ────────────────────────────────────────────────────────
  micropipetasSeleccionadas: string[] = [];
  readonly OPCIONES_MICROPIPETA = ['1 ml', '10 ml'];

  // ─── Etapa 3: tablas de lectura ───────────────────────────────────────────────
  tabla24h: BloqueTabla = crearBloqueTabla();
  tabla48h: BloqueTabla = crearBloqueTabla();
  readonly DILUCIONES = DILUCIONES;

  // ─── Errores de hora ──────────────────────────────────────────────────────────
  errorHora24h = '';
  errorHora48h = '';

  // ─── Etapa 4: control de calidad ─────────────────────────────────────────────
  controlKAerogenes: ControlPresencia = 'sin_registrar';
  controlSAureus: ControlPresencia = 'sin_registrar';
  controlEColi: ControlPresencia = 'sin_registrar';
  controlBlanco = '';

  // ─── Etapa 5: datos finales ───────────────────────────────────────────────────
  datosFinalNumeroMuestra = '';
  resultadoColiformesTotales: number | string = '';
  resultadoColiformesFecales: number | string = '';
  resultadoEColi: number | string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      // Etapa 1 – editables
      fechaTerminoAnalisis: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]],
      analistaTerminoAnalisis: ['', Validators.required],
      // Etapa 2
      codigoMedioHomogeneizacion: ['', Validators.required],
      caldoLauril: ['', Validators.required],
      tween80: [''],
      estufaUtilizada: ['', Validators.required],
      codigoMuestraNaturaleza: ['', Validators.required],
      muestra10g90ml: [''],
      muestra50g450ml: [''],
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // NAVEGACIÓN
  // ══════════════════════════════════════════════════════════════════════════════
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
    if (n >= 1 && n <= this.TOTAL_ETAPAS) this.etapaActual = n;
  }

  private validarEtapaActual(): boolean {
    let valido = true;

    if (this.etapaActual === 1) {
      ['fechaTerminoAnalisis', 'analistaTerminoAnalisis'].forEach(c => {
        const ctrl = this.form.get(c);
        ctrl?.markAsTouched();
        if (ctrl?.invalid) valido = false;
      });
    }

    if (this.etapaActual === 2) {
      ['codigoMedioHomogeneizacion', 'caldoLauril', 'estufaUtilizada', 'codigoMuestraNaturaleza'].forEach(c => {
        const ctrl = this.form.get(c);
        ctrl?.markAsTouched();
        if (ctrl?.invalid) valido = false;
      });
      if (this.micropipetasSeleccionadas.length === 0) {
        valido = false;
        this.mostrarToast('Debe seleccionar al menos una micropipeta.', 'warning');
      }
    }

    if (this.etapaActual === 3) {
      const err24 = this.validarRangoHora(this.tabla24h.horaLectura, this.datosImportados.horaIncubacion);
      const err48 = this.validarRangoHora(this.tabla48h.horaLectura, this.datosImportados.horaIncubacion);
      this.errorHora24h = err24;
      this.errorHora48h = err48;
      if (err24 || err48 || !this.tabla24h.analistaResponsable || !this.tabla48h.analistaResponsable) {
        valido = false;
      }
    }

    if (this.etapaActual === 4) {
      if (
        this.controlKAerogenes === 'sin_registrar' ||
        this.controlSAureus === 'sin_registrar' ||
        this.controlEColi === 'sin_registrar' ||
        !this.controlBlanco.trim()
      ) {
        valido = false;
        this.mostrarToast('Complete todos los controles de calidad.', 'warning');
      }
    }

    if (!valido && this.etapaActual !== 3 && this.etapaActual !== 4) {
      this.mostrarToast('Complete los campos obligatorios antes de continuar.', 'warning');
    }
    return valido;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MICROPIPETAS
  // ══════════════════════════════════════════════════════════════════════════════
  toggleMicropipeta(opcion: string): void {
    const idx = this.micropipetasSeleccionadas.indexOf(opcion);
    if (idx >= 0) {
      this.micropipetasSeleccionadas.splice(idx, 1);
    } else {
      this.micropipetasSeleccionadas.push(opcion);
    }
  }

  esMicropipetaSeleccionada(opcion: string): boolean {
    return this.micropipetasSeleccionadas.includes(opcion);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // TABLA DE SUBMUESTRAS
  // ══════════════════════════════════════════════════════════════════════════════
  ciclarResultado(entrada: EntradaMuestra, dilucion: Dilucion, idx: number): void {
    const orden: ResultadoSubmuestra[] = ['sin_registrar', 'positivo', 'negativo'];
    const actual = entrada.submuestras[dilucion][idx];
    const siguiente = orden[(orden.indexOf(actual) + 1) % orden.length];
    entrada.submuestras[dilucion][idx] = siguiente;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // VALIDACIÓN HORA ±2 HORAS
  // ══════════════════════════════════════════════════════════════════════════════
  private validarRangoHora(horaIngresada: string, horaProgramada: string): string {
    if (!horaIngresada) return 'La hora de lectura es obligatoria.';
    const parseHora = (h: string): number => {
      const [hh, mm] = h.split(':').map(Number);
      return hh * 60 + mm;
    };
    const minutos = parseHora(horaIngresada);
    const base = parseHora(horaProgramada);
    if (Math.abs(minutos - base) > 120) {
      return 'La hora de lectura debe estar dentro del rango permitido de ±2 horas respecto de la hora programada.';
    }
    return '';
  }

  onHora24hChange(): void {
    this.errorHora24h = this.validarRangoHora(this.tabla24h.horaLectura, this.datosImportados.horaIncubacion);
  }

  onHora48hChange(): void {
    this.errorHora48h = this.validarRangoHora(this.tabla48h.horaLectura, this.datosImportados.horaIncubacion);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // NMP PLACEHOLDER
  // ══════════════════════════════════════════════════════════════════════════════
  /**
   * TODO: Conectar con la tabla oficial NMP o el algoritmo de cálculo definido por el laboratorio.
   * Por ahora devuelve un placeholder indicando que requiere implementación real.
   */
  calcularNMP(): void {
    // PLACEHOLDER: La fórmula real de NMP (Number Most Probable) debe conectarse aquí.
    // Requiere la tabla de NMP de la FDA/APHA según combinación de tubos positivos.
    this.resultadoColiformesTotales = '< CALCULAR NMP >';
    this.resultadoColiformesFecales = '< CALCULAR NMP >';
    this.resultadoEColi = '< CALCULAR NMP >';
    this.mostrarToast('Función NMP pendiente de implementación con tabla oficial.', 'warning');
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ENVÍO Y CANCELACIÓN
  // ══════════════════════════════════════════════════════════════════════════════
  async enviarFormulario(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      await this.mostrarAlerta('Campos incompletos', 'Existen campos obligatorios sin completar. Revise cada etapa.');
      return;
    }
    // TODO: Integrar con el servicio backend real
    await this.mostrarAlerta('Éxito', 'Registro de análisis enviado correctamente.');
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

  // ══════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════════
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
