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
  SolicitudIngresoPayload,
  SolicitudIngresoResponse,
  SolicitudIngresoService
} from 'src/app/services/solicitud-ingreso.service';
import {
  CategoriaProducto,
  EquipoLaboratorio,
  FormularioAnalisisCatalogo,
  LugarAlmacenamiento
} from 'src/app/interfaces/catalogo.interfaces';

interface FormularioUI {
  id: string | null;
  codigo: string;
  nombre: string;
  area: string;
  seleccionado: boolean;
  obligatorio: boolean;
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

const FALLBACK_CATEGORIAS: CategoriaProducto[] = [
  { idCategoria: 'fallback-alimento', nombre: 'Alimento' },
  { idCategoria: 'fallback-agua', nombre: 'Agua' },
  { idCategoria: 'fallback-ambiental', nombre: 'Ambiental' },
  { idCategoria: 'fallback-cosmeticos', nombre: 'Cosméticos' }
];

const FALLBACK_FORMULARIOS: FormularioAnalisisCatalogo[] = [
  { idFormularioAnalisis: 'fallback-tpa', codigo: 'TPA', nombreAnalisis: 'TPA – Técnica Placa Aerobia', area: 'Microbiología', generaTpaDefault: true },
  { idFormularioAnalisis: 'fallback-ram', codigo: 'RAM', nombreAnalisis: 'RAM – Recuento Aerobios Mesófilos', area: 'Microbiología', generaTpaDefault: false }
];

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
  estadoFlujo: 'borrador' | 'enviada' | 'devuelta' | 'validada' | 'reportes_generados' = 'borrador';
  fechaEnvioValidacion: string | null = null;
  solicitudGuardada = false;
  cargando = false;

  categorias: CategoriaProducto[] = [];
  formulariosDisponibles: FormularioAnalisisCatalogo[] = [];
  formulariosCatalogo: FormularioUI[] = [];
  equiposLaboratorio: EquipoLaboratorio[] = [];
  lugaresAlmacenamiento: LugarAlmacenamiento[] = [];
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
    this.form = this.fb.group({
      anioIngreso: [{ value: new Date().getFullYear(), disabled: true }],
      codigoALI: [{ value: '', disabled: true }],
      numeroActa: [{ value: '', disabled: true }],
      codigoExterno: [''],
      categoria: ['', Validators.required],

      nombreCliente: ['', Validators.required],
      direccion: ['', Validators.required],
      nombreSolicitante: ['', Validators.required],
      notasCliente: [''],

      fechaRecepcion: ['', Validators.required],
      temperatura: [null, [Validators.required, Validators.min(-100), Validators.max(200)]],
      idTermometro: [null, Validators.required],

      fechaInicioMuestreo: ['', Validators.required],
      fechaTerminoMuestreo: ['', Validators.required],
      numeroMuestras: [1, [Validators.required, Validators.min(1)]],
      numeroEnvases: [1, [Validators.required, Validators.min(1)]],
      analistaResponsable: ['', Validators.required],
      lugarMuestreo: ['', Validators.required],
      instructivoMuestreo: ['No informado', Validators.required],

      tipoAnalisis: [''],

      idLugar: [null, Validators.required],
      envasesSuministradosPor: ['Cliente', Validators.required],
      muestraCompartida: [false],

      observacionesLaboratorio: [''],

      rutCoordinadoraRecepcion: ['', Validators.required],
      rutJefaArea: ['', Validators.required],
    });

    this.form.get('tipoAnalisis')?.valueChanges.subscribe((area) => {
      this.cargarFormulariosPorArea(area);
    });
  }

  private cargarCatalogos(): void {
    this.cargando = true;

    forkJoin({
      categorias: this.catalogosService.getCategorias().pipe(catchError(() => of([]))),
      formularios: this.catalogosService.getFormulariosAnalisis().pipe(catchError(() => of([]))),
      equipos: this.catalogosService.getEquiposInstrumentos().pipe(catchError(() => of([]))),
      lugares: this.catalogosService.getLugaresAlmacenamiento().pipe(catchError(() => of([]))),
      usuarios: this.catalogosService.getResponsables().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ categorias, formularios, equipos, lugares, usuarios }) => {
        this.categorias = categorias.length > 0 ? categorias : FALLBACK_CATEGORIAS;
        this.formulariosDisponibles = formularios.length > 0 ? formularios : FALLBACK_FORMULARIOS;
        this.equiposLaboratorio = equipos;
        this.lugaresAlmacenamiento = lugares;
        this.normalizarUsuarios(usuarios);
        this.areasAnalisis = Array.from(new Set(this.formulariosDisponibles.map((formulario) => formulario.area).filter(Boolean)));
        this.cargarFormulariosPorArea(this.form.get('tipoAnalisis')?.value);
        this.cargarSolicitudSiCorresponde();
      },
      error: async () => {
        await this.mostrarToast('No se pudieron cargar todos los catálogos. Se aplicaron valores mínimos de respaldo.', 'warning');
        this.categorias = FALLBACK_CATEGORIAS;
        this.formulariosDisponibles = FALLBACK_FORMULARIOS;
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
  }

  private marcarFormulariosSeleccionados(formulariosSeleccionados: FormularioSeleccionadoPayload[]): void {
    const codigos = new Set(formulariosSeleccionados.map((formulario) => formulario.codigo));
    this.formulariosCatalogo = this.formulariosCatalogo.map((formulario) => ({
      ...formulario,
      seleccionado: codigos.has(formulario.codigo) || formulario.obligatorio
    }));
  }

  private buscarAreaFormulario(codigo: string): string {
    return this.formulariosDisponibles.find((formulario) => formulario.codigo === codigo)?.area ?? '';
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
      1: ['categoria'],
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
  }

  toggleFormulario(formulario: FormularioUI): void {
    if (formulario.obligatorio) return;
    formulario.seleccionado = !formulario.seleccionado;
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
  }

  get formulariosConsolidados(): FormularioSeleccionadoPayload[] {
    const mapa = new Map<string, FormularioSeleccionadoPayload>();
    const agregar = (formularios: FormularioUI[]) => {
      formularios.filter((formulario) => formulario.seleccionado).forEach((formulario) => {
        mapa.set(formulario.codigo, {
          id: formulario.id,
          codigo: formulario.codigo,
          nombre: formulario.nombre,
          genera_tpa_default: formulario.obligatorio
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

  get tiempoEntregaDias(): number {
    return 5 + Math.ceil((this.form.get('numeroMuestras')?.value || 1) / 5);
  }

  get fechaEstimadaEntrega(): Date | null {
    const fechaRecepcion = this.form.get('fechaRecepcion')?.value;
    if (!fechaRecepcion) return null;
    const base = new Date(fechaRecepcion);
    base.setDate(base.getDate() + this.tiempoEntregaDias);
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
    };

    return mapa[this.estadoFlujo] ?? mapa['borrador'];
  }

  private construirPayload(): SolicitudIngresoPayload {
    return {
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
      muestraCompartida: Boolean(this.form.get('muestraCompartida')?.value),
      envasesSuministradosPor: this.form.get('envasesSuministradosPor')?.value,
      observacionesLaboratorio: this.form.get('observacionesLaboratorio')?.value || '',
      rutJefaArea: this.form.get('rutJefaArea')?.value,
      rutCoordinadoraRecepcion: this.form.get('rutCoordinadoraRecepcion')?.value,
    };
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
