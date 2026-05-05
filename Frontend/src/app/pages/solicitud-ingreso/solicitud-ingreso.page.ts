import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ToastController } from '@ionic/angular';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  CatalogosService
} from 'src/app/services/catalogos.service';
import {
  FormularioSeleccionadoPayload,
  PlazoEstimadoResponse,
  SolicitudIngresoPayload,
  SolicitudIngresoResponse,
  SolicitudIngresoService
} from 'src/app/services/solicitud-ingreso.service';
import {
  CategoriaProducto,
  EquipoLaboratorio,
  FormularioAnalisisCatalogo,
} from 'src/app/interfaces/catalogo.interfaces';

interface FormularioUI {
  id: string | null;
  codigo: string;
  nombre: string;
  area: string;
  seleccionado: boolean;
  obligatorio: boolean;
  acreditado?: boolean;
  codigoLe?: string | null;
  metodologiaNorma?: string | null;
  diasNegativo?: number | null;
  diasConfirmacion?: number | null;
  cargandoDetalle?: boolean;
}

interface ResponsableUI {
  rut: string;
  nombre: string;
  rol: number;
}

interface Muestra {
  id: number;
  nombre: string;
  formularios: FormularioUI[];
}

interface SolicitudIngresoFormValue {
  anioIngreso: number;
  codigoALI: string;
  numeroActa: string;
  codigoExterno: string;
  categoria: string;
  nombreCliente: string;
  direccion: string;
  nombreSolicitante: string;
  notasCliente: string;
  fechaRecepcion: string;
  temperatura: number | null;
  idTermometro: number | null;
  fechaInicioMuestreo: string;
  fechaTerminoMuestreo: string;
  numeroMuestras: number;
  numeroEnvases: number;
  analistaResponsable: string;
  lugarMuestreo: string;
  instructivoMuestreo: string;
  tipoAnalisis: string;
  idLugar: number | null;
  envasesSuministradosPor: string;
  muestraCompartida: boolean;
  observacionesLaboratorio: string;
  rutCoordinadoraRecepcion: string;
  rutJefaArea: string;
}

const FALLBACK_CATEGORIAS: CategoriaProducto[] = [
  { idCategoria: 'fallback-alimento', nombre: 'Alimento' },
  { idCategoria: 'fallback-agua', nombre: 'Aguas' },
  { idCategoria: 'fallback-harinas', nombre: 'Harinas' },
  { idCategoria: 'fallback-hidrobiologicos', nombre: 'Productos Hidrobiologicos' }
];

const FALLBACK_FORMULARIOS: FormularioAnalisisCatalogo[] = [
  { idFormularioAnalisis: 'fallback-tpa', codigo: 'TPA', nombreAnalisis: 'Trazabilidad de Pesado y Analisis', area: 'ASISTEC', generaTpaDefault: true },
  { idFormularioAnalisis: 'fallback-ram', codigo: 'RAM35', nombreAnalisis: 'RAM 35C', area: 'Microbiologia', generaTpaDefault: false },
  { idFormularioAnalisis: 'fallback-coliformes-totales', codigo: 'COLIFORMES_TOTALES', nombreAnalisis: 'Coliformes totales', area: 'Microbiologia', generaTpaDefault: false },
  { idFormularioAnalisis: 'fallback-coliformes-fecales', codigo: 'COLIFORMES_FECALES', nombreAnalisis: 'Coliformes fecales', area: 'Microbiologia', generaTpaDefault: false },
  { idFormularioAnalisis: 'fallback-ecoli', codigo: 'ECOLI_NCH3056', nombreAnalisis: 'E. coli', area: 'Microbiologia', generaTpaDefault: false },
  { idFormularioAnalisis: 'fallback-salmonella', codigo: 'SALMONELLA_ISO', nombreAnalisis: 'Salmonella', area: 'Microbiologia', generaTpaDefault: false },
  { idFormularioAnalisis: 'fallback-enterobacterias', codigo: 'ENTEROBACTERIAS', nombreAnalisis: 'Enterobacterias', area: 'Microbiologia', generaTpaDefault: false },
  { idFormularioAnalisis: 'fallback-saureus', codigo: 'SAUREUS', nombreAnalisis: 'Staphylococcus aureus', area: 'Microbiologia', generaTpaDefault: false },
  { idFormularioAnalisis: 'fallback-mohos-levaduras', codigo: 'HONGOS_LEVADURAS', nombreAnalisis: 'Mohos y Levaduras', area: 'Microbiologia', generaTpaDefault: false }
];

const CATEGORIAS_PROYECTO = ['agua', 'alimento', 'harina', 'hidrobiologico', 'hidrobiológicos'];
const FORMULARIOS_DIGITALIZADOS = new Set([
  'TPA',
  'RAM35',
  'RAM',
  'COLIFORMES_TOTALES',
  'COLIFORMES_FECALES',
  'ECOLI_NCH3056',
  'SALMONELLA_ISO',
  'ENTEROBACTERIAS',
  'SAUREUS',
  'HONGOS_LEVADURAS'
]);

const NOMBRES_FORMULARIOS_UI: Record<string, string> = {
  TPA: 'Trazabilidad de Pesado y Analisis',
  RAM35: 'RAM 35C',
  RAM: 'RAM',
  SALMONELLA_ISO: 'Salmonella',
  HONGOS_LEVADURAS: 'Mohos y Levaduras',
  ECOLI_NCH3056: 'E. coli'
};

@Component({
  selector: 'app-solicitud-ingreso',
  templateUrl: './solicitud-ingreso.page.html',
  styleUrls: ['./solicitud-ingreso.page.scss'],
  standalone: false,
})
export class SolicitudIngresoPage implements OnInit {
  readonly TOTAL_ETAPAS = 10;
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

  form!: FormGroup;
  etapaActual = 1;
  solicitudId: string | null = null;
  updatedAt: string | null = null;
  codigoALI = 'Se asigna al guardar';
  numeroActa = 'Se asigna al guardar';
  estadoFlujo: 'borrador' | 'enviado' | 'rechazado' | 'validado' | 'convertido_muestras' | 'enviada' | 'devuelta' | 'validada' | 'reportes_generados' = 'borrador';
  fechaEnvioValidacion: string | null = null;
  plazoEstimado: PlazoEstimadoResponse | null = null;
  solicitudGuardada = false;
  cargando = false;

  categorias: CategoriaProducto[] = [];
  formulariosDisponibles: FormularioAnalisisCatalogo[] = [];
  formulariosCatalogo: FormularioUI[] = [];
  equiposLaboratorio: EquipoLaboratorio[] = [];
  equiposAlmacenamiento: EquipoLaboratorio[] = [];
  analistas: ResponsableUI[] = [];
  coordinadoras: ResponsableUI[] = [];
  jefaturas: ResponsableUI[] = [];
  areasAnalisis: string[] = [];
  muestras: Muestra[] = [];
  private muestraCounter = 1;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private catalogosService: CatalogosService,
    private solicitudIngresoService: SolicitudIngresoService,
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarCatalogos();
  }

  private inicializarFormulario(): void {
    const inicial = this.valoresInicialesFormulario();

    this.form = this.fb.group({
      anioIngreso: [{ value: inicial.anioIngreso, disabled: true }],
      codigoALI: [inicial.codigoALI, [Validators.required, Validators.min(1)]],
      numeroActa: [inicial.numeroActa, Validators.required],
      codigoExterno: [inicial.codigoExterno],
      categoria: [inicial.categoria, Validators.required],

      nombreCliente: [inicial.nombreCliente, Validators.required],
      direccion: [inicial.direccion, Validators.required],
      nombreSolicitante: [inicial.nombreSolicitante, Validators.required],
      notasCliente: [inicial.notasCliente],

      fechaRecepcion: [inicial.fechaRecepcion, Validators.required],
      temperatura: [inicial.temperatura, [Validators.required, Validators.min(-100), Validators.max(200)]],
      idTermometro: [inicial.idTermometro, Validators.required],

      fechaInicioMuestreo: [inicial.fechaInicioMuestreo, Validators.required],
      fechaTerminoMuestreo: [inicial.fechaTerminoMuestreo, Validators.required],
      numeroMuestras: [inicial.numeroMuestras, [Validators.required, Validators.min(1)]],
      numeroEnvases: [inicial.numeroEnvases, [Validators.required, Validators.min(1)]],
      analistaResponsable: [inicial.analistaResponsable, Validators.required],
      lugarMuestreo: [inicial.lugarMuestreo, Validators.required],
      instructivoMuestreo: [inicial.instructivoMuestreo, Validators.required],

      tipoAnalisis: [inicial.tipoAnalisis],

      idLugar: [inicial.idLugar, Validators.required],
      envasesSuministradosPor: [inicial.envasesSuministradosPor, Validators.required],
      muestraCompartida: [inicial.muestraCompartida],

      observacionesLaboratorio: [inicial.observacionesLaboratorio],

      rutCoordinadoraRecepcion: [inicial.rutCoordinadoraRecepcion, Validators.required],
      rutJefaArea: [inicial.rutJefaArea, Validators.required],
    });

    this.form.get('tipoAnalisis')?.valueChanges.subscribe((area) => {
      this.cargarFormulariosPorArea(area);
    });

    this.form.get('codigoALI')?.valueChanges.subscribe((valor) => {
      this.codigoALI = valor ? String(valor) : 'Pendiente';
      this.plazoEstimado = null;
    });

    this.form.get('numeroActa')?.valueChanges.subscribe((valor) => {
      this.numeroActa = valor ? String(valor) : 'Pendiente';
    });

    this.form.get('categoria')?.valueChanges.subscribe(() => {
      this.plazoEstimado = null;
      this.refrescarDetallesFormularios();
    });
  }

  private valoresInicialesFormulario(): SolicitudIngresoFormValue {
    return {
      anioIngreso: new Date().getFullYear(),
      codigoALI: '',
      numeroActa: '',
      codigoExterno: '',
      categoria: '',
      nombreCliente: '',
      direccion: '',
      nombreSolicitante: '',
      notasCliente: '',
      fechaRecepcion: '',
      temperatura: null,
      idTermometro: null,
      fechaInicioMuestreo: '',
      fechaTerminoMuestreo: '',
      numeroMuestras: 1,
      numeroEnvases: 1,
      analistaResponsable: '',
      lugarMuestreo: '',
      instructivoMuestreo: 'No informado',
      tipoAnalisis: '',
      idLugar: null,
      envasesSuministradosPor: 'Cliente',
      muestraCompartida: false,
      observacionesLaboratorio: '',
      rutCoordinadoraRecepcion: '',
      rutJefaArea: '',
    };
  }

  private cargarCatalogos(): void {
    this.cargando = true;

    forkJoin({
      categorias: this.catalogosService.getCategorias().pipe(catchError(() => of([]))),
      formularios: this.catalogosService.getFormulariosAnalisis().pipe(catchError(() => of([]))),
      equipos: this.catalogosService.getEquiposInstrumentos().pipe(catchError(() => of([]))),
      usuarios: this.catalogosService.getResponsables().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ categorias, formularios, equipos, usuarios }) => {
        this.categorias = this.filtrarCategoriasProyecto(categorias.length > 0 ? categorias : FALLBACK_CATEGORIAS);
        this.formulariosDisponibles = this.filtrarFormulariosDigitalizados(formularios.length > 0 ? formularios : FALLBACK_FORMULARIOS);
        this.equiposLaboratorio = equipos;
        this.equiposAlmacenamiento = equipos;
        if (equipos.length === 0) {
          this.form.get('idTermometro')?.setErrors({ catalogoVacio: true });
          this.form.get('idLugar')?.setErrors({ catalogoVacio: true });
          this.mostrarToast('No hay equipos de laboratorio cargados. Aplicá los seeds de BD_AsisTec antes de probar.', 'warning');
        }
        this.normalizarUsuarios(usuarios);
        this.areasAnalisis = Array.from(new Set(this.formulariosDisponibles.map((formulario) => formulario.area).filter(Boolean)));
        this.cargarFormulariosPorArea(this.form.get('tipoAnalisis')?.value);
        this.cargarSolicitudSiCorresponde();
      },
      error: async () => {
        await this.mostrarToast('No se pudieron cargar todos los catálogos. Se aplicaron valores mínimos de respaldo.', 'warning');
        this.categorias = this.filtrarCategoriasProyecto(FALLBACK_CATEGORIAS);
        this.formulariosDisponibles = this.filtrarFormulariosDigitalizados(FALLBACK_FORMULARIOS);
        this.areasAnalisis = Array.from(new Set(this.formulariosDisponibles.map((formulario) => formulario.area)));
        this.cargarFormulariosPorArea('');
        this.cargarSolicitudSiCorresponde();
      }
    });
  }

  private normalizarUsuarios(usuarios: any[]): void {
    const normalizados: ResponsableUI[] = usuarios.map((usuario) => ({
      rut: usuario.rut ?? usuario.rutUsuario,
      nombre: usuario.nombreApellido ?? usuario.nombreApellidoUsuario ?? usuario.nombre ?? 'Usuario',
      rol: Number(usuario.rol ?? usuario.rolUsuario ?? 0)
    }));

    this.analistas = normalizados.filter((usuario) => usuario.rol === 0);
    this.coordinadoras = normalizados.filter((usuario) => usuario.rol === 1);
    this.jefaturas = normalizados.filter((usuario) => usuario.rol === 2);
  }

  private cargarSolicitudSiCorresponde(): void {
    const id = this.route.snapshot.queryParamMap.get('id');
    if (!id) {
      this.cargando = false;
      return;
    }

    this.solicitudIngresoService.obtener(id).subscribe({
      next: (solicitud) => {
        this.aplicarSolicitud(solicitud);
        this.cargando = false;
      },
      error: async () => {
        this.cargando = false;
        await this.mostrarToast('No se pudo cargar la solicitud solicitada.', 'danger');
      }
    });
  }

  private aplicarSolicitud(solicitud: SolicitudIngresoResponse): void {
    this.solicitudId = solicitud.id_solicitud;
    this.updatedAt = solicitud.updated_at;
    this.codigoALI = String(solicitud.numero_ali);
    this.numeroActa = solicitud.numero_acta;
    this.estadoFlujo = (solicitud.estado as any) || 'borrador';
    this.fechaEnvioValidacion = solicitud.fecha_envio_validacion ?? null;
    this.solicitudGuardada = true;

    this.form.patchValue({
      codigoALI: solicitud.numero_ali,
      numeroActa: solicitud.numero_acta,
      codigoExterno: solicitud.codigo_externo,
      categoria: solicitud.categoria?.nombre ?? '',
      nombreCliente: solicitud.cliente?.nombre ?? '',
      direccion: solicitud.direccion?.direccion ?? '',
      nombreSolicitante: solicitud.nombre_solicitante ?? '',
      notasCliente: solicitud.notas_cliente ?? '',
      fechaRecepcion: this.toLocalDateTime(solicitud.fecha_recepcion as any),
      temperatura: solicitud.temperatura ?? null,
      idTermometro: solicitud.id_termometro ?? null,
      fechaInicioMuestreo: this.toLocalDateTime(solicitud.fecha_inicio_muestreo as any),
      fechaTerminoMuestreo: this.toLocalDateTime(solicitud.fecha_termino_muestreo as any),
      numeroMuestras: solicitud.cantidad_muestras ?? 1,
      numeroEnvases: solicitud.cant_envases ?? 1,
      analistaResponsable: solicitud.responsable_muestreo ?? '',
      lugarMuestreo: solicitud.lugar_muestreo ?? '',
      instructivoMuestreo: solicitud.instructivo_muestreo ?? 'No informado',
      idLugar: solicitud.id_lugar ?? null,
      envasesSuministradosPor: solicitud.envases_suministrados_por ?? 'Cliente',
      muestraCompartida: solicitud.muestra_compartida_quimica ?? false,
      observacionesLaboratorio: solicitud.observaciones_laboratorio ?? '',
      rutCoordinadoraRecepcion: solicitud.rut_coordinadora_recepcion ?? '',
      rutJefaArea: solicitud.rut_jefa_area ?? '',
    });

    const areas = solicitud.formularios_seleccionados?.map((formulario) => this.buscarAreaFormulario(formulario.codigo)) ?? [];
    this.form.patchValue({
      tipoAnalisis: areas.find(Boolean) ?? ''
    }, { emitEvent: false });
    this.cargarFormulariosPorArea(this.form.get('tipoAnalisis')?.value);
    this.marcarFormulariosSeleccionados(solicitud.formularios_seleccionados ?? []);
    this.cargarPlazoEstimadoBackend();
  }

  private marcarFormulariosSeleccionados(formulariosSeleccionados: FormularioSeleccionadoPayload[]): void {
    const codigos = new Set(formulariosSeleccionados.map((formulario) => formulario.codigo));
    this.formulariosCatalogo = this.formulariosCatalogo.map((formulario) => ({
      ...formulario,
      seleccionado: codigos.has(formulario.codigo) || formulario.obligatorio
    }));
    this.refrescarDetallesFormularios();
  }

  private buscarAreaFormulario(codigo: string): string {
    return this.formulariosDisponibles.find((formulario) => formulario.codigo === codigo)?.area ?? '';
  }

  private filtrarCategoriasProyecto(categorias: CategoriaProducto[]): CategoriaProducto[] {
    const filtradas = categorias.filter((categoria) => {
      const nombre = this.normalizarTexto(categoria.nombre);
      return CATEGORIAS_PROYECTO.some((permitida) => nombre.includes(this.normalizarTexto(permitida)));
    });

    return filtradas.length > 0 ? filtradas : FALLBACK_CATEGORIAS;
  }

  private filtrarFormulariosDigitalizados(formularios: FormularioAnalisisCatalogo[]): FormularioAnalisisCatalogo[] {
    return formularios
      .filter((formulario) => FORMULARIOS_DIGITALIZADOS.has(String(formulario.codigo).toUpperCase()))
      .map((formulario) => ({
        ...formulario,
        nombreAnalisis: NOMBRES_FORMULARIOS_UI[String(formulario.codigo).toUpperCase()] ?? formulario.nombreAnalisis
      }));
  }

  private normalizarTexto(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  get progresoPorcentaje(): number {
    return Math.round(((this.etapaActual - 1) / (this.TOTAL_ETAPAS - 1)) * 100);
  }

  avanzarEtapa(): void {
    if (!this.validarEtapaActual()) return;
    if (this.etapaActual < this.TOTAL_ETAPAS) {
      this.etapaActual++;
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
      1: ['codigoALI', 'numeroActa', 'categoria'],
      2: ['nombreCliente', 'direccion', 'nombreSolicitante'],
      3: ['fechaRecepcion', 'temperatura', 'idTermometro'],
      4: ['fechaInicioMuestreo', 'fechaTerminoMuestreo', 'numeroMuestras', 'numeroEnvases', 'analistaResponsable', 'lugarMuestreo', 'instructivoMuestreo'],
      6: ['idLugar', 'envasesSuministradosPor'],
      8: ['rutCoordinadoraRecepcion', 'rutJefaArea']
    };

    const campos = camposPorEtapa[this.etapaActual];
    if (!campos) return true;

    let valido = true;
    campos.forEach((campo) => {
      const control = this.form.get(campo);
      control?.markAsTouched();
      if (control?.invalid) {
        valido = false;
      }
    });

    if (this.etapaActual === 5 && this.formulariosConsolidados.length === 0) {
      valido = false;
    }

    if (!valido) {
      this.mostrarToast('Complete los campos obligatorios antes de continuar.', 'warning');
    }

    return valido;
  }

  private cargarFormulariosPorArea(areaSeleccionada: string): void {
    const catalogo = this.formulariosDisponibles
      .filter((formulario) => !areaSeleccionada || formulario.area === areaSeleccionada)
      .map((formulario) => ({
        id: formulario.idFormularioAnalisis,
        codigo: formulario.codigo,
        nombre: formulario.nombreAnalisis,
        area: formulario.area,
        seleccionado: Boolean(formulario.generaTpaDefault),
        obligatorio: Boolean(formulario.generaTpaDefault)
      }));

    this.formulariosCatalogo = catalogo;
    this.muestras = [];
    this.muestraCounter = 1;
    this.refrescarDetallesFormularios();
  }

  toggleFormulario(formulario: FormularioUI): void {
    if (formulario.obligatorio) return;
    formulario.seleccionado = !formulario.seleccionado;
    this.cargarDetalleFormulario(formulario);
    this.plazoEstimado = null;
  }

  agregarMuestra(): void {
    const formularios = this.formulariosCatalogo.map((formulario) => ({ ...formulario }));
    this.muestras.push({
      id: this.muestraCounter,
      nombre: `Muestra ${this.muestraCounter}`,
      formularios
    });
    this.muestraCounter++;
  }

  eliminarMuestra(id: number): void {
    this.muestras = this.muestras.filter((muestra) => muestra.id !== id);
  }

  toggleFormularioMuestra(_muestra: Muestra, formulario: FormularioUI): void {
    if (formulario.obligatorio) return;
    formulario.seleccionado = !formulario.seleccionado;
    this.cargarDetalleFormulario(formulario);
    this.plazoEstimado = null;
  }

  get formulariosConsolidados(): FormularioSeleccionadoPayload[] {
    const mapa = new Map<string, FormularioSeleccionadoPayload>();
    const agregar = (formularios: FormularioUI[]) => {
      formularios.filter((formulario) => formulario.seleccionado).forEach((formulario) => {
        mapa.set(formulario.codigo, {
          id: formulario.id,
          codigo: formulario.codigo,
          nombre: formulario.nombre,
          genera_tpa_default: formulario.obligatorio,
          acreditado: formulario.acreditado,
          codigo_le: formulario.codigoLe ?? null,
          metodologia_norma: formulario.metodologiaNorma ?? null,
          dias_negativo: formulario.diasNegativo ?? null,
          dias_confirmacion: formulario.diasConfirmacion ?? null
        });
      });
    };

    agregar(this.formulariosCatalogo);
    this.muestras.forEach((muestra) => agregar(muestra.formularios));

    return Array.from(mapa.values());
  }

  async guardarSolicitud(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.formulariosConsolidados.length === 0) {
      await this.mostrarAlerta(
        'Campos incompletos',
        'Existen campos obligatorios sin completar o no hay formularios seleccionados.'
      );
      return;
    }

    const payload = this.construirPayload();
    this.cargando = true;

    const request$ = this.solicitudId && this.updatedAt
      ? this.solicitudIngresoService.actualizar(this.solicitudId, payload, this.updatedAt)
      : this.solicitudIngresoService.crear(payload);

    request$.subscribe({
      next: async (response) => {
        this.aplicarSolicitud(response);
        this.cargando = false;
        await this.mostrarToast('Solicitud guardada correctamente.', 'success');
      },
      error: async (error) => {
        this.cargando = false;
        await this.mostrarAlerta('Error', error?.error?.mensaje || 'No se pudo guardar la solicitud.');
      }
    });
  }

  async enviarAValidacion(): Promise<void> {
    if (!this.solicitudId || !this.updatedAt) {
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
            this.cargando = true;
            this.solicitudIngresoService.enviarValidacion(this.solicitudId!, this.updatedAt!).subscribe({
              next: async (response) => {
                this.aplicarSolicitud(response);
                this.cargando = false;
                this.etapaActual = 8;
                await this.mostrarToast('Solicitud enviada a validación exitosamente.', 'success');
              },
              error: async (error) => {
                this.cargando = false;
                await this.mostrarAlerta('Error', error?.error?.mensaje || 'No se pudo enviar la solicitud a validación.');
              }
            });
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

  nuevaSolicitud(): void {
    this.solicitudId = null;
    this.updatedAt = null;
    this.codigoALI = 'Pendiente';
    this.numeroActa = 'Pendiente';
    this.estadoFlujo = 'borrador';
    this.fechaEnvioValidacion = null;
    this.plazoEstimado = null;
    this.solicitudGuardada = false;
    this.etapaActual = 1;

    this.form.reset(this.valoresInicialesFormulario());
    this.form.get('anioIngreso')?.disable({ emitEvent: false });
    this.form.markAsPristine();
    this.form.markAsUntouched();

    this.cargarFormulariosPorArea('');
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  get tiempoEntregaNegativoDias(): number | null {
    if (this.plazoEstimado?.dias_negativo != null) return this.plazoEstimado.dias_negativo;
    const dias = this.formulariosConsolidados
      .map((formulario) => formulario.dias_negativo)
      .filter((valor): valor is number => valor !== null && valor !== undefined);
    return dias.length ? Math.max(...dias) + 1 : null;
  }

  get tiempoEntregaConfirmacionDias(): number | null {
    if (this.plazoEstimado?.dias_confirmacion != null) return this.plazoEstimado.dias_confirmacion;
    const dias = this.formulariosConsolidados
      .map((formulario) => formulario.dias_confirmacion)
      .filter((valor): valor is number => valor !== null && valor !== undefined);
    return dias.length ? Math.max(...dias) + 1 : null;
  }

  get fechaEstimadaEntregaNegativa(): Date | null {
    if (this.plazoEstimado?.fecha_entrega_neg) return new Date(this.plazoEstimado.fecha_entrega_neg);
    const fechaRecepcion = this.form.get('fechaRecepcion')?.value;
    if (!fechaRecepcion || this.tiempoEntregaNegativoDias == null) return null;
    const base = new Date(fechaRecepcion);
    base.setDate(base.getDate() + this.tiempoEntregaNegativoDias);
    return base;
  }

  get fechaEstimadaEntregaConfirmacion(): Date | null {
    if (this.plazoEstimado?.fecha_entrega_pos) return new Date(this.plazoEstimado.fecha_entrega_pos);
    const fechaRecepcion = this.form.get('fechaRecepcion')?.value;
    if (!fechaRecepcion || this.tiempoEntregaConfirmacionDias == null) return null;
    const base = new Date(fechaRecepcion);
    base.setDate(base.getDate() + this.tiempoEntregaConfirmacionDias);
    return base;
  }

  campoInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get badgeEstado(): { label: string; css: string } {
    const mapa: Record<string, { label: string; css: string }> = {
      borrador: { label: 'Borrador', css: 'badge-draft' },
      enviada: { label: 'En Validación', css: 'badge-pending' },
      devuelta: { label: 'Devuelta', css: 'badge-danger' },
      validada: { label: 'Validada', css: 'badge-success' },
      reportes_generados: { label: 'Reportes generados', css: 'badge-success' }
      ,
      enviado: { label: 'En ValidaciÃ³n', css: 'badge-pending' },
      rechazado: { label: 'Rechazada', css: 'badge-danger' },
      validado: { label: 'Validada', css: 'badge-success' },
      convertido_muestras: { label: 'Convertida a muestras', css: 'badge-success' }
    };

    return mapa[this.estadoFlujo] ?? mapa['borrador'];
  }

  private construirPayload(): SolicitudIngresoPayload {
    return {
      codigoALI: Number(this.form.get('codigoALI')?.value),
      numeroActa: this.form.get('numeroActa')?.value,
      categoriaId: this.categoriaSeleccionada()?.idCategoria ?? '',
      codigoExterno: this.form.get('codigoExterno')?.value || '',
      categoria: this.form.get('categoria')?.value,
      nombreCliente: this.form.get('nombreCliente')?.value,
      direccion: this.form.get('direccion')?.value,
      nombreSolicitante: this.form.get('nombreSolicitante')?.value,
      notasCliente: this.form.get('notasCliente')?.value || '',
      fechaRecepcion: this.form.get('fechaRecepcion')?.value,
      temperatura: Number(this.form.get('temperatura')?.value),
      idTermometro: Number(this.form.get('idTermometro')?.value),
      fechaInicioMuestreo: this.form.get('fechaInicioMuestreo')?.value,
      fechaTerminoMuestreo: this.form.get('fechaTerminoMuestreo')?.value,
      numeroMuestras: Number(this.form.get('numeroMuestras')?.value),
      numeroEnvases: Number(this.form.get('numeroEnvases')?.value),
      analistaResponsable: this.form.get('analistaResponsable')?.value,
      lugarMuestreo: this.form.get('lugarMuestreo')?.value,
      instructivoMuestreo: this.form.get('instructivoMuestreo')?.value,
      formularios: this.formulariosConsolidados,
      idLugar: Number(this.form.get('idLugar')?.value),
      idEquipoAlmacenamiento: Number(this.form.get('idLugar')?.value),
      muestraCompartida: Boolean(this.form.get('muestraCompartida')?.value),
      envasesSuministradosPor: this.form.get('envasesSuministradosPor')?.value,
      observacionesLaboratorio: this.form.get('observacionesLaboratorio')?.value || '',
      rutJefaArea: this.form.get('rutJefaArea')?.value,
      rutCoordinadoraRecepcion: this.form.get('rutCoordinadoraRecepcion')?.value,
    };
  }

  private categoriaSeleccionada(): CategoriaProducto | undefined {
    const valor = this.form.get('categoria')?.value;
    return this.categorias.find((categoria) => categoria.nombre === valor || categoria.idCategoria === valor);
  }

  private refrescarDetallesFormularios(): void {
    this.formulariosCatalogo.forEach((formulario) => this.cargarDetalleFormulario(formulario));
    this.muestras.forEach((muestra) => muestra.formularios.forEach((formulario) => this.cargarDetalleFormulario(formulario)));
  }

  private cargarDetalleFormulario(formulario: FormularioUI): void {
    if (!formulario.seleccionado || !formulario.id) return;
    const categoria = this.categoriaSeleccionada();
    if (!categoria?.idCategoria || String(categoria.idCategoria).startsWith('fallback')) return;

    formulario.cargandoDetalle = true;
    this.solicitudIngresoService.resolverAnalisis(categoria.idCategoria, formulario.id).subscribe({
      next: (detalle) => {
        formulario.acreditado = detalle.acreditado;
        formulario.codigoLe = detalle.codigo_le;
        formulario.metodologiaNorma = detalle.metodologia_norma;
        formulario.diasNegativo = detalle.dias_negativo;
        formulario.diasConfirmacion = detalle.dias_confirmacion;
        formulario.cargandoDetalle = false;
      },
      error: () => {
        formulario.acreditado = false;
        formulario.codigoLe = null;
        formulario.metodologiaNorma = null;
        formulario.diasNegativo = null;
        formulario.diasConfirmacion = null;
        formulario.cargandoDetalle = false;
      }
    });
  }

  private cargarPlazoEstimadoBackend(): void {
    const codigoAli = this.form.get('codigoALI')?.value;
    if (!codigoAli) return;
    this.solicitudIngresoService.obtenerPlazoEstimado(codigoAli).pipe(catchError(() => of(null))).subscribe((plazo) => {
      this.plazoEstimado = plazo;
    });
  }

  private toLocalDateTime(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
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
