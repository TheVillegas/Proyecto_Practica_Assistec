import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

// ─── Interfaces locales ────────────────────────────────────────────────────────
interface FormularioAnalisis {
  id: string;
  nombre: string;
  seleccionado: boolean;
  obligatorio?: boolean;
}

interface Muestra {
  id: number;
  nombre: string;
  formularios: FormularioAnalisis[];
}

// ─── Datos de catálogo (mock) ──────────────────────────────────────────────────
const TIPOS_ANALISIS = [
  { value: 'microbiologico', label: 'Microbiológico' },
  { value: 'fisicoquimico', label: 'Físico-Químico' },
  { value: 'quimico', label: 'Químico' },
  { value: 'ambiental', label: 'Ambiental' },
];

const FORMULARIOS_POR_TIPO: Record<string, FormularioAnalisis[]> = {
  microbiologico: [
    { id: 'TPA', nombre: 'TPA – Técnica Placa Aerobia', seleccionado: true, obligatorio: true },
    { id: 'RAM', nombre: 'RAM – Recuento Aerobios Mesófilos', seleccionado: false },
    { id: 'ECOLI', nombre: 'E. Coli / Coliformes', seleccionado: false },
    { id: 'SALM', nombre: 'Salmonella', seleccionado: false },
  ],
  fisicoquimico: [
    { id: 'TPA', nombre: 'TPA – Técnica Placa Aerobia', seleccionado: true, obligatorio: true },
    { id: 'PH', nombre: 'Medición de pH', seleccionado: false },
    { id: 'TURB', nombre: 'Turbidez', seleccionado: false },
    { id: 'COND', nombre: 'Conductividad', seleccionado: false },
  ],
  quimico: [
    { id: 'TPA', nombre: 'TPA – Técnica Placa Aerobia', seleccionado: true, obligatorio: true },
    { id: 'METAL', nombre: 'Metales Pesados', seleccionado: false },
    { id: 'PLAG', nombre: 'Plaguicidas', seleccionado: false },
  ],
  ambiental: [
    { id: 'TPA', nombre: 'TPA – Técnica Placa Aerobia', seleccionado: true, obligatorio: true },
    { id: 'PART', nombre: 'Material Particulado', seleccionado: false },
    { id: 'AGUA', nombre: 'Calidad de Agua', seleccionado: false },
  ],
};

const EQUIPOS_ALMACENAMIENTO = [
  'REFRIGERADOR 2-I',
  'CONGELADOR 4-1',
  'MUEBLE 1',
  'GABINETE MICROBIOLOGÍA',
];

const CATEGORIAS = [
  'Alimento',
  'Agua',
  'Ambiental',
  'Cosméticos',
  'Veterinario',
  'Otro',
];

const DIAS_BASE_ENTREGA = 5;

@Component({
  selector: 'app-solicitud-ingreso',
  templateUrl: './solicitud-ingreso.page.html',
  styleUrls: ['./solicitud-ingreso.page.scss'],
  standalone: false,
})
export class SolicitudIngresoPage implements OnInit {

  // ─── Navegación por etapas ───────────────────────────────────────────────────
  readonly TOTAL_ETAPAS = 10;
  etapaActual = 1;

  readonly NOMBRES_ETAPAS = [
    'Identificación',
    'Cliente',
    'Recepción',
    'Muestreo',
    'Análisis',
    'Envases',
    'Observaciones',
    'Flujo',
    'Entrega',
    'Informes',
  ];

  // ─── Formulario reactivo ────────────────────────────────────────────────────
  form!: FormGroup;

  // ─── Datos autogenerados ────────────────────────────────────────────────────
  codigoALI = '';
  numeroActa = '';

  // ─── Formularios de análisis (Etapa 5) ──────────────────────────────────────
  tiposAnalisis = TIPOS_ANALISIS;
  formulariosCatalogo: FormularioAnalisis[] = [];
  equiposAlmacenamiento = EQUIPOS_ALMACENAMIENTO;
  categorias = CATEGORIAS;

  // ─── Muestras (Etapa 5 / sección adicional) ─────────────────────────────────
  muestras: Muestra[] = [];
  private muestraCounter = 1;

  // ─── Estado del flujo (Etapa 8) ─────────────────────────────────────────────
  estadoFlujo: 'borrador' | 'validacion' | 'aprobado' | 'rechazado' = 'borrador';
  fechaEnvioValidacion: Date | null = null;

  // ─── Entrega (Etapa 9) ──────────────────────────────────────────────────────
  tiempoEntregaDias = 0;
  fechaEstimadaEntrega: Date | null = null;

  // ─── Guardado ────────────────────────────────────────────────────────────────
  solicitudGuardada = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.autocompletarCampos();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // INICIALIZACIÓN
  // ══════════════════════════════════════════════════════════════════════════════

  private inicializarFormulario(): void {
    this.form = this.fb.group({
      // Etapa 1
      anioIngreso: [{ value: new Date().getFullYear(), disabled: true }],
      codigoALI: [{ value: '', disabled: true }],
      numeroActa: [{ value: '', disabled: true }],
      codigoExterno: [''],
      categoria: ['', Validators.required],

      // Etapa 2
      nombreCliente: ['', Validators.required],
      direccion: ['', Validators.required],
      nombreSolicitante: ['', Validators.required],
      notasCliente: [''],

      // Etapa 3
      fechaRecepcion: ['', Validators.required],
      temperatura: [null, [Validators.required, Validators.min(-100), Validators.max(200)]],

      // Etapa 4
      fechaInicioMuestreo: ['', Validators.required],
      fechaTerminoMuestreo: ['', Validators.required],
      numeroMuestras: [null, [Validators.required, Validators.min(1)]],
      numeroEnvases: [null, [Validators.required, Validators.min(1)]],
      analistaResponsable: ['', Validators.required],
      lugarMuestreo: ['', Validators.required],
      instructivoMuestreo: [''],

      // Etapa 5
      tipoAnalisis: ['', Validators.required],

      // Etapa 6
      equipoAlmacenamiento: ['', Validators.required],
      muestraCompartida: [false],

      // Etapa 7
      observacionesLaboratorio: [''],
    });

    // Suscribir al cambio de tipo de análisis
    this.form.get('tipoAnalisis')!.valueChanges.subscribe(tipo => {
      this.cargarFormulariosPorTipo(tipo);
    });
  }

  private autocompletarCampos(): void {
    const anio = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-5);
    this.codigoALI = `ALI-${anio}-${timestamp}`;
    this.numeroActa = `ACTA-${anio}-${timestamp}`;

    this.form.patchValue({
      codigoALI: this.codigoALI,
      numeroActa: this.numeroActa,
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // NAVEGACIÓN POR ETAPAS
  // ══════════════════════════════════════════════════════════════════════════════

  get progresoPorcentaje(): number {
    return Math.round(((this.etapaActual - 1) / (this.TOTAL_ETAPAS - 1)) * 100);
  }

  avanzarEtapa(): void {
    if (!this.validarEtapaActual()) return;
    if (this.etapaActual < this.TOTAL_ETAPAS) {
      this.etapaActual++;
      this.calcularEntrega();
    }
  }

  retrocederEtapa(): void {
    if (this.etapaActual > 1) {
      this.etapaActual--;
    }
  }

  irAEtapa(n: number): void {
    if (n >= 1 && n <= this.TOTAL_ETAPAS) {
      this.etapaActual = n;
    }
  }

  private validarEtapaActual(): boolean {
    const camposPorEtapa: Record<number, string[]> = {
      1: ['categoria'],
      2: ['nombreCliente', 'direccion', 'nombreSolicitante'],
      3: ['fechaRecepcion', 'temperatura'],
      4: ['fechaInicioMuestreo', 'fechaTerminoMuestreo', 'numeroMuestras', 'numeroEnvases', 'analistaResponsable', 'lugarMuestreo'],
      5: ['tipoAnalisis'],
      6: ['equipoAlmacenamiento'],
    };

    const campos = camposPorEtapa[this.etapaActual];
    if (!campos) return true;

    let valid = true;
    campos.forEach(c => {
      const ctrl = this.form.get(c);
      if (ctrl) {
        ctrl.markAsTouched();
        if (ctrl.invalid) valid = false;
      }
    });

    if (!valid) {
      this.mostrarToast('Complete los campos obligatorios antes de continuar.', 'warning');
    }
    return valid;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // FORMULARIOS DE ANÁLISIS (Etapa 5)
  // ══════════════════════════════════════════════════════════════════════════════

  private cargarFormulariosPorTipo(tipo: string): void {
    const lista = FORMULARIOS_POR_TIPO[tipo] ?? [];
    this.formulariosCatalogo = lista.map(f => ({ ...f }));
  }

  toggleFormulario(form: FormularioAnalisis): void {
    if (form.obligatorio) return; // TPA no se puede deseleccionar
    form.seleccionado = !form.seleccionado;
  }

  get formulariosSeleccionados(): FormularioAnalisis[] {
    return this.formulariosCatalogo.filter(f => f.seleccionado);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MUESTRAS
  // ══════════════════════════════════════════════════════════════════════════════

  agregarMuestra(): void {
    const tipo = this.form.get('tipoAnalisis')!.value;
    const formularios = (FORMULARIOS_POR_TIPO[tipo] ?? []).map(f => ({ ...f }));

    this.muestras.push({
      id: this.muestraCounter++,
      nombre: `Muestra ${this.muestraCounter - 1}`,
      formularios,
    });
  }

  eliminarMuestra(id: number): void {
    this.muestras = this.muestras.filter(m => m.id !== id);
  }

  toggleFormularioMuestra(muestra: Muestra, form: FormularioAnalisis): void {
    if (form.obligatorio) return;
    form.seleccionado = !form.seleccionado;
  }

  get formulariosConsolidados(): string[] {
    const ids = new Set<string>();
    this.formulariosCatalogo.filter(f => f.seleccionado).forEach(f => ids.add(f.id));
    this.muestras.forEach(m => m.formularios.filter(f => f.seleccionado).forEach(f => ids.add(f.id)));
    return Array.from(ids);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // FLUJO Y VALIDACIÓN (Etapas 8 / 10)
  // ══════════════════════════════════════════════════════════════════════════════

  async guardarSolicitud(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      await this.mostrarAlerta(
        'Campos incompletos',
        'Existen campos obligatorios sin completar. Revise cada etapa antes de guardar.'
      );
      return;
    }

    this.solicitudGuardada = true;
    this.mostrarToast('Solicitud guardada correctamente.', 'success');
  }

  async enviarAValidacion(): Promise<void> {
    if (!this.solicitudGuardada) {
      await this.mostrarAlerta('Atención', 'Debe guardar la solicitud antes de enviarla a validación.');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Enviar a validación',
      message: '¿Confirma el envío de esta solicitud a validación? Esta acción registrará la fecha y hora exacta.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar envío',
          role: 'confirm',
          handler: () => {
            this.fechaEnvioValidacion = new Date();
            this.estadoFlujo = 'validacion';
            this.mostrarToast('Solicitud enviada a validación exitosamente.', 'success');
            this.etapaActual = 8; // Mostrar flujo
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmarCancelar(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cancelar solicitud',
      message: '¿Está seguro que desea salir? Los datos no guardados se perderán.',
      buttons: [
        { text: 'Quedarme', role: 'cancel' },
        {
          text: 'Sí, salir',
          role: 'destructive',
          handler: () => this.router.navigate(['/home'])
        }
      ]
    });
    await alert.present();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ENTREGA (Etapa 9)
  // ══════════════════════════════════════════════════════════════════════════════

  private calcularEntrega(): void {
    if (this.etapaActual < 9) return;
    const muestrasCount = this.form.get('numeroMuestras')?.value ?? 0;
    const tiempoAdicional = Math.ceil(muestrasCount / 5);
    this.tiempoEntregaDias = DIAS_BASE_ENTREGA + tiempoAdicional;

    const fechaRecepcion = this.form.get('fechaRecepcion')?.value;
    if (fechaRecepcion) {
      const base = new Date(fechaRecepcion);
      base.setDate(base.getDate() + this.tiempoEntregaDias);
      this.fechaEstimadaEntrega = base;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // HELPERS VISUALES
  // ══════════════════════════════════════════════════════════════════════════════

  campoInvalido(campo: string): boolean {
    const ctrl = this.form.get(campo);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  get badgeEstado(): { label: string; css: string } {
    const mapa: Record<string, { label: string; css: string }> = {
      borrador: { label: 'Borrador', css: 'badge-draft' },
      validacion: { label: 'En Validación', css: 'badge-pending' },
      aprobado: { label: 'Aprobado', css: 'badge-success' },
      rechazado: { label: 'Rechazado', css: 'badge-danger' },
    };
    return mapa[this.estadoFlujo];
  }

  private async mostrarAlerta(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['Entendido'] });
    await alert.present();
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await toast.present();
  }
}
