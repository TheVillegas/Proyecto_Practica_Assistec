import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { Analista } from '../../interfaces/analista';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {

  registerForm: FormGroup;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {
    this.registerForm = this.formBuilder.group({
      fullname: ['', [Validators.required]],
      rut: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  ngOnInit() {
  }

  gotologin() {
    this.router.navigate(['/login']);
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      const { fullname, rut, email, password } = this.registerForm.value;

      const analistaData: any = {
        rut_analista: rut,
        nombre_apellido_analista: fullname,
        correo_analista: email,
        contrasena_analista: password
      };

      this.authService.register(analistaData).subscribe({
        next: async (success) => {
          this.isLoading = false;
          const alert = await this.alertController.create({
            header: 'Éxito',
            message: 'Usuario registrado correctamente',
            buttons: ['OK']
          });
          await alert.present();
          this.router.navigate(['/login']);
        },
        error: async (error) => {
          console.error('Error en registro:', error);
          this.isLoading = false;
          const alert = await this.alertController.create({
            header: 'Error',
            message: error.error?.mensaje || 'No se pudo registrar el usuario',
            buttons: ['OK']
          });
          await alert.present();
        }
      });
    } else {
      console.warn("Formulario inválido");
      this.registerForm.markAllAsTouched();
    }
  }

}
