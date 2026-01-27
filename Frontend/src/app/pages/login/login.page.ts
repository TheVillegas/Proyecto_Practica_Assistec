import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {

  loginForm: FormGroup;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      contraseña: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  ngOnInit() {
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.authService.login(this.loginForm.value.email, this.loginForm.value.contraseña).subscribe({
        next: (success) => {
          this.isLoading = false;
          this.router.navigate(['/home']);
        },
        error: async (error) => {
          this.isLoading = false;
          const alert = await this.alertController.create({
            header: 'Error',
            message: error.error?.mensaje || 'Credenciales inválidas o error en el servidor',
            buttons: ['OK']
          });
          await alert.present();
        }
      })
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

}
