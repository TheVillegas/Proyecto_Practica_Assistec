import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ToastController } from '@ionic/angular';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CatalogosService } from 'src/app/services/catalogos.service';
import {
  FormularioSeleccionadoPayload,
  PlazoEstimadoResponse,
  SolicitudIngresoPayload,
  SolicitudIngresoResponse,
  SolicitudIngresoService,
  ValidacionRevisionState,
  DashboardQueueItem
} from 'src/app/services/solicitud-ingreso.service';
import {
  CategoriaProducto,
  EquipoLaboratorio,
  FormularioAnalisisCatalogo,
  SubcategoriaProducto,
} from 'src/app/interfaces/catalogo.interfaces';
import { AuthService } from 'src/app/services/auth-service';
import { resolveSolicitudStateMeta } from '../solicitud-ingreso/solicitud-estado-families';

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

@Component({
  selector: 'app-validacion-solicitudes',
  templateUrl: './validacion-solicitudes.page.html',
  styleUrls: ['./validacion-solicitudes.page.scss'],
  standalone: false
})
export class ValidacionSolicitudesPage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private catalogosService = inject(CatalogosService);
  private solicitudService = inject(SolicitudIngresoService);
  private authService = inject(AuthService);

  readonly TOTAL_ETAPAS = 11;
  readonly NOMBRES_ETAPAS = [
    'Identificación',
    'Cliente',
    'Recepción',
    'Muestreo',
    'Análisis',
    'Envases',
    'Observaciones',
    'Derivados',
    'Flujo',
    'Entrega Supervisor',
    'Resumen',
  ];

  form!: FormGroup;
  etapaActual = 1;
  solicitudesPendientes: DashboardQueueItem[] = [];
  selectedSolicitud: SolicitudIngresoResponse | null = null;
  loading = true;
  reviewMode = true;

  solicitudId: string | null = null;
  updatedAt: string | null = null;
  codigoALI = 'Se asigna al guardar';
  numeroActa = 'Se asigna al guardar';
  estadoFlujo = 'borrador';
  fechaEnvioValidacion: string | null = null;
  plazoEstimado: PlazoEstimadoResponse | null = null;
  validacionCoordinadora: ValidacionRevisionState = { aprobada: false, rut: null, fecha: null };
  validacionJefa: ValidacionRevisionState = { aprobada: false, rut: null, fecha: null };

  categorias: CategoriaProducto[] = [];
  subcategorias: SubcategoriaProducto[] = [];
  private subcategoriasTodos: SubcategoriaProducto[] = [];
  formulariosDisponibles: FormularioAnalisisCatalogo[] = [];
  formulariosCatalogo: FormularioUI[] = [];
  equiposLaboratorio: EquipoLaboratorio[] = [];
  equiposAlmacenamiento: EquipoLaboratorio[] = [];
  analistas: ResponsableUI[] = [];
  coordinadoras: ResponsableUI[] = [];
  jefaturas: ResponsableUI[] = [];
  muestras: Muestra[] = [];

  motivoRechazo = '';
  reviewActionLoading = false;

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarCatalogos();
  }

  private inicializarFormulario(): void {
    this.form = this.fb.group({
      anioIngreso: [{ value: new Date().getFullYear(), disabled: true }],
      codigoALI: ['', Validators.required],
      numeroActa: ['', Validators.required],
      categoria: [''],
      nombreCliente: ['', Validators.required],
      direccion: ['', Validators.required],
      nombreSolicitante: ['', Validators.required],
      notasCliente: [''],
      fechaRecepcion: ['', Validators.required],
      temperatura: [null, [Validators.required]],
      idTermometro: [null, Validators.required],
      codigoEquipoManual: ['', Validators.required],
      fechaInicioMuestreo: ['', Validators.required],
      fechaTerminoMuestreo: ['', Validators.required],
      noAplicaMuestreo: [false],
      numeroMuestras: [1, [Validators.required, Validators.min(1)]],
      numeroEnvases: [1, [Validators.required, Validators.min(1)]],
      analistaResponsable: ['', Validators.required],
      lugarMuestreo: ['', Validators.required],
      instructivoMuestreo: ['No informado', Validators.required],
      subcategoria: [''],
      idLugar: [null, Validators.required],
      envasesSuministradosPor: ['Cliente', Validators.required],
      muestraCompartida: [false],
      observacionesLaboratorio: [''],
      analisisDerivadosSubcontratados: [''],
      rutCoordinadoraRecepcion: ['', Validators.required],
      rutJefaArea: ['', Validators.required],
    });

    this.form.disable();
  }

  private cargarCatalogos(): void {
    this.loading = true;
    forkJoin({
      categorias: this.catalogosService.getCategorias().pipe(catchError(() => of([]))),
      formularios: this.catalogosService.getFormulariosAnalisis().pipe(catchError(() => of([]))),
      equipos: this.catalogosService.getEquiposInstrumentos().pipe(catchError(() => of([]))),
      usuarios: this.catalogosService.getResponsables().pipe(catchError(() => of([]))),
      subcategorias: this.catalogosService.getSubcategorias().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ categorias, formularios, equipos, usuarios, subcategorias }) => {
        this.categorias = categorias.length > 0 ? categorias : [
          { idCategoria: 'fallback-alimento', nombre: 'Alimento' },
          { idCategoria: 'fallback-agua', nombre: 'Aguas' }
        ];
        this.subcategoriasTodos = subcategorias;
        this.subcategorias = subcategorias;
        
        const digitalizados = new Set([
          'TPA', 'RAM35', 'RAM', 'COLIFORMES_TOTALES', 'COLIFORMES_FECALES',
          'ECOLI_NCH3056', 'SALMONELLA_ISO', 'ENTEROBACTERIAS', 'SAUREUS', 'HONGOS_LEVADURAS'
        ]);
        const namesUI: Record<string, string> = {
          TPA: 'Trazabilidad de Pesado y Analisis',
          RAM35: 'RAM 35C',
          RAM: 'RAM',
          SALMONELLA_ISO: 'Salmonella',
          HONGOS_LEVADURAS: 'Mohos y Levaduras',
          ECOLI_NCH3056: 'E. coli',
          SAUREUS: 'S. Aureus'
        };
        
        this.formulariosDisponibles = formularios
          .filter((f) => digitalizados.has(String(f.codigo).toUpperCase()))
          .filter((f) => String(f.area).toLowerCase().includes('microbiologia') || String(f.codigo).toUpperCase() === 'TPA')
          .map((f) => ({
            ...f,
            nombreAnalisis: namesUI[String(f.codigo).toUpperCase()] ?? f.nombreAnalisis
          }));

        this.equiposLaboratorio = equipos;
        this.equiposAlmacenamiento = equipos;
        
        this.normalizarUsuarios(usuarios);
        this.cargarFormularios();
        this.cargarSolicitudesPendientes();
      },
      error: () => {
        this.cargarSolicitudesPendientes();
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

  private cargarFormularios(): void {
    this.formulariosCatalogo = this.formulariosDisponibles.map((f) => ({
      id: f.idFormularioAnalisis,
      codigo: f.codigo,
      nombre: f.nombreAnalisis,
      area: f.area,
      seleccionado: Boolean(f.generaTpaDefault),
      obligatorio: Boolean(f.generaTpaDefault)
    }));
  }

  cargarSolicitudesPendientes(): void {
    this.loading = true;
    this.solicitudService.obtenerBandejaDashboard({ family: 'under_review' }).subscribe({
      next: (res) => {
        this.solicitudesPendientes = res.items ?? [];
        this.loading = false;
      },
      error: () => {
        this.solicitudesPendientes = [];
        this.loading = false;
      }
    });
  }

  seleccionarSolicitud(item: DashboardQueueItem): void {
    this.loading = true;
    this.solicitudService.obtener(item.id_solicitud).subscribe({
      next: (solicitud) => {
        this.aplicarSolicitud(solicitud);
        this.selectedSolicitud = solicitud;
        this.motivoRechazo = '';
        this.etapaActual = 1;
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        await this.mostrarToast('No se pudo cargar la solicitud seleccionada.', 'danger');
      }
    });
  }

  deseleccionarSolicitud(): void {
    this.selectedSolicitud = null;
    this.form.reset();
    this.form.disable();
    this.cargarSolicitudesPendientes();
  }

  private aplicarSolicitud(solicitud: SolicitudIngresoResponse): void {
    this.solicitudId = solicitud.id_solicitud;
    this.updatedAt = solicitud.updated_at;
    this.codigoALI = String(solicitud.numero_ali);
    this.numeroActa = solicitud.numero_acta;
    this.estadoFlujo = (solicitud.estado as any) || 'borrador';
    this.fechaEnvioValidacion = solicitud.fecha_envio_validacion ?? null;
    this.validacionCoordinadora = this.normalizeValidationState(solicitud.validacion_coordinadora);
    this.validacionJefa = this.normalizeValidationState(solicitud.validacion_jefa);

    this.form.patchValue({
      codigoALI: solicitud.numero_ali,
      numeroActa: solicitud.numero_acta,
      categoria: solicitud.categoria?.nombre ?? '',
      nombreCliente: solicitud.cliente?.nombre ?? '',
      direccion: solicitud.direccion?.direccion ?? '',
      nombreSolicitante: solicitud.nombre_solicitante ?? '',
      notasCliente: solicitud.notas_cliente ?? '',
      fechaRecepcion: this.toLocalDateTime(solicitud.fecha_recepcion as any),
      temperatura: solicitud.temperatura ?? null,
      idTermometro: solicitud.id_termometro ?? null,
      codigoEquipoManual: solicitud.codigo_equipo_manual ?? '',
      fechaInicioMuestreo: this.toLocalDateTime(solicitud.fecha_inicio_muestreo as any),
      fechaTerminoMuestreo: this.toLocalDateTime(solicitud.fecha_termino_muestreo as any),
      noAplicaMuestreo: Boolean(solicitud.no_aplica_muestreo),
      numeroMuestras: solicitud.cantidad_muestras ?? 1,
      numeroEnvases: solicitud.cant_envases ?? 1,
      analistaResponsable: solicitud.responsable_muestreo ?? '',
      lugarMuestreo: solicitud.lugar_muestreo ?? '',
      instructivoMuestreo: solicitud.instructivo_muestreo ?? 'No informado',
      subcategoria: solicitud.subcategoria_id ?? '',
      idLugar: solicitud.id_lugar ?? null,
      envasesSuministradosPor: solicitud.envases_suministrados_por ?? 'Cliente',
      muestraCompartida: solicitud.muestra_compartida_quimica ?? false,
      observacionesLaboratorio: solicitud.observaciones_laboratorio ?? '',
      analisisDerivadosSubcontratados: solicitud.analisis_derivados_subcontratados ?? '',
      rutCoordinadoraRecepcion: solicitud.rut_coordinadora_recepcion ?? '',
      rutJefaArea: solicitud.rut_jefa_area ?? '',
    }, { emitEvent: false });

    this.cargarSubcategorias(solicitud.categoria?.nombre ?? '');
    this.cargarFormularios();

    // 1. Restaurar submuestras (antes de marcar formularios)
    if (solicitud.submuestras && solicitud.submuestras.length > 0) {
      // Índice 0 = muestra principal (ya manejada por formulariosCatalogo)
      // Índices 1+ = submuestras adicionales
      const creadas: Muestra[] = [];
      for (let i = 1; i < solicitud.submuestras.length; i++) {
        const sub = solicitud.submuestras[i];
        const codigosSubmuestra = new Set((sub.formularios ?? []).map((f: any) => f.codigo));
        const detallesSub = new Map((sub.formularios ?? []).map((f: any) => [f.codigo, f]));
        const formularios = this.formulariosDisponibles.map((f) => {
          const detalle = detallesSub.get(f.codigo);
          return {
            id: f.idFormularioAnalisis,
            codigo: f.codigo,
            nombre: f.nombreAnalisis,
            area: f.area,
            seleccionado: codigosSubmuestra.has(f.codigo) || Boolean(f.generaTpaDefault),
            obligatorio: Boolean(f.generaTpaDefault),
            acreditado: detalle?.acreditado ?? undefined,
            codigoLe: detalle?.codigo_le ?? undefined,
            metodologiaNorma: detalle?.metodologia_norma ?? undefined,
            diasNegativo: detalle?.dias_negativo ?? undefined,
            diasConfirmacion: detalle?.dias_confirmacion ?? undefined,
            cargandoDetalle: false
          };
        });
        creadas.push({
          id: i,
          nombre: sub.nombre ?? `Submuestra ${i}`,
          formularios
        });
      }
      this.muestras = creadas;
    } else if (solicitud.muestras && solicitud.muestras.length > 0) {
      // LEGACY: restaurar desde solicitud_analisis (solo TPA)
      const creadas: Muestra[] = solicitud.muestras.map((muestra: any, index: number) => {
        const formularios = this.formulariosDisponibles.map((f) => {
          const matchingAnalisis = muestra.analisis?.find((a: any) =>
            String(a.id_formulario_analisis) === String(f.idFormularioAnalisis) ||
            a.codigo_formulario === f.codigo
          );
          return {
            id: f.idFormularioAnalisis,
            codigo: f.codigo,
            nombre: f.nombreAnalisis,
            area: f.area,
            seleccionado: !!matchingAnalisis || Boolean(f.generaTpaDefault),
            obligatorio: Boolean(f.generaTpaDefault),
            acreditado: matchingAnalisis ? matchingAnalisis.acreditado : undefined,
            codigoLe: matchingAnalisis ? matchingAnalisis.codigo_le : undefined,
            metodologiaNorma: matchingAnalisis ? matchingAnalisis.metodologia_norma : undefined,
            diasNegativo: matchingAnalisis ? matchingAnalisis.dias_negativo_snapshot : undefined,
            diasConfirmacion: matchingAnalisis ? matchingAnalisis.dias_confirmacion_snapshot : undefined
          };
        });
        return {
          id: index + 1,
          nombre: `Muestra ${index + 1}`,
          formularios
        };
      });
      this.muestras = creadas;
    }

    // 2. Marcar seleccionados con detalles del metadata
    this.marcarFormulariosSeleccionados(solicitud.formularios_seleccionados ?? []);

    this.cargarPlazoEstimadoBackend();
    this.form.disable();
  }

  private marcarFormulariosSeleccionados(formulariosSeleccionados: FormularioSeleccionadoPayload[]): void {
    const codigos = new Set(formulariosSeleccionados.map((formulario) => formulario.codigo));
    const detalles = new Map(formulariosSeleccionados.map((f) => [f.codigo, f]));
    this.formulariosCatalogo = this.formulariosCatalogo.map((formulario) => {
      const detalle = detalles.get(formulario.codigo);
      return {
        ...formulario,
        seleccionado: codigos.has(formulario.codigo) || formulario.obligatorio,
        // Copiar detalles desde el metadata guardado (dias_negativo, acreditado, etc.)
        acreditado: detalle?.acreditado ?? formulario.acreditado,
        codigoLe: detalle?.codigo_le ?? formulario.codigoLe,
        metodologiaNorma: detalle?.metodologia_norma ?? formulario.metodologiaNorma,
        diasNegativo: detalle?.dias_negativo ?? formulario.diasNegativo,
        diasConfirmacion: detalle?.dias_confirmacion ?? formulario.diasConfirmacion
      };
    });
  }

  private cargarSubcategorias(categoriaNombre: string): void {
    if (!categoriaNombre) {
      this.subcategorias = [];
      return;
    }
    const categoria = this.categorias.find((c) => c.nombre === categoriaNombre);
    if (!categoria) {
      this.subcategorias = [];
      return;
    }
    this.subcategorias = this.subcategoriasTodos.filter((s) => String(s.idCategoria) === String(categoria.idCategoria));
  }

  private cargarPlazoEstimadoBackend(): void {
    const codigoAli = this.form.get('codigoALI')?.value;
    if (!codigoAli) return;
    this.solicitudService.obtenerPlazoEstimado(codigoAli).pipe(catchError(() => of(null))).subscribe((plazo) => {
      this.plazoEstimado = plazo;
    });
  }

  private normalizeValidationState(state?: ValidacionRevisionState | null): ValidacionRevisionState {
    return {
      aprobada: Boolean(state?.aprobada),
      rut: state?.rut ?? null,
      fecha: state?.fecha ?? null
    };
  }

  private toLocalDateTime(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  get progresoPorcentaje(): number {
    return Math.round(((this.etapaActual - 1) / (this.TOTAL_ETAPAS - 1)) * 100);
  }

  avanzarEtapa(): void {
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

  get formulariosConsolidados(): any[] {
    const mapa = new Map<string, any>();
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

  get tiempoEntregaNegativoDias(): number | null {
    if (this.plazoEstimado?.dias_negativo != null) return this.plazoEstimado.dias_negativo;
    const dias = this.formulariosConsolidados
      .map((formulario) => formulario.dias_negativo)
      .filter((valor): valor is number => valor !== null && valor !== undefined);
    return dias.length ? Math.max(...dias) + 1 : null;
  }

  get tiempoEntregaConfirmacionDias(): number | null {
    if (this.plazoEstimado?.dias_confirmacion != null) return this.plazoEstimado.dias_confirmacion;
    return this.tiempoEntregaNegativoDias == null ? null : this.tiempoEntregaNegativoDias + 2;
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

  get fechaEnvioInformePositivo(): Date | null {
    if (!this.fechaEstimadaEntregaConfirmacion) return null;
    return new Date(this.fechaEstimadaEntregaConfirmacion);
  }

  get fechaEnvioInformeNegativo(): Date | null {
    if (!this.fechaEstimadaEntregaNegativa) return null;
    return new Date(this.fechaEstimadaEntregaNegativa);
  }

  get badgeEstado(): ReturnType<typeof resolveSolicitudStateMeta> {
    return resolveSolicitudStateMeta(this.estadoFlujo);
  }

  get currentReviewRole(): number | null {
    const user = this.authService.getUsuario();
    const role = user?.activeRole ?? user?.primaryRole ?? user?.role ?? user?.rol;
    const parsed = Number(role);
    return Number.isInteger(parsed) ? parsed : null;
  }

  get canTakeReviewAction(): boolean {
    if (!this.selectedSolicitud || this.reviewActionLoading) {
      return false;
    }
    const stateMeta = resolveSolicitudStateMeta(this.estadoFlujo);
    if (stateMeta.family !== 'under_review') {
      return false;
    }
    if (this.currentReviewRole === 1) {
      return !this.validacionCoordinadora.aprobada;
    }
    if (this.currentReviewRole === 2) {
      return !this.validacionJefa.aprobada;
    }
    return false;
  }

  get reviewAlreadyCompletedMessage(): string | null {
    if (!this.selectedSolicitud || this.badgeEstado.family !== 'under_review') {
      return null;
    }
    if (this.currentReviewRole === 1 && this.validacionCoordinadora.aprobada) {
      return 'Tu validación como coordinadora ya fue registrada. Falta la otra aprobación.';
    }
    if (this.currentReviewRole === 2 && this.validacionJefa.aprobada) {
      return 'Tu validación como jefatura ya fue registrada. Falta la otra aprobación.';
    }
    return null;
  }

  async validarSolicitud(): Promise<void> {
    if (!this.canTakeReviewAction) return;

    const alert = await this.alertCtrl.create({
      header: 'Confirmar Validación',
      message: '¿Está seguro que desea validar esta solicitud de ingreso?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Validar',
          handler: () => {
            this.reviewActionLoading = true;
            this.solicitudService.validar(this.solicitudId!, this.updatedAt!).subscribe({
              next: async (response) => {
                this.reviewActionLoading = false;
                this.aplicarSolicitud(response);
                await this.mostrarToast('Solicitud validada correctamente.', 'success');
              },
              error: async (err) => {
                this.reviewActionLoading = false;
                await this.mostrarAlerta('Error', err?.error?.mensaje || 'No se pudo validar la solicitud.');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async rechazarSolicitud(): Promise<void> {
    if (!this.canTakeReviewAction) return;

    if (!this.motivoRechazo || !this.motivoRechazo.trim()) {
      await this.mostrarToast('Debe ingresar un motivo de rechazo.', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirmar Rechazo',
      message: '¿Está seguro que desea rechazar esta solicitud de ingreso con el motivo indicado?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          role: 'destructive',
          handler: () => {
            this.reviewActionLoading = true;
            this.solicitudService.rechazar(this.solicitudId!, this.updatedAt!, this.motivoRechazo).subscribe({
              next: async (response) => {
                this.reviewActionLoading = false;
                this.aplicarSolicitud(response);
                this.motivoRechazo = '';
                await this.mostrarToast('Solicitud rechazada correctamente.', 'success');
              },
              error: async (err) => {
                this.reviewActionLoading = false;
                await this.mostrarAlerta('Error', err?.error?.mensaje || 'No se pudo rechazar la solicitud.');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  private async mostrarAlerta(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['Entendido'] });
    await alert.present();
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await toast.present();
  }

  // Dummy event handlers for Step 5 component
  toggleFormulario(formulario: any): void {}
  agregarMuestra(): void {}
  eliminarMuestra(id: number): void {}
  toggleFormularioMuestra(muestra: any, formulario: any): void {}
}
