import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AliService } from 'src/app/services/ali-service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-generar-ali-basico',
  templateUrl: './generar-ali-basico.page.html',
  styleUrls: ['./generar-ali-basico.page.scss'],
  standalone: false
})
export class GenerarALiBasicoPage implements OnInit {

  formularioIngresoALI: FormGroup
  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private aliService: AliService,
  ) {
    this.formularioIngresoALI = this.formBuilder.group({
      aliMuestra: ["", Validators.required],
      codigoSerna: [''],
      observacionesCliente: ['']
    })
  }
  ngOnInit() {
  }

  goToHome() {
    console.log("Redirigiendo a Home")
    this.router.navigate(["/home"]);
  }

  //Agregar logica para conectar y enviar datos al backend


  async confirmarCancelar() {
    const alert = await this.alertController.create({
      header: 'Cancelar',
      message: 'Esta seguro de que no desea guardar sus cambios?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Cancelar')
          }
        },
        {
          text: 'Sí, salir',
          role: 'destructive',
          handler: () => {
            console.log('Sí, salir');
            this.router.navigate(['/home']);
          }
        }
      ]

    })
    await alert.present();
  }

  async intentarEnviar() {
    console.log('1. Botón presionado. Estado del formulario:', this.formularioIngresoALI.valid);
    console.log('2. Valores actuales:', this.formularioIngresoALI.value);
    if (this.formularioIngresoALI.invalid) {
      this.formularioIngresoALI.markAllAsTouched();
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Por favor, complete todos los campos correctamente.',
        buttons: ['Entendido']
      });
      await alert.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmacion',
      message: 'Esta seguro de que estan los datos correctos?.',
      buttons: [
        {
          text: 'Revisar',
          role: 'cancel',
          handler: () => {
            console.log('Usuario quiere revisar');
          }
        },
        {
          text: 'Sí, continuar',
          role: 'confirm',
          handler: () => {
            console.log(this.formularioIngresoALI.value);
            const { aliMuestra, codigoSerna, observacionesCliente } = this.formularioIngresoALI.value;

            this.aliService.agregarMuestraALI(aliMuestra, codigoSerna, observacionesCliente).subscribe({
              next: async (resp) => {
                const successAlert = await this.alertController.create({
                  header: 'Éxito',
                  message: 'Muestra creada correctamente.',
                  buttons: ['OK']
                });
                await successAlert.present();
                this.router.navigate(["/home"]);
              },
              error: async (err) => {
                console.error(err);
                const errorAlert = await this.alertController.create({
                  header: 'Error',
                  message: 'No se pudo crear la muestra. ' + (err.error?.mensaje || 'Error desconocido'),
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
}
