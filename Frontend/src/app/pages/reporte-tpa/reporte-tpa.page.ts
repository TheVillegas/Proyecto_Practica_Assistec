import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AliService } from 'src/app/services/ali-service';
import { CatalogosService } from 'src/app/services/catalogos.service';
import { TpaService } from 'src/app/services/tpa-service';
import { AuthService } from 'src/app/services/auth-service';
import { ImagenUploadService } from 'src/app/services/imagen-upload';
import { NavController, AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-reporte-tpa',
  templateUrl: './reporte-tpa.page.html',
  styleUrls: ['./reporte-tpa.page.scss'],
  standalone: false
})
export class ReporteTPAPage implements OnInit {

  seccionActual: String = '';
  codigoALI: string = '';
  estadoTPA: string = '';
  estadoSeleccionado: string = '';
  ultimaActualizacion: string = '';
  responsableModificacion: string = 'Usuario Actual';
  currentUser: any = null; // Store full user object
  // --- ETAPA 1 ---
  lugarAlmacenamientoEtapa1: string = '';
  observacionesEtapa1: string = '';

  // --- ETAPA 2 (Lista Dinámica) ---
  listaRepeticionesEtapa2: any[] = [
    {
      id: 0,
      responsable: "",
      fechaPreparacion: '',
      horaInicio: '',
      horaPesado: '',
      numeroMuestras: null,
      equiposSeleccionados: [],
      lugarAlmacenamiento: "",
      tipoAccion: "", // 'Retiro' | 'Pesado'
      listaMateriales: [{ id: 0, tipoMaterial: "", codigoMaterial: "" }],
      observacionesEtapa2: ""
    }
  ];
  listaRepeticionesEtapa4: any[] = [
    { id: 0, responsable: "", fecha: "", horaInicio: "", analisisARealizar: "" }
  ];
  listaMaterialSiembra: any[] = [
    { id: 0, nombre: "", codigoMaterialSiembra: "" }
  ];
  listaDiluyentes: any[] = [
    { id: 0, nombre: "", codigoDiluyente: "" }
  ];
  listaLimpieza: any[] = [];
  observacionesLimpieza: string = ''; // Etapa 3

  opcionesMateriales: any[] = [];
  listaLugares: any[] = [];
  listaResponsables: any[] = [];
  listaEquipos: any[] = [];
  opcionesMaterialSiembra: any[] = [];
  listaEquiposSiembra: any[] = [];
  otrosEquiposSiembra: string = ''; // Etapa 5
  opcionesDiluyentes: any[] = [];
  firmaCoordinador: string | null = null;
  observacionesFinales: string = ''; // Etapa 6
  formularioBloqueado: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private aliService: AliService,
    private catalogosService: CatalogosService,
    private tpaService: TpaService,
    private authService: AuthService,
    private navCtrl: NavController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private router: Router,
    private imagenUploadService: ImagenUploadService
  ) { }

  ngOnInit() {
    this.codigoALI = this.route.snapshot.paramMap.get('codigoALI')!;
    this.currentUser = this.authService.getUsuario();
    if (this.currentUser) {
      this.responsableModificacion = this.currentUser.nombreApellido || 'Usuario Actual';
    }

    // Cargar Catálogos de forma paralela
    const cargaCatalogos = forkJoin({
      materiales: this.catalogosService.getMaterialesPesados(),
      lugares: this.catalogosService.getLugaresAlmacenamiento(),
      responsables: this.catalogosService.getResponsables(),
      equipos: this.catalogosService.getEquiposInstrumentos(),
      limpieza: this.catalogosService.getChecklistLimpieza(),
      materialSiembra: this.catalogosService.getMaterialSiembra(),
      equiposSiembra: this.catalogosService.getEquiposSiembra(),
      diluyentes: this.catalogosService.getDiluyentes()
    });

    cargaCatalogos.subscribe({
      next: (res: any) => {
        this.opcionesMateriales = res.materiales;
        this.listaLugares = res.lugares;
        this.listaResponsables = res.responsables;
        this.listaEquipos = res.equipos;

        // Mapear limpieza (checklist base)
        this.listaLimpieza = res.limpieza.map((item: any) => ({
          ...item,
          seleccionado: item.defSeleccionado === 1,
          bloqueado: item.defBloqueado === 1
        }));

        this.opcionesMaterialSiembra = res.materialSiembra;

        // Mapear equipos siembra base
        this.listaEquiposSiembra = res.equiposSiembra.map((item: any) => ({ ...item, seleccionado: false }));

        this.opcionesDiluyentes = res.diluyentes;

        // Una vez cargados los catálogos, cargar el reporte si existe
        if (this.codigoALI) {
          this.cargarDatosReporte();
        }
      },
      error: (err) => {
        console.error('Error al cargar catálogos', err);
      }
    });
  }

  async cargarDatosReporte() {
    const loading = await this.loadingController.create({ message: 'Cargando reporte...' });
    await loading.present();

    const id = parseInt(this.codigoALI);

    this.tpaService.obtenerReporte(id).subscribe({
      next: (reporte: any) => {
        loading.dismiss();
        if (!reporte) return;

        this.estadoTPA = reporte.estado || 'No realizado';
        this.formularioBloqueado = this.estadoTPA === 'Verificado';
        this.ultimaActualizacion = reporte.fechaCierre || ''; // Ajustar campo
        this.responsableModificacion = reporte.usuarioCierre || 'Usuario Actual'; // Ajustar campo

        // Etapa 1
        if (reporte.etapa1) {
          this.lugarAlmacenamientoEtapa1 = reporte.etapa1.lugarAlmacenamiento || '';
          this.observacionesEtapa1 = reporte.etapa1.observaciones || '';
        }

        // Etapa 2
        if (reporte.etapa2_manipulacion && reporte.etapa2_manipulacion.length > 0) {
          this.listaRepeticionesEtapa2 = reporte.etapa2_manipulacion;
        }

        // Etapa 3 (Limpieza)
        if (reporte.etapa3_limpieza && reporte.etapa3_limpieza.checklist) {
          // Fusionar con la lista base
          this.listaLimpieza.forEach(itemBase => {
            // El reporte guardado usa "nombre", pero el catálogo usa "nombreItem"
            const itemGuardado = reporte.etapa3_limpieza.checklist.find((i: any) => i.nombre.trim() === itemBase.nombreItem.trim());
            if (itemGuardado) {
              itemBase.seleccionado = itemGuardado.seleccionado;
              itemBase.bloqueado = itemGuardado.bloqueado;
            } else {
              if (!itemBase.bloqueado) itemBase.seleccionado = false;
            }
          });
        }

        // Etapa 4
        if (reporte.etapa4_retiro && reporte.etapa4_retiro.length > 0) {
          this.listaRepeticionesEtapa4 = reporte.etapa4_retiro;
        }

        // Etapa 5
        if (reporte.etapa5_siembra) {
          if (reporte.etapa5_siembra.materiales && reporte.etapa5_siembra.materiales.length > 0) {
            this.listaMaterialSiembra = reporte.etapa5_siembra.materiales;
          }
          if (reporte.etapa5_siembra.diluyentes && reporte.etapa5_siembra.diluyentes.length > 0) {
            this.listaDiluyentes = reporte.etapa5_siembra.diluyentes;
          }
          this.otrosEquiposSiembra = reporte.etapa5_siembra.otrosEquipos || '';

          // Restaurar selección de equipos de siembra (by name mapping)
          if (reporte.etapa5_siembra.equipos) {
            this.listaEquiposSiembra.forEach(eq => {
              // El reporte usa "nombre", el catálogo "nombreEquipo"
              const savedEq = reporte.etapa5_siembra.equipos.find((s: any) => s.nombre === eq.nombreEquipo);
              if (savedEq) eq.seleccionado = savedEq.seleccionado; // o existe en array
              else eq.seleccionado = false;
            });
          }
        }

        // Etapa 6
        if (reporte.etapa6_cierre) {
          this.observacionesFinales = reporte.etapa6_cierre.observaciones || '';
          this.firmaCoordinador = (reporte.etapa6_cierre.firma && reporte.etapa6_cierre.firma !== 'Sin firma') ? reporte.etapa6_cierre.firma : null;
        }

      },
      error: async (err) => {
        loading.dismiss();
        console.error(err);
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Error al cargar el reporte.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }


  cambiarEstado(event: any) {
    this.estadoSeleccionado = event.detail.value || '';
    console.log(this.estadoSeleccionado);
  }
  //Repeticion Etapa 2
  agregarRepeticion() {
    // const nuevoID = this.listaRepeticionesEtapa2.length + 1; // ID timestamp es mejor para no duplicar
    const nuevoItem = {
      id: Date.now(),
      responsable: this.currentUser ? this.currentUser.nombreApellido : "",
      fechaPreparacion: '',
      horaPesado: '',
      numeroMuestras: null,
      equiposSeleccionados: [],
      lugarAlmacenamiento: "",
      tipoAccion: "",
      listaMateriales: [
        { id: Date.now(), tipoMaterial: '', codigoMaterial: '' }
      ],
      observacionesEtapa2: ""
    };
    this.listaRepeticionesEtapa2.push(nuevoItem);

    // Opcional: solo si quieres auto-abrir el acordeón
    console.log(this.listaRepeticionesEtapa2);
    const nuevoIndice = this.listaRepeticionesEtapa2.length - 1;
    const nombreNuevoAnalista = 'etapa2' + nuevoIndice;
    this.seccionActual = nombreNuevoAnalista;
  }
  esEquipoSeleccionado(etapaIndex: number, equipoNombre: string): boolean {
    return this.listaRepeticionesEtapa2[etapaIndex].equiposSeleccionados.includes(equipoNombre);
  }

  toggleEquipo(etapaIndex: number, equipoNombre: string) {
    const etapa = this.listaRepeticionesEtapa2[etapaIndex];
    const index = etapa.equiposSeleccionados.indexOf(equipoNombre);
    if (index > -1) {
      etapa.equiposSeleccionados.splice(index, 1);
    } else {
      etapa.equiposSeleccionados.push(equipoNombre);
    }
  }

  openDatePicker(event: any) {
    const element = event.target;
    // Si es un elemento nativo con showPicker
    if (element && typeof element.showPicker === 'function') {
      element.showPicker();
    }
    // Si es un componente Ionic (ion-input)
    else if (element && element.getInputElement) {
      element.getInputElement().then((input: HTMLInputElement) => {
        if (input && typeof input.showPicker === 'function') {
          input.showPicker();
        }
      });
    }
  }

  agregarRepeticionEtapa4() {
    const nuevoID = this.listaRepeticionesEtapa4.length + 1;
    this.listaRepeticionesEtapa4.push({
      id: nuevoID,
      responsable: this.currentUser ? this.currentUser.nombreApellido : "",
      fecha: new Date().toISOString(),
      horaInicio: new Date().toISOString(),
      analisisARealizar: ''
    })
    console.log(this.listaRepeticionesEtapa4);
    const nuevoIndice = this.listaRepeticionesEtapa4.length - 1;
    const nombreNuevoAnalista = 'etapa4' + nuevoIndice;
    this.seccionActual = nombreNuevoAnalista;
  }

  agregarMaterial(indexAnalista: number) {
    // Buscamos al analista específico y le empujamos a SU lista
    this.listaRepeticionesEtapa2[indexAnalista].listaMateriales.push({
      id: Date.now(),
      tipoMaterial: '',
      codigoMaterial: ''
    });
  }
  trackById(index: number, item: any) {
    return item.id;
  }

  agregarLimpieza(instrumento: string) {
    this.listaLimpieza.push(instrumento);
    console.log(this.listaLimpieza);
  }

  agregarMaterialSiembra() {
    const nuevoID = this.listaMaterialSiembra.length + 1;
    this.listaMaterialSiembra.push({
      id: nuevoID,
      nombre: '',
      codigoMaterialSiembra: ''
    });
    console.log(this.listaMaterialSiembra);
  }

  agregarDiluyente() {
    const nuevoID = this.listaDiluyentes.length + 1;
    this.listaDiluyentes.push({
      id: nuevoID,
      nombre: '',
      codigoDiluyente: ''
    });
  }

  /**
   * Adjunta la firma de la coordinadora usando el servicio centralizado
   */
  async adjuntarFirma() {
    const firma = await this.imagenUploadService.seleccionarImagenBase64({
      maxSize: 2 * 1024 * 1024, // 2MB para firmas
      accept: 'image/png,image/jpeg,image/jpg',
      mostrarAlertas: true
    });

    if (firma) {
      this.firmaCoordinador = firma;
      console.log('Firma adjuntada exitosamente');
    }
  }

  // --- Lógica de la Barra de Acciones ---

  async confirmarCancelar() {
    const alert = await this.alertController.create({
      header: 'Cancelar',
      message: '¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.',
      buttons: [
        {
          text: 'Continuar editando',
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: 'Salir',
          handler: () => {
            this.navCtrl.back();
          }
        }
      ]
    });
    await alert.present();
  }

  salirVerificado() {
    // Salida segura para modo solo lectura/verificado
    this.navCtrl.back();
  }

  async confirmarGuardarBorrador() {
    const alert = await this.alertController.create({
      header: 'Guardar Borrador',
      message: '¿Estás seguro de guardar el borrador? Podrás seguir editando después.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: 'Guardar',
          handler: () => {
            this.guardarReporte('Borrador');
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmarFormulario() {
    const alert = await this.alertController.create({
      header: 'Confirmar Formulario',
      message: '¿Estás seguro de confirmar? El formulario quedará BLOQUEADO y no podrás editar nada más.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: 'Confirmar y Bloquear',
          handler: () => {
            this.guardarReporte('Verificado');
          }
        }
      ]
    });
    await alert.present();
  }

  async guardarReporte(estadoDestino: 'Borrador' | 'Verificado') {
    const loading = await this.loadingController.create({ message: 'Guardando reporte...' });
    await loading.present();

    const limpiezaFiltrada = this.listaLimpieza.filter(l => l.seleccionado);
    const equiposSiembraFiltrados = this.listaEquiposSiembra.filter(e => e.seleccionado);
    // Guardamos todos los diluyentes y materiales, no solo filtrados, para permitir edición
    const diluyentes = this.listaDiluyentes;
    const materialesSiembra = this.listaMaterialSiembra;

    const datosParaGuardar = {
      codigoALI: parseInt(this.codigoALI),
      estado: estadoDestino,
      etapa1: {
        lugarAlmacenamiento: this.lugarAlmacenamientoEtapa1,
        observaciones: this.observacionesEtapa1
      },
      etapa2_manipulacion: this.listaRepeticionesEtapa2,
      etapa3_limpieza: {
        checklist: limpiezaFiltrada,
      },
      etapa4_retiro: this.listaRepeticionesEtapa4,
      etapa5_siembra: {
        materiales: materialesSiembra,
        equipos: equiposSiembraFiltrados,
        otrosEquipos: this.otrosEquiposSiembra,
        diluyentes: diluyentes
      },
      etapa6_cierre: {
        firma: this.firmaCoordinador,
        observaciones: this.observacionesFinales
      }
    };

    console.log(datosParaGuardar);
    this.tpaService.guardarReporte(datosParaGuardar).subscribe({
      next: async (resp) => {
        // Si es verificado, llamamos al endpoint de verificación para firmar/cerrar administrativamente
        if (estadoDestino === 'Verificado') {
          const datosVerif = {
            rutUsuario: this.authService.getUsuario()?.rut_analista,
            observacionesFinales: this.observacionesFinales,
            firma: this.firmaCoordinador || ''
          };

          this.tpaService.verificarReporte(parseInt(this.codigoALI), datosVerif).subscribe({
            next: async () => {
              loading.dismiss();
              const alert = await this.alertController.create({ header: 'Éxito', message: 'Reporte verificado correctamente', buttons: ['OK'] });
              await alert.present();
              this.router.navigate(['/home']);
            },
            error: async (err) => {
              loading.dismiss();
              console.error('Error al verificar', err);
              // Fallback: Se guardó pero falló verificación
              const alert = await this.alertController.create({ header: 'Atención', message: 'Reporte guardado pero hubo un error en la verificación final.', buttons: ['OK'] });
              await alert.present();
              this.router.navigate(['/home']);
            }
          });

        } else {
          loading.dismiss();
          const alert = await this.alertController.create({ header: 'Éxito', message: 'Borrador guardado correctamente', buttons: ['OK'] });
          await alert.present();
          this.router.navigate(['/home']);
        }
      },
      error: async (err) => {
        loading.dismiss();
        console.error('Error al guardar', err);
        const alert = await this.alertController.create({ header: 'Error', message: 'Error al guardar el reporte: ' + (err.error?.mensaje || err.message), buttons: ['OK'] });
        await alert.present();
      }
    });

  }

}

