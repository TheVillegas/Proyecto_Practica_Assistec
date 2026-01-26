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
import { Etapa1, Etapa2, Etapa3Item, Etapa4, Etapa5, Etapa6, Etapa7, ReporteRAM } from 'src/app/interfaces/reporte-ram.interface';
import { EquipoIncubacion, Micropipeta, Responsable, TipoAnalisis, FormaCalculo } from 'src/app/interfaces/catalogo.interfaces';
import { RamAdapter } from 'src/app/adapters/ram.adapter';

@Component({
  selector: 'app-reporte-ram',
  templateUrl: './reporte-ram.page.html',
  styleUrls: ['./reporte-ram.page.scss'],
  standalone: false
})
export class ReporteRamPage implements OnInit {

  constructor(
    private aliService: AliService,
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

  // ... (properties remain) 
  seccionActual: string = '';
  codigoALI: string = '';
  estadoRAM: string = '';
  listaEquiposIncubacion: EquipoIncubacion[] = [];
  listaPipetas: Micropipeta[] = [];
  listaControlAnalisis: TipoAnalisis[] = [];
  listaResponsables: Responsable[] = [];
  ultimaActtualizacionRam: string = '';
  responsableModificacionRam: string = '';
  currentUser: any = null; // Autenticacion usuario puede quedar any por ahora o tiparlo despues
  listaFormasCalculo: FormaCalculo[] = [];
  formularioBloqueado: boolean = false;

  etapa1: Etapa1 = {
    horaInicioHomogenizado: '',
    agarPlateCount: '',
    equipoIncubacion: null,
    nMuestra10gr: null,
    nMuestra50gr: null,
    horaTerminoSiembra: '',
    micropipetaUtilizada: null
  };

  etapa2: Etapa2 = {
    fechaInicioIncubacion: '',
    horaInicioIncubacion: '',
    idResponsableIncubacion: null,
    fechaFinIncubacion: '',
    horaFinIncubacion: '',
    idResponsableAnalisis: null
  };

  // --- ETAPA 3 (Calculo de Muestras) ---
  listaRepeticionesEtapa3: Etapa3Item[] = [
    {
      id: Date.now(),
      codigoALI: null,
      numeroMuestra: 1
    }
  ];

  etapa4: Etapa4 = {
    controlAmbientalPesado: null,
    controlUfc: null,
    horaInicio: '',
    horaFin: '',
    temperatura: null,
    ufc: null,
    controlSiembraEcoli: null,
    blancoUfc: null
  };


  etapa5: Etapa5 = {
    desfavorable: null,
    tablaPagina: null,
    limite: null,
    fechaEntrega: '',
    horaEntrega: '',
    mercado: null,
    imagenManual: null
  };

  etapa6: Etapa6 = {
    duplicadoAli: '',
    analisis: 'RAM',
    duplicadoEstado: null,
    controlBlanco: '',
    controlBlancoEstado: null,
    controlSiembra: '',
    controlSiembraEstado: null
  };

  etapa7: Etapa7 = {
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

      if (!this.etapa2.idResponsableIncubacion) {
        this.etapa2.idResponsableIncubacion = this.currentUser.rut;
      }
      if (!this.etapa2.idResponsableAnalisis) {
        this.etapa2.idResponsableAnalisis = this.currentUser.rut;
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
        // Map defSeleccionado (database/backend) to seleccionado (frontend state)
        this.listaFormasCalculo = res.formasCalculo.map((f: any) => ({
          ...f,
          seleccionado: f.defSeleccionado === 1
        }));

        if (this.codigoALI) {
          this.cargarDatosReporte();
        }
      },
      error: async (err) => {
        console.error('Error al cargar catálogos RAM', err);
        const alert = await this.alertController.create({
          header: 'Error de Carga',
          message: 'No se pudieron cargar los catálogos necesarios. Por favor recargue la página o revise su conexión.',
          buttons: ['OK']
        });
        await alert.present();
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

        // Uso del Adapter para transformar los datos
        const viewModel = RamAdapter.mapReporteToView(reporte);

        // Asignación al estado del componente
        this.estadoRAM = viewModel.estadoRAM;
        this.ultimaActtualizacionRam = viewModel.ultimaActualizacionRam;
        if (viewModel.responsableModificacionRam) {
          this.responsableModificacionRam = viewModel.responsableModificacionRam;
        }

        // Bloquear solo si no es rol 1 (Supervisor)
        // Rol 1 siempre puede editar o revertir
        if (this.currentUser && this.currentUser.rol === 1) {
          this.formularioBloqueado = false;
        } else {
          this.formularioBloqueado = viewModel.formularioBloqueado;
        }

        this.etapa1 = viewModel.etapa1;
        this.etapa2 = viewModel.etapa2;
        this.listaRepeticionesEtapa3 = viewModel.listaRepeticionesEtapa3;
        this.etapa4 = viewModel.etapa4;
        this.etapa5 = viewModel.etapa5;
        this.etapa6 = viewModel.etapa6;
        this.etapa7 = viewModel.etapa7;

        // Lógica específica de presentación que depende de catálogos locales
        if (!this.etapa7.formaCalculoAnalista || this.etapa7.formaCalculoAnalista.length === 0) {
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

  // NOTE: Private mapping methods and formatDate have been moved to RamAdapter


  isFormaCalculoSelected(formaCalculo: FormaCalculo): boolean {
    if (!this.etapa7.formaCalculoAnalista) return false;
    // Check by idForma (or id if legacy)
    return this.etapa7.formaCalculoAnalista.some((f: any) => (f.idForma || f.id) === formaCalculo.idForma);
  }

  toggleFormaCalculo(formaCalculo: FormaCalculo, event: any) {
    if (!this.etapa7.formaCalculoAnalista) {
      this.etapa7.formaCalculoAnalista = [];
    }

    const isChecked = event.detail.checked;

    if (isChecked) {
      if (!this.isFormaCalculoSelected(formaCalculo)) {
        this.etapa7.formaCalculoAnalista.push({
          id: formaCalculo.idForma, // Keep generic 'id' if backend expects it in the JSON array
          idForma: formaCalculo.idForma,
          nombreForma: formaCalculo.nombreForma
        });
      }
    } else {
      this.etapa7.formaCalculoAnalista = this.etapa7.formaCalculoAnalista.filter(
        (f: any) => (f.idForma || f.id) !== formaCalculo.idForma
      );
    }
  }

  /**
   * Adjunta la firma de la coordinadora usando el servicio centralizado
   */
  async adjuntarFirma() {
    const firma = await this.imagenUploadService.seleccionarImagen({
      maxSize: 2 * 1024 * 1024,
      accept: 'image/png,image/jpeg,image/jpg',
      mostrarAlertas: true
    });

    if (firma && firma.s3_key) {
      this.etapa7.firmaCoordinador = firma.s3_key; // Guardamos KEY
      console.log('Firma adjuntada exitosamente (Key)');
      // Para visualización inmediata, podríamos usar la URL temporal, pero
      // al guardar se enviará la Key. El frontend muestra lo que hay en el modelo.
      // Si el modelo tiene la Key, el <img src> fallará a menos que la UI maneje claves o
      // usemos una variable auxiliar para visualización.
      // FIX SIMPLE: El backend firmará al leer. Pero aquí en tiempo real, 
      // necesitamos verla.
      // Podemos guardar la Key en el modelo (para enviar a BD) 
      // y actualizar la vista de alguna forma?
      // Angular binding: [src]="etapa7.firmaCoordinador". 
      // Si pongo "uploads/...", no carga.
      // Solución: Dejo firma.url para visualización? 
      // No, "etapa7.firmaCoordinador" se envía al guardar.
      // TRUCO: Guardar URL temporal en etapa7.firmaCoordinador para que se vea, 
      // PERO al guardar (guardarReporte), detectar si es URL y extraer Key?
      // O MEJOR: El backend acepta Key.
      // Voy a hacer que el componente tenga una variable auxiliar o que use la URL.
      // Pero si refresco, quiero que cargue.
      // Voy a guardar la KEY. Y en el HTML usaré una Pipe o una funcion 
      // "getImagenSrc(firma)"? No, eso requiere async signing.

      // CAMBIO DE ESTRATEGIA:
      // Guardar KEY en `etapa7.firmaCoordinador`.
      // En el HTML, si empieza con 'uploads/', no se verá hasta guardar y recargar.
      // Eso es mala UX.

      // Solución Híbrida:
      // El Frontend usa URLs. 
      // El Backend recibe URLs.
      // El Backend, AL GUARDAR (`ReporteRAM.guardarReporteRAM`), extrae la Key de la URL y guarda la Key.
      // El Backend, AL LEER (`ReporteRAM.obtenerReporteRAM`), genera URL firmada.
      // Así el Frontend siempre ve URLs y no se preocupa.
      // Y el Excel siempre tiene acceso a la Key (porque DB tiene Key).

      this.etapa7.firmaCoordinador = firma.url || null; // Seguimos usando URL en Frontend
      console.log('Firma adjuntada (URL temporal para vista)');
    }
  }

  async adjuntarImagenManual() {
    const imagen = await this.imagenUploadService.seleccionarImagen({
      maxSize: 5 * 1024 * 1024,
      accept: 'image/png,image/jpeg,image/jpg',
      mostrarAlertas: true
    });

    if (imagen && imagen.url) {
      this.etapa5.imagenManual = imagen.url;
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

  async confirmarDevolverBorrador() {
    const alert = await this.alertController.create({
      header: 'Devolver a Borrador',
      message: '¿Estás seguro de devolver este reporte a estado Borrador? Esto permitirá que los analistas vuelvan a editarlo.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Devolver',
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
    const etapa3_backend = this.listaRepeticionesEtapa3.map((item: Etapa3Item) => {
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

      // Reconstruir Duplicado
      let duplicado = null;
      if (item.dilDuplicado01) {
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
        volumen: 1,
        diluciones: diluciones,
        resultado_ram: item.resultadoRAM01,
        resultado_rpes: item.resultadoRPES01,
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
      etapa7: {
        ...this.etapa7,
        formaCalculoAnalista: this.etapa7.formaCalculoAnalista || [],
        formaCalculoCoordinador: this.etapa7.formaCalculoCoordinador || []
      },
      fechaUltimaModificacion: new Date().toISOString()
    };

    console.log(datosReporteRAM);
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

  /**
   * Exporta el reporte RAM a Excel
   */
  exportarExcel() {
    if (!this.codigoALI) {
      // this.presentToast('No hay código ALI asociado', 'warning'); // Not implemented helper? Alert instead
      this.alertController.create({ header: 'Aviso', message: 'No hay código ALI asociado', buttons: ['OK'] }).then(a => a.present());
      return;
    }

    this.ramService.exportarExcel(parseInt(this.codigoALI)).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_RAM_ALI-${this.codigoALI}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: async (err) => {
        console.error('Error al exportar Excel:', err);
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Error al descargar el reporte RAM.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  // --- Lógica de Cálculo RAM (Unificada) ---

  async calcularMuestra(index: number, etapa3: Etapa3Item) {
    await this.ejecutarCalculo(etapa3, false);
  }

  async calcularDuplicado(etapa3: Etapa3Item) {
    await this.ejecutarCalculo(etapa3, true);
  }

  private async ejecutarCalculo(etapa3: Etapa3Item, esDuplicado: boolean) {
    const tipo = esDuplicado ? 'Duplicado' : 'Muestra';
    const loading = await this.loadingController.create({ message: `Calculando ${tipo}...` });
    await loading.present();

    try {
      const diluciones = [];

      // Mapeo dinámico según si es duplicado o no
      const dilKey = esDuplicado ? 'dilDuplicado' : 'dil';
      const colKey = esDuplicado ? 'numeroColoniasDuplicado' : 'numeroColonias';

      // Primera dilución (01)
      // Accessing dynamic properties needs casting or index signature, 
      // but for readability we can just use if/else cleanly or getter function.
      // Let's use clean separate if blocks to avoid 'any' casting if possible, or accept minor repetition for type safety.

      let d1 = esDuplicado ? etapa3.dilDuplicado01 : etapa3.dil;
      let c1_1 = esDuplicado ? etapa3.numeroColoniasDuplicado01 : etapa3.numeroColonias01;
      let c1_2 = esDuplicado ? etapa3.numeroColoniasDuplicado02 : etapa3.numeroColonias02;

      if (d1 !== null && d1 !== '' && d1 !== undefined) {
        diluciones.push({
          dil: Number(d1),
          colonias: [c1_1, c1_2]
        });
      }

      // Segunda dilución (02/03-04)
      let d2 = esDuplicado ? etapa3.dilDuplicado02 : etapa3.dil2;
      let c2_1 = esDuplicado ? etapa3.numeroColoniasDuplicado03 : etapa3.numeroColonias03;
      let c2_2 = esDuplicado ? etapa3.numeroColoniasDuplicado04 : etapa3.numeroColonias04;

      if (d2 !== null && d2 !== '' && d2 !== undefined) {
        diluciones.push({
          dil: Number(d2),
          colonias: [c2_1, c2_2]
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
            if (esDuplicado) {
              etapa3.resultadoRAMDuplicado01 = res.resultado.textoReporte;
              // Usar textoRPES si existe (prioridad 2), sino usar ufc (o el formateado)
              etapa3.resultadoRPESDuplicado01 = res.resultado.textoRPES || res.resultado.ufc;
              etapa3.promedioDuplicado = res.resultado.promedio;
              etapa3.sumaColoniasDuplicado = res.resultado.sumaColonias;
              etapa3.n1Duplicado = res.resultado.n1;
              etapa3.n2Duplicado = res.resultado.n2;
              etapa3.factorDilucionDuplicado = res.resultado.factorDilucion;
            } else {
              etapa3.resultadoRAM01 = res.resultado.textoReporte;
              etapa3.resultadoRPES01 = res.resultado.textoRPES || res.resultado.ufc;
              etapa3.promedio = res.resultado.promedio;
              etapa3.sumaColonias = res.resultado.sumaColonias;
              etapa3.n1 = res.resultado.n1;
              etapa3.n2 = res.resultado.n2;
              etapa3.factorDilucion = res.resultado.factorDilucion;
            }
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

  // TrackBy Function for ngFor optimization
  trackByFn(index: number, item: any): number {
    return item.id;
  }

  isFormaCalculoCoordinadorSelected(formaCalculo: any): boolean {
    if (!this.etapa7.formaCalculoCoordinador) return false;
    // Use idForma consistently
    return this.etapa7.formaCalculoCoordinador.some((f: any) => (f.idForma || f.id) === formaCalculo.idForma);
  }

  toggleFormaCalculoCoordinador(formaCalculo: any, event: any) {
    if (!this.etapa7.formaCalculoCoordinador) {
      this.etapa7.formaCalculoCoordinador = [];
    }

    const isChecked = event.detail.checked;

    if (isChecked) {
      if (!this.isFormaCalculoCoordinadorSelected(formaCalculo)) {
        // Ensure consistency with object structure
        this.etapa7.formaCalculoCoordinador.push({
          id: formaCalculo.idForma,
          idForma: formaCalculo.idForma,
          nombreForma: formaCalculo.nombreForma
        });
      }
    } else {
      this.etapa7.formaCalculoCoordinador = this.etapa7.formaCalculoCoordinador.filter(
        (f: any) => (f.idForma || f.id) !== formaCalculo.idForma
      );
    }
  }

}
