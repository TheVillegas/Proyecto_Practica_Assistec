import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth-service';
import { NavController, ToastController, AlertController } from '@ionic/angular';
import { ImagenUploadService } from 'src/app/services/imagen-upload';

@Component({
  selector: 'app-configuracion-usuario',
  templateUrl: './configuracion-usuario.page.html',
  styleUrls: ['./configuracion-usuario.page.scss'],
  standalone: false
})
export class ConfiguracionUsuarioPage implements OnInit {

  usuario: any = {
    nombreApellido: '',
    rut: '',
    correo: '',
    rol: '',
    avatar: 'assets/avatar-placeholder.png' // Default placeholder if null
  };

  constructor(
    private authService: AuthService,
    private navCtrl: NavController,
    private toastController: ToastController,
    private imagenUploadService: ImagenUploadService,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.cargarUsuario();
  }

  cargarUsuario() {
    const user = this.authService.getUsuario();
    if (user) {
      // console.log('Usuario cargado');
      let mappedRole = 'Analista';
      const rolInt = user.rol !== undefined ? user.rol : user.rol_analista;
      
      switch (rolInt) {
        case 1:
          mappedRole = 'Coordinadora de Área';
          break;
        case 2:
          mappedRole = 'Jefe de Área';
          break;
        case 3:
          mappedRole = 'Ingreso';
          break;
        default:
          mappedRole = 'Analista';
      }

      this.usuario = {
        nombreApellido: user.nombreApellido || user.nombre_analista,
        rut: user.rut || user.rut_analista,
        correo: user.correo || user.correo_analista,
        rol: mappedRole,
        avatar: user.url_foto || user.urlFoto || `https://ui-avatars.com/api/?name=${user.nombreApellido || user.nombre_analista || 'U'}&background=random`
      };
    }
  }

  async cambiarFoto() {
    const imagen = await this.imagenUploadService.seleccionarImagen({
      maxSize: 5 * 1024 * 1024,
      accept: 'image/png, image/jpeg',
      mostrarAlertas: true
    });

    if (imagen && imagen.url) {
      const toast = await this.toastController.create({
        message: 'Actualizando foto de perfil...',
        duration: 1000
      });
      toast.present();

      this.usuario.avatar = imagen.url;

      this.authService.actualizarFotoPerfil(this.usuario.rut, imagen.url).subscribe({
        next: () => {
          this.mostrarToast('Foto de perfil actualizada correctamente');
        },
        error: (err) => {
          console.error(err);
          this.mostrarToast('Error al actualizar foto en el servidor');
        }
      });
    }
  }

  async cambiarPassword() {
    const alert = await this.alertController.create({
      header: 'Cambiar Contraseña',
      inputs: [
        {
          name: 'password',
          type: 'password',
          placeholder: 'Nueva contraseña',
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: 'Confirmar contraseña',
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cambiar',
          handler: (data) => {
            if (!data.password || !data.confirmPassword) {
              this.mostrarToast('Debe ingresar ambos campos');
              return false;
            }
            if (data.password !== data.confirmPassword) {
              this.mostrarToast('Las contraseñas no coinciden');
              return false;
            }
            if (data.password.length < 4) {
              this.mostrarToast('La contraseña es muy corta');
              return false;
            }

            this.authService.actualizarPassword(this.usuario.rut, data.password).subscribe({
              next: () => {
                this.mostrarToast('Contraseña actualizada correctamente');
              },
              error: (err) => {
                console.error(err);
                this.mostrarToast('Error al actualizar contraseña');
              }
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async cambiarCorreo() {
    const alert = await this.alertController.create({
      header: 'Cambiar Correo',
      inputs: [
        {
          name: 'correo',
          type: 'email',
          placeholder: 'Nuevo correo',
          value: this.usuario.correo
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            if (!data.correo || !data.correo.includes('@')) {
              this.mostrarToast('Ingrese un correo válido');
              return false;
            }

            this.authService.actualizarCorreo(this.usuario.rut, data.correo).subscribe({
              next: () => {
                this.usuario.correo = data.correo;
                this.mostrarToast('Correo actualizado correctamente');
              },
              error: (err) => {
                console.error(err);
                this.mostrarToast('Error al actualizar correo');
              }
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  volver() {
    this.navCtrl.back();
  }

  async mostrarToast(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

}
