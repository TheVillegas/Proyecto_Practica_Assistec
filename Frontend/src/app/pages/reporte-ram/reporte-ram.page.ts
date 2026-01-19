import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent, NavController, AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AliService } from 'src/app/services/ali-service';
import { RamService } from 'src/app/services/ram-service';
import { CatalogosService } from 'src/app/services/catalogos.service';
import { ImagenUploadService } from 'src/app/services/imagen-upload';
import { AuthService } from 'src/app/services/auth-service';
import { forkJoin } from 'rxjs';
@Component({
  selector: 'app-reporte-ram',
  templateUrl: './reporte-ram.page.html',
  styleUrls: ['./reporte-ram.page.scss'],
  standalone: false
})
export class ReporteRamPage implements OnInit {

  constructor(
    private aliService: AliService, // Might still be needed if used for other things, checking... actually used for nothing based on code refactor
    private route: ActivatedRoute,
    private ramService: RamService,
    private router: Router,
    private catalogosService: CatalogosService,
    private alertController: AlertController,
    private navCtrl: NavController,
    private imagenUploadService: ImagenUploadService,
    private loadingController: LoadingController,
    private authService: AuthService
  ) { }
  seccionActual: String = '';
  codigoALI: string = '';
  estadoRAM: string = '';
  listaEquiposIncubacion: any[] = [];
  listaPipetas: any[] = [];
  listaControlAnalisis: any[] = [];
  listaResponsables: any[] = [];
  ultimaActtualizacionRam: string = '';
  responsableModificacionRam: string = '';
  currentUser: any = null;
  listaFormasCalculo: any[] = [];
  formularioBloqueado: boolean = false;

  etapa1: any = {
    horaInicioHomogenizado: '',
    agarPlateCount: null,
    equipoIncubacion: null,
    nMuestra10gr: null,
    nMuestra50gr: null,
    horaTerminoSiembraRam: ''
  };
  etapa2: any = {
    fechaInicioIncubacion: '',
    horaInicioIncubacion: '',
    responsableIncubacion: null,
    fechaFinIncubacion: '',
    horaFinIncubacion: '',
    responsableAnalisis: null
  };

  // --- ETAPA 3 (Calculo de Muestras) ---
  listaRepeticionesEtapa3: any[] = [
    {
      id: Date.now(),
      codigoALI: null,
      numeroMuestra: 1
    }
  ];

  etapa4: any = {
    controlAmbientalPesado: null,
    controlUFC: null,
    horaInicio: '',
    horaFin: '',
    temperatura: null,
    ufc: null,
    controlSiembraEcoli: null,
    blancoUfc: null
  };


  etapa5: any = {
    desfavorable: null,
    tablaPagina: null,
    limite: null,
    fechaEntrega: '',
    horaEntrega: '',
    mercado: null,
    imagenManual: null
  };

  etapa6: any = {
    duplicadoAli: '',
    analisis: 'RAM',
    duplicadoEstado: null,
    controlBlanco: '',
    controlBlancoEstado: null,
    controlSiembra: '',
    controlSiembraEstado: null
  };

  etapa7: any = {
    firmaCoordinador: null,
    observacionesFinales: '',
    formaCalculoAnalista: [],
    formaCalculoCoordinador: null
  };

  ngOnInit() {
    this.codigoALI = this.route.snapshot.paramMap.get('codigoALI')!;
    this.currentUser = this.authService.getUsuario();
    if (this.currentUser) {
      this.responsableModificacionRam = this.currentUser.nombreApellido || '';

      // Pre-fill Etapa 2 responsales only if empty (new report logic implicit or check explicit null)
      if (!this.etapa2.responsableIncubacion) {
        this.etapa2.responsableIncubacion = this.currentUser.nombreApellido;
      }
      if (!this.etapa2.responsableAnalisis) {
        this.etapa2.responsableAnalisis = this.currentUser.nombreApellido;
      }
    }

    // Cargar Catálogos
    const cargaCatalogos = forkJoin({
      equiposIncubacion: this.catalogosService.getEquiposIncubacion(),
      pipetas: this.catalogosService.getMicroPipetas(),
      responsables: this.catalogosService.getResponsables(),
      controlAnalisis: this.catalogosService.getControlAnalisis(),
      formasCalculo: this.catalogosService.getFormasCalculo()
    });

    cargaCatalogos.subscribe({
      next: (res: any) => {
        this.listaEquiposIncubacion = res.equiposIncubacion;
        this.listaPipetas = res.pipetas;
        this.listaResponsables = res.responsables;
        this.listaControlAnalisis = res.controlAnalisis;
        this.listaFormasCalculo = res.formasCalculo;

        if (this.codigoALI) {
          this.cargarDatosReporte();
        }
      },
      error: (err) => {
        console.error('Error al cargar catálogos RAM', err);
      }
    });
  }

  async cargarDatosReporte() {
    const loading = await this.loadingController.create({ message: 'Cargando reporte RAM...' });
    await loading.present();

    const id = parseInt(this.codigoALI);
    this.ramService.obtenerReporte(id).subscribe({
      next: (reporte: any) => {
        loading.dismiss();
        if (!reporte) return;

        this.estadoRAM = reporte.estado || 'No realizado';
        this.ultimaActtualizacionRam = reporte.ultimaActualizacion || ''; // Check field name from backend
        this.responsableModificacionRam = reporte.responsable || this.responsableModificacionRam; // Use loaded or current user fallback? Better use loaded if exists.

        if (this.estadoRAM === 'Verificado') {
          this.formularioBloqueado = true;
        }

        this.etapa1 = reporte.etapa1 || this.etapa1;
        this.etapa2 = reporte.etapa2 || this.etapa2;
        // If loaded etapa2 has null responsales, we might want to keep them null or fill them?
        // Usually if it's a draft, maybe we fill them? 
        // User asked: "si la guarda ns Pepito debiese aparecer el nombre de pepito" -> implies reading stored value.
        // So we trust `reporte.etapa2`. The init logic in ngOnInit handles the "new report" case (implicitly, before load).
        // Since `cargarDatosReporte` runs AFTER `ngOnInit` (inside subscribe), `this.etapa2` will be overwritten by `reporte.etapa2`.
        // If `reporte.etapa2` has nulls, they overwrite our pre-fill. This is correct behavior for VIEWING an existing report.
        // BUT if it's a "continue editing" scenario where they hadn't filled it yet?
        // Let's ensure we don't overwrite non-null values with nulls if that's a risk, but usually backend sends what was saved.
        // If it was never saved, it might be null. 
        // Let's stick to: "If saved data exists, use it. If not, use defaults".
        // `this.etapa2 = reporte.etapa2 || this.etapa2` handles this.


        // Map listaRepeticionesEtapa3 from backend response
        // Backend keys might vary, assuming 'listaRepeticionesEtapa3' or 'etapa3'
        if (reporte.listaRepeticionesEtapa3) {
          this.listaRepeticionesEtapa3 = reporte.listaRepeticionesEtapa3;
        } else if (reporte.etapa3_calculos) { // If interface name used
          this.listaRepeticionesEtapa3 = reporte.etapa3_calculos;
        }

        this.etapa4 = reporte.etapa4 || this.etapa4;
        this.etapa5 = reporte.etapa5 || this.etapa5;
        this.etapa6 = reporte.etapa6 || this.etapa6;
        this.etapa7 = reporte.etapa7 || this.etapa7;

        // Restore selections explicitly if needed (e.g. formaCalculoAnalista)
        if (!this.etapa7.formaCalculoAnalista) {
          this.etapa7.formaCalculoAnalista = this.listaFormasCalculo.filter(f => f.seleccionado);
        }
      },
      error: async (err) => {
        loading.dismiss();
        console.error(err);
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Error al cargar el reporte RAM.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  isFormaCalculoSelected(formaCalculo: any): boolean {
    if (!this.etapa7.formaCalculoAnalista) return false;
    return this.etapa7.formaCalculoAnalista.some((f: any) => f.id === formaCalculo.id);
  }

  toggleFormaCalculo(formaCalculo: any, event: any) {
    if (!this.etapa7.formaCalculoAnalista) {
      this.etapa7.formaCalculoAnalista = [];
    }

    const isChecked = event.detail.checked;

    if (isChecked) {
      if (!this.isFormaCalculoSelected(formaCalculo)) {
        this.etapa7.formaCalculoAnalista.push(formaCalculo);
      }
    } else {
      this.etapa7.formaCalculoAnalista = this.etapa7.formaCalculoAnalista.filter(
        (f: any) => f.id !== formaCalculo.id
      );
    }
  }

  /**
   * Adjunta la firma de la coordinadora usando el servicio centralizado
   */
  async adjuntarFirma() {
    const firma = await this.imagenUploadService.seleccionarImagenBase64({
      maxSize: 2 * 1024 * 1024,
      accept: 'image/png,image/jpeg,image/jpg',
      mostrarAlertas: true
    });

    if (firma) {
      this.etapa7.firmaCoordinador = firma;
      console.log('Firma adjuntada exitosamente');
    }
  }

  /**
   * Adjunta la imagen del manual de inocuidad usando el servicio centralizado
   */
  async adjuntarImagenManual() {
    const imagen = await this.imagenUploadService.seleccionarImagenBase64({
      maxSize: 5 * 1024 * 1024,
      accept: 'image/png,image/jpeg,image/jpg',
      mostrarAlertas: true
    });

    if (imagen) {
      this.etapa5.imagenManual = imagen;
      console.log('Imagen del manual adjuntada exitosamente');
    }
  }

  agregarRepeticionEtapa3() {
    const nuevoNumero = this.listaRepeticionesEtapa3.length + 1;
    this.listaRepeticionesEtapa3.push({
      id: Date.now(),
      codigoALI: null,
      numeroMuestra: nuevoNumero
    });
    const nuevoIndice = this.listaRepeticionesEtapa3.length - 1;
    const id = "etapa3" + nuevoIndice;
    this.seccionActual = id;
  }

  openImagenPicker(event: any) {
    const element = event.target;
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
            this.router.navigate(['/home']);
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmarGuardarBorrador() {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Estás seguro de guardar el borrador?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => { }
        },
        {
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
      header: 'Confirmar',
      message: '¿Estás seguro de confirmar el formulario? Quedará bloqueado.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.guardarReporte('Verificado');
          }
        }
      ]
    });
    await alert.present();
  }

  async guardarReporte(estadoDestino: 'Borrador' | 'Verificado') {
    const loading = await this.loadingController.create({ message: 'Guardando reporte RAM...' });
    await loading.present();

    const datosReporteRAM = {
      codigoALI: parseInt(this.codigoALI),
      estado: estadoDestino,
      etapa1: this.etapa1,
      etapa2: this.etapa2,
      listaRepeticionesEtapa3: this.listaRepeticionesEtapa3,
      etapa4: this.etapa4,
      etapa5: this.etapa5,
      etapa6: this.etapa6,
      etapa7: this.etapa7,
      // Metadata extra if API requires it at top level, otherwise backend handles it
    };

    this.ramService.guardarReporte(datosReporteRAM).subscribe({
      next: async (res) => {
        loading.dismiss();
        // TODO: Si es Verificado, ¿llamamos a verificar o guardar maneja todo?
        // Asumiremos que guardar actualiza estado y si es Verificado, el backend procesa cierre o nosotros llamamos endpoint extra.
        // En el caso de RAM, no vi endpoint user/verify especifico en la lista de rutas, solo `guardarReporte` y `previewCalculo`.
        // Revisar routes: `router.post('/generarReporte', reporteRAMController.guardarReporteRAM);`
        // Likely guardarReporte handles everything.

        const alert = await this.alertController.create({
          header: 'Éxito',
          message: `Reporte ${estadoDestino === 'Verificado' ? 'verificado' : 'guardado'} correctamente.`,
          buttons: ['OK']
        });
        await alert.present();
        this.router.navigate(['/home']);
      },
      error: async (err) => {
        loading.dismiss();
        console.error('Error guardar RAM', err);
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Error al guardar reporte: ' + (err.error?.mensaje || 'Error desconocido'),
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  salirVerificado() {
    this.navCtrl.back();
  }

}
