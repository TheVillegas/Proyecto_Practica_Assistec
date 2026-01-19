import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth-service';
import { NavController, ToastController } from '@ionic/angular';
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
    private imagenUploadService: ImagenUploadService
  ) { }

  ngOnInit() {
    this.cargarUsuario();
  }

  cargarUsuario() {
    const user = this.authService.getUsuario();
    if (user) {
      console.log('Usuario cargado:', user);
      this.usuario = {
        nombreApellido: user.nombreApellido || user.nombre_analista,
        rut: user.rut || user.rut_analista,
        correo: user.correo || user.correo_analista,
        rol: user.rol || user.rol_analista,
        avatar: 'https://avatars.githubusercontent.com/u/127423201?v=4&size=64' // Hardcoded for now as in Header, eventually dynamic
      };
    }
  }

  async cambiarFoto() {
    // Placeholder logic for image upload
    const imagen = await this.imagenUploadService.seleccionarImagenBase64({
      maxSize: 5 * 1024 * 1024,
      accept: 'image/png, image/jpeg',
      mostrarAlertas: true
    });

    if (imagen) {
      this.usuario.avatar = imagen;
      // TODO: Call API to update user avatar
      this.mostrarToast('Foto de perfil actualizada (Simulado)');
    }
  }

  cambiarPassword() {
    // Logic for password change modal or alert
    this.mostrarToast('Funcionalidad de cambiar contraseña pendiente');
  }

  cambiarCorreo() {
    // Logic for email change modal or alert
    this.mostrarToast('Funcionalidad de cambiar correo pendiente');
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
