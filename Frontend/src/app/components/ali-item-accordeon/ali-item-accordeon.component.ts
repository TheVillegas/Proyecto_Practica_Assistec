import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ALI } from '../../interfaces/ali';
import { AliService } from '../../services/ali-service';
import { ImagenUploadService } from '../../services/imagen-upload';
import { Router } from '@angular/router';
import { query } from '@angular/animations';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../../services/auth-service';
@Component({
  selector: 'app-ali-item-accordeon',
  templateUrl: './ali-item-accordeon.component.html',
  styleUrls: ['./ali-item-accordeon.component.scss'],
  standalone: false
})
export class ALIItemAccordeonComponent implements OnInit {

  currentUser: any = null;
  @Input() muestra!: ALI;
  @Output() onDelete = new EventEmitter<void>();
  isExpanded: boolean = false;

  constructor(
    private router: Router,
    private aliService: AliService,
    private alertController: AlertController,
    private imagenUploadService: ImagenUploadService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getUsuario();
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  guardarObservaciones() {
    this.aliService.updateObservacionesGenerales(this.muestra.ALIMuestra, this.muestra.observacionesGenerales)
      .subscribe({
        next: async () => {
          console.log('Observaciones guardadas para la muestra', this.muestra.ALIMuestra);
          // Feedback visual
          const alert = await this.alertController.create({
            header: 'Éxito',
            message: 'Observaciones guardadas correctamente.',
            buttons: ['OK']
          });
          await alert.present();
        },
        error: async (err) => {
          console.error('Error al guardar observaciones', err);
          const alert = await this.alertController.create({
            header: 'Error',
            message: 'No se pudieron guardar las observaciones.',
            buttons: ['OK']
          });
          await alert.present();
        }
      });
  }

  async eliminarALI(event: Event) {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de que desea eliminar el ALI con ID ${this.muestra.CodigoSerna || this.muestra.ALIMuestra}? Esto eliminará también los reportes asociados.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.aliService.eliminarMuestra(this.muestra.ALIMuestra).subscribe({
              next: async () => {
                console.log('Muestra eliminada');
                const successAlert = await this.alertController.create({
                  header: 'Éxito',
                  message: 'Muestra eliminada correctamente.',
                  buttons: ['OK']
                });
                await successAlert.present();
                this.onDelete.emit(); // Notificar al padre para recargar lista
              },
              error: async (err) => {
                console.error('Error al eliminar muestra', err);
                const errorAlert = await this.alertController.create({
                  header: 'Error',
                  message: 'Error al eliminar la muestra: ' + (err.error?.mensaje || 'Error desconocido'),
                  buttons: ['OK']
                });
                await errorAlert.present();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  getColorEstado(estado: string | undefined): string {
    if (!estado) {
      return 'bg-[#C41D1D]/10 text-[#C41D1D] border-[#C41D1D]/20';
    }
    const estadoNormalizado = estado.trim().toUpperCase();

    switch (estadoNormalizado) {
      case 'VERIFICADO':
        // Azul del header (brand-primary)
        return 'bg-blue-50 text-brand-primary border-blue-100';

      case 'BORRADOR':
        // Gris text-muted #64748b
        return 'bg-[#64748b]/10 text-[#64748b] border-[#64748b]/20';

      case 'NO REALIZADO':
      case 'NO_REALIZADO':
        // Rojo danger #C41D1D
        return 'bg-[#C41D1D]/10 text-[#C41D1D] border-[#C41D1D]/20';

      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  }

  getContainerStyle(estado: string | undefined): string {
    if (!estado) return 'hover:bg-gray-50 border-transparent hover:border-gray-100';

    const estadoNormalizado = estado.trim().toUpperCase();
    switch (estadoNormalizado) {
      case 'VERIFICADO':
        return 'bg-blue-50/50 border-blue-100/50';
      case 'BORRADOR':
        return 'bg-[#64748b]/5 border-[#64748b]/20';
      case 'NO REALIZADO':
      case 'NO_REALIZADO':
        return 'bg-[#C41D1D]/5 border-[#C41D1D]/20';
      default:
        return 'hover:bg-gray-50 border-transparent hover:border-gray-100';
    }
  }
  goToReporteTPA(event?: Event) {
    if (event) event.stopPropagation();
    console.log("Redirigiendo a Reporte TPA");
    console.log(this.muestra.ALIMuestra);
    //cambiar el query params una vez implementado el backend
    this.router.navigate(["/reporte-tpa", this.muestra.ALIMuestra], { queryParams: { estadoTPA: this.muestra.reporteTPA.estado } });
  }

  goToReporteRAM(event?: Event) {
    if (event) event.stopPropagation();
    console.log("Redirigiendo a Reporte RAM");
    console.log(this.muestra.ALIMuestra);
    //cambiar el query params una vez implementado el backend
    this.router.navigate(["/reporte-ram", this.muestra.ALIMuestra], { queryParams: { estadoRAM: this.muestra.reporteRAM.estado } });
  }

  /**
   * Función para adjuntar una imagen adicional en las observaciones generales
   * Usa el servicio ImagenUploadService para manejar la selección y validación
   */
  async adjuntarImagen() {
    // Usar el servicio para seleccionar la imagen
    const imagen = await this.imagenUploadService.seleccionarImagen({
      maxSize: 5 * 1024 * 1024, // 5MB
      accept: 'image/jpeg,image/jpg,image/png,image/gif',
      mostrarAlertas: true
    });

    if (!imagen) {
      // Usuario canceló o hubo un error (ya manejado por el servicio)
      return;
    }

    // Inicializar el array de imágenes si no existe
    if (!this.muestra.imagenesObservaciones) {
      this.muestra.imagenesObservaciones = [];
    }

    // Agregar la imagen al array
    this.muestra.imagenesObservaciones.push(imagen);

    // Mostrar confirmación
    const alert = await this.alertController.create({
      header: 'Imagen adjuntada',
      message: `La imagen "${imagen.nombre}" se ha adjuntado correctamente`,
      buttons: ['OK']
    });
    await alert.present();

    console.log('Imagen adjuntada exitosamente:', imagen.nombre);
  }

  /**
   * Elimina una imagen del array de imágenes adjuntadas
   * @param index - Índice de la imagen a eliminar
   */
  async eliminarImagen(index: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Está seguro de que desea eliminar esta imagen?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            if (this.muestra.imagenesObservaciones) {
              this.muestra.imagenesObservaciones.splice(index, 1);
              console.log('Imagen eliminada del índice:', index);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Formatea el tamaño del archivo usando el servicio
   * @param bytes - Tamaño en bytes
   * @returns String formateado (ej: "1.5 MB")
   */
  formatearTamanio(bytes: number): string {
    return this.imagenUploadService.formatearTamanio(bytes);
  }

  /**
   * Formatea la fecha usando el servicio
   * @param fechaISO - Fecha en formato ISO string
   * @returns String formateado (ej: "07/01/2026")
   */
  formatearFecha(fechaISO: string): string {
    return this.imagenUploadService.formatearFecha(fechaISO);
  }

  formatearEstado(estado: string | undefined): string {
    if (!estado) return 'Pendiente';
    const estadoLimpio = estado.replace('_', ' ').toLowerCase();
    // Capitalize first letter of each word
    return estadoLimpio.replace(/\b\w/g, l => l.toUpperCase());
  }

}
