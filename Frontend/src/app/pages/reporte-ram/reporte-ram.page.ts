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
    horaTerminoSiembraRam: '',
    micropipetaUtilizada: null
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
        this.ultimaActtualizacionRam = reporte.ultimaActualizacion || '';
        this.responsableModificacionRam = reporte.responsable || this.responsableModificacionRam;

        if (this.estadoRAM === 'Verificado') {
          this.formularioBloqueado = true;
        }

        this.etapa1 = reporte.etapa1 || this.etapa1;
        this.etapa2 = reporte.etapa2 || this.etapa2;

        // Formatear fechas para input date (YYYY-MM-DD)
        if (this.etapa2.fechaInicioIncubacion) this.etapa2.fechaInicioIncubacion = this.formatDate(this.etapa2.fechaInicioIncubacion);
        if (this.etapa2.fechaFinIncubacion) this.etapa2.fechaFinIncubacion = this.formatDate(this.etapa2.fechaFinIncubacion);

        // Map listaRepeticionesEtapa3 from backend response
        if (reporte.etapa3_repeticiones) {
          this.listaRepeticionesEtapa3 = reporte.etapa3_repeticiones.map((m: any) => {
            const dil1 = m.diluciones && m.diluciones[0] ? m.diluciones[0] : null;
            const dil2 = m.diluciones && m.diluciones[1] ? m.diluciones[1] : null;

            let dupFlat = null;
            if (m.duplicado) {
              const d = m.duplicado;
              dupFlat = {
                codigoALI: d.codigoALI,
                numeroMuestraDuplicado: m.numero_Muestra,
                dilDuplicado01: d.dil01,
                dilDuplicado02: d.dil02,
                numeroColoniasDuplicado01: d.numeroColonias?.[0],
                numeroColoniasDuplicado02: d.numeroColonias?.[1],
                numeroColoniasDuplicado03: d.numeroColonias?.[2],
                numeroColoniasDuplicado04: d.numeroColonias?.[3],
                resultadoRAMDuplicado01: d.resultado_ram,
                resultadoRPESDuplicado01: d.resultado_rpes,
                disolucionDuplicado01: d.disolucion01,
                disolucionDuplicado02: d.disolucion02,
                promedioDuplicado: d.promedio,
                sumaColoniasDuplicado: d.sumaColonias,
                n1Duplicado: d.n1,
                n2Duplicado: d.n2,
                factorDilucionDuplicado: d.factorDilucion,
                codigoALIDuplicado: d.codigoALI
              };
            }

            return {
              id: Date.now() + Math.random(),
              codigoALI: reporte.codigoALI,
              numeroMuestra: m.numero_Muestra,
              dil: dil1 ? dil1.dil : '',
              dil2: dil2 ? dil2.dil : '',
              numeroColonias01: dil1 && dil1.colonias ? dil1.colonias[0] : '',
              numeroColonias02: dil1 && dil1.colonias ? dil1.colonias[1] : '',
              numeroColonias03: dil2 && dil2.colonias ? dil2.colonias[0] : '',
              numeroColonias04: dil2 && dil2.colonias ? dil2.colonias[1] : '',
              resultadoRAM01: m.resultado_ram,
              resultadoRPES01: m.resultado_rpes,
              promedio: m.promedio,
              sumaColonias: m.sumaColonias,
              n1: m.n1,
              n2: m.n2,
              factorDilucion: m.factorDilucion,
              ...dupFlat
            };
          });
        }

        if (!this.listaRepeticionesEtapa3 || this.listaRepeticionesEtapa3.length === 0) {
          this.listaRepeticionesEtapa3 = [{
            id: Date.now(),
            codigoALI: this.codigoALI,
            numeroMuestra: 1,
            numeroMuestraDuplicado: 1
          }];
        }

        this.etapa4 = reporte.etapa4 || this.etapa4;
        this.etapa5 = reporte.etapa5 || this.etapa5;

        // Formatear fecha etapa 5
        if (this.etapa5.fechaEntrega) this.etapa5.fechaEntrega = this.formatDate(this.etapa5.fechaEntrega);
        // Convertir desfavorable a string si es necesario para el segment
        if (this.etapa5.desfavorable !== null && this.etapa5.desfavorable !== undefined) {
          this.etapa5.desfavorable = String(this.etapa5.desfavorable);
        }

        this.etapa6 = reporte.etapa6 || this.etapa6;
        this.etapa7 = reporte.etapa7 || this.etapa7;

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

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return dateString.split('T')[0];
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
      codigoALI: this.codigoALI, // Pre-fill with main ALI code
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

    // Mapeo Frontend (Plano) -> Backend (Anidado) para guardar
    const etapa3_backend = this.listaRepeticionesEtapa3.map((item: any) => {
      const diluciones = [];

      // Reconstruir Diluciones
      if (item.dil) {
        diluciones.push({
          dil: item.dil,
          colonias: [item.numeroColonias01, item.numeroColonias02]
        });
      }
      if (item.dil2) {
        diluciones.push({
          dil: item.dil2,
          colonias: [item.numeroColonias03, item.numeroColonias04]
        });
      }

      // Reconstruir Duplicado (solo si existe en el item, usualmente item 0)
      let duplicado = null;
      if (item.dilDuplicado01) { // Basic check if duplicado data exists
        duplicado = {
          dil01: item.dilDuplicado01,
          dil02: item.dilDuplicado02,
          numeroColonias: [
            item.numeroColoniasDuplicado01,
            item.numeroColoniasDuplicado02,
            item.numeroColoniasDuplicado03,
            item.numeroColoniasDuplicado04
          ],
          resultado_ram: item.resultadoRAMDuplicado01,
          resultado_rpes: item.resultadoRPESDuplicado01,
          codigoALI: item.codigoALIDuplicado,
          // Nuevos campos
          promedio: item.promedioDuplicado,
          sumaColonias: item.sumaColoniasDuplicado,
          n1: item.n1Duplicado,
          n2: item.n2Duplicado,
          factorDilucion: item.factorDilucionDuplicado
        };
      }

      return {
        codigo_ali: parseInt(this.codigoALI),
        numero_Muestra: item.numeroMuestra,
        volumen: 1, // Default
        diluciones: diluciones,
        resultado_ram: item.resultadoRAM01,
        resultado_rpes: item.resultadoRPES01,
        // Nuevos campos para Muestra
        promedio: item.promedio,
        sumaColonias: item.sumaColonias,
        n1: item.n1,
        n2: item.n2,
        factorDilucion: item.factorDilucion,
        duplicado: duplicado
      };
    });

    const datosReporteRAM = {
      codigo_ali: this.codigoALI, // Send snake_case for backend controller validation
      solicitud: this.codigoALI, // Mapear solicitud a codigoALI si idSolicitud no existe, o borrar si no es necesario.
      estado: estadoDestino,
      etapa1: this.etapa1,
      etapa2: this.etapa2,
      etapa3_repeticiones: etapa3_backend, // Send nested structure
      etapa4: this.etapa4,
      etapa5: this.etapa5,
      etapa6: this.etapa6,
      etapa7: this.etapa7,
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

  // --- Lógica de Cálculo RAM ---

  async calcularMuestra(index: number, etapa3: any) {
    const loading = await this.loadingController.create({ message: 'Calculando...' });
    await loading.present();

    try {
      // Construir payload para el servicio
      const diluciones = [];

      // Primera dilución
      if (etapa3.dil !== null && etapa3.dil !== '') {
        diluciones.push({
          dil: Number(etapa3.dil),
          colonias: [etapa3.numeroColonias01, etapa3.numeroColonias02]
        });
      }

      // Segunda dilución (si existe)
      if (etapa3.dil2 !== null && etapa3.dil2 !== '') {
        diluciones.push({
          dil: Number(etapa3.dil2),
          colonias: [etapa3.numeroColonias03, etapa3.numeroColonias04]
        });
      }

      const datosCalculo = {
        volumen: 1, // Por defecto 1ml
        diluciones: diluciones
      };

      this.ramService.calcularPreview(datosCalculo).subscribe({
        next: (res: any) => {
          loading.dismiss();
          if (res && res.resultado) {
            etapa3.resultadoRAM01 = res.resultado.textoReporte; // Usamos el texto formateado
            // Si el input en HTML es type="number", esto fallará si trae "<". 
            // Se debe cambiar el HTML a type="text".
            etapa3.resultadoRPES01 = res.resultado.ufc; // Guardamos valor numérico o estimado

            // Guardar otros valores calculados útiles si el modelo lo permite
            etapa3.promedio = res.resultado.promedio;
            etapa3.sumaColonias = res.resultado.sumaColonias;
            etapa3.n1 = res.resultado.n1;
            etapa3.n2 = res.resultado.n2;
            etapa3.factorDilucion = res.resultado.factorDilucion;
          }
        },
        error: async (err) => {
          loading.dismiss();
          console.error(err);
          const alert = await this.alertController.create({
            header: 'Error de Cálculo',
            message: err.error?.mensaje || 'Error al calcular resultado.',
            buttons: ['OK']
          });
          await alert.present();
        }
      });

    } catch (e) {
      loading.dismiss();
      console.error(e);
    }
  }

  async calcularDuplicado(etapa3: any) {
    const loading = await this.loadingController.create({ message: 'Calculando Duplicado...' });
    await loading.present();

    try {
      const diluciones = [];

      // Primera dilución duplicado
      if (etapa3.dilDuplicado01 !== null && etapa3.dilDuplicado01 !== '') {
        diluciones.push({
          dil: Number(etapa3.dilDuplicado01),
          colonias: [etapa3.numeroColoniasDuplicado01, etapa3.numeroColoniasDuplicado02]
        });
      }

      // Segunda dilución duplicado
      if (etapa3.dilDuplicado02 !== null && etapa3.dilDuplicado02 !== '') {
        diluciones.push({
          dil: Number(etapa3.dilDuplicado02),
          colonias: [etapa3.numeroColoniasDuplicado03, etapa3.numeroColoniasDuplicado04]
        });
      }

      const datosCalculo = {
        volumen: 1,
        diluciones: diluciones
      };

      this.ramService.calcularPreview(datosCalculo).subscribe({
        next: (res: any) => {
          loading.dismiss();
          if (res && res.resultado) {
            etapa3.resultadoRAMDuplicado01 = res.resultado.textoReporte;
            etapa3.resultadoRPESDuplicado01 = res.resultado.ufc;

            // Guardar valores en propiedades planas para fácil binding
            etapa3.promedioDuplicado = res.resultado.promedio;
            etapa3.sumaColoniasDuplicado = res.resultado.sumaColonias;
            etapa3.n1Duplicado = res.resultado.n1;
            etapa3.n2Duplicado = res.resultado.n2;
            etapa3.factorDilucionDuplicado = res.resultado.factorDilucion;
          }
        },
        error: async (err) => {
          loading.dismiss();
          console.error(err);
          const alert = await this.alertController.create({
            header: 'Error',
            message: err.error?.mensaje || 'Error al calcular duplicado.',
            buttons: ['OK']
          });
          await alert.present();
        }
      });

    } catch (e) {
      loading.dismiss();
    }
  }

}
