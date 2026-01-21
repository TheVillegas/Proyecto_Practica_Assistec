import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private isShowingAlert = false;

    constructor(private router: Router, private alertController: AlertController) { }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const token = sessionStorage.getItem('token'); // Use sessionStorage

        let authReq = request;
        if (token) {
            authReq = request.clone({
                headers: request.headers.set('Authorization', `Bearer ${token}`)
            });
        }

        return next.handle(authReq).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    // Si el 401 viene del login, no es "Sesion Expirada", es "Credenciales Invalidas"
                    // Dejamos que el componente de login maneje el error
                    if (request.url.includes('/login')) {
                        return throwError(() => error);
                    }

                    // Para otras rutas, es token invalido/expirado
                    return from(this.mostrarAlertaExpiracion()).pipe(
                        switchMap(() => {
                            return throwError(() => error);
                        })
                    );
                }
                return throwError(() => error);
            })
        );
    }

    private async mostrarAlertaExpiracion() {
        if (this.isShowingAlert) {
            return;
        }

        this.isShowingAlert = true;
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('usuario');

        const alert = await this.alertController.create({
            header: 'Sesión Expirada',
            message: 'Tu sesión ha terminado. Por favor inicia sesión nuevamente.',
            buttons: [{
                text: 'OK',
                handler: () => {
                    this.isShowingAlert = false;
                    this.router.navigate(['/login']);
                }
            }],
            backdropDismiss: false
        });
        await alert.present();

        // Aseguramos que si se cierra por otra via, bajemos la bandera (aunque backdropDismiss es false)
        await alert.onDidDismiss().then(() => {
            this.isShowingAlert = false;
        });
    }
}
