import { Injectable } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ImagenObservacion } from '../interfaces/ali';

export interface OpcionesSeleccionImagen {
  maxSize?: number;
  accept?: string;
  mostrarAlertas?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ImagenUploadService {
  private apiUrl = environment.apiUrl + '/upload'; // Ruta al endpoint de carga

  constructor(
    private alertController: AlertController,
    private http: HttpClient,
    private loadingController: LoadingController
  ) { }

  async seleccionarImagen(opciones?: OpcionesSeleccionImagen): Promise<ImagenObservacion | null> {
    const config = {
      maxSize: opciones?.maxSize || 5 * 1024 * 1024,
      accept: opciones?.accept || 'image/jpeg,image/jpg,image/png,image/gif',
      mostrarAlertas: opciones?.mostrarAlertas !== false
    };

    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = config.accept;

      input.onchange = async (event: any) => {
        const file = event.target.files[0];

        if (!file) {
          resolve(null);
          return;
        }

        if (!this.validarTipoImagen(file)) {
          if (config.mostrarAlertas) await this.mostrarAlerta('Archivo no válido', 'Formato no soportado (use JPG, PNG, GIF)');
          resolve(null);
          return;
        }

        if (!this.validarTamanio(file, config.maxSize)) {
          if (config.mostrarAlertas) {
            const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
            await this.mostrarAlerta('Archivo muy grande', `El límite es ${maxSizeMB}MB`);
          }
          resolve(null);
          return;
        }

        // Subir a S3
        const result = await this.subirImagenAS3(file);
        if (result) {
          const imagen: ImagenObservacion = {
            nombre: file.name,
            tipo: file.type,
            tamanio: file.size,
            s3_key: result.key,
            url: result.url,
            fechaAdjunto: new Date().toISOString()
          };
          resolve(imagen);
        } else {
          resolve(null);
        }
      };

      input.click();
    });
  }

  private async subirImagenAS3(file: File): Promise<{ key: string, url: string } | null> {
    const loading = await this.loadingController.create({
      message: 'Subiendo imagen a la nube...',
    });
    await loading.present();

    try {
      const formData = new FormData();
      formData.append('imagen', file);

      const response: any = await firstValueFrom(this.http.post(this.apiUrl, formData));

      await loading.dismiss();

      if (response.ok) {
        return { key: response.key, url: response.url };
      } else {
        throw new Error(response.mensaje || 'Error desconocido al subir imagen');
      }

    } catch (error: any) {
      console.error('Error uploading image:', error);
      await loading.dismiss();
      await this.mostrarAlerta('Error de Carga', 'No se pudo subir la imagen. Verifique su conexión.');
      return null;
    }
  }

  private validarTipoImagen(file: File): boolean {
    return file.type.startsWith('image/');
  }

  private validarTamanio(file: File, maxSize: number): boolean {
    return file.size <= maxSize;
  }

  private async mostrarAlerta(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  formatearTamanio(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  formatearFecha(fechaISO: string): string {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-CL');
  }
}
