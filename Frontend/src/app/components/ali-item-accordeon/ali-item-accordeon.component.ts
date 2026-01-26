import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ALI } from '../../interfaces/ali';
import { AliService } from '../../services/ali-service';
import { ImagenUploadService } from '../../services/imagen-upload';
import { Router } from '@angular/router';
import { query } from '@angular/animations';
import { AlertController, ActionSheetController } from '@ionic/angular';
import { AuthService } from '../../services/auth-service';
import { RamService } from 'src/app/services/ram-service';
import { TpaService } from 'src/app/services/tpa-service';

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
    private authService: AuthService,
    private actionSheetController: ActionSheetController,
    private ramService: RamService,
    private tpaService: TpaService
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getUsuario();
    console.log('Muestra Item Data:', this.muestra);
    this.cargarImagenes();
  }

  cargarImagenes() {
    this.aliService.getImagenes(this.muestra.ALIMuestra).subscribe({
      next: (imagenes) => {
        this.muestra.imagenesObservaciones = imagenes;
      },
      error: (err) => {
        console.error('Error cargando imagenes', err);
      }
    });
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  async exportarExcel(event: Event) {
    event.stopPropagation();

    const actionSheet = await this.actionSheetController.create({
      header: 'Generar Reporte Excel',
      buttons: [
        {
          text: 'Reporte RAM',
          icon: 'document-text-outline',
          handler: () => {
            this.generarRAM();
          }
        },
        {
          text: 'Reporte TPA',
          icon: 'clipboard-outline',
          handler: () => {
            this.generarTPA();
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  generarRAM() {
    if (!this.muestra.ALIMuestra) return;
    this.ramService.exportarExcel(this.muestra.ALIMuestra).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_RAM_ALI-${this.muestra.ALIMuestra}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: async (err) => {
        console.error('Error exportando RAM:', err);
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Error al descargar reporte RAM',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  generarTPA() {
    if (!this.muestra.ALIMuestra) return;
    this.tpaService.exportarExcel(this.muestra.ALIMuestra).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_TPA_ALI-${this.muestra.ALIMuestra}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: async (err) => {
        console.error('Error exportando TPA:', err);
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Error al descargar reporte TPA',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
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
    // 1. Subir a S3 (el servicio ya devuelve {key, url} y maneja errores UI)
    const imagenObj = await this.imagenUploadService.seleccionarImagen({
      maxSize: 5 * 1024 * 1024,
      accept: 'image/jpeg,image/jpg,image/png,image/gif',
      mostrarAlertas: true
    });

    if (!imagenObj) return;

    // 2. Guardar Metadata en DB
    const payload = {
      codigo_ali: this.muestra.ALIMuestra,
      s3_key: imagenObj.s3_key,
      nombre_archivo: imagenObj.nombre,
      tipo_mime: imagenObj.tipo,
      tamanio: imagenObj.tamanio
    };

    this.aliService.agregarImagen(payload).subscribe({
      next: async (resp: any) => {
        // Agregar al array local con el ID generado y la URL
        imagenObj.id_imagen = resp.imagen.id_imagen;

        if (!this.muestra.imagenesObservaciones) {
          this.muestra.imagenesObservaciones = [];
        }
        this.muestra.imagenesObservaciones.push(imagenObj);

        const alert = await this.alertController.create({
          header: 'Imagen guardada',
          message: `La imagen "${imagenObj.nombre}" se ha subido correctamente.`,
          buttons: ['OK']
        });
        await alert.present();
      },
      error: async (err) => {
        console.error('Error guardando metadata imagen:', err);
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'La imagen se subió a S3 pero falló el registro en base de datos.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
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
            const imagen = this.muestra.imagenesObservaciones![index];
            if (imagen && imagen.id_imagen) {
              this.aliService.eliminarImagen(imagen.id_imagen).subscribe({
                next: () => {
                  this.muestra.imagenesObservaciones?.splice(index, 1);
                  console.log('Imagen eliminada:', imagen.nombre);
                },
                error: (err) => {
                  console.error('Error eliminando imagen:', err);
                }
              });
            } else {
              // Si por alguna razón no tiene ID (fallo previo o imagen legacy), borrar localmente
              this.muestra.imagenesObservaciones?.splice(index, 1);
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
