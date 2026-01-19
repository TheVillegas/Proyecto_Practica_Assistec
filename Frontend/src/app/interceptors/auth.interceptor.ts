import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

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
                    // Retornamos un Observable que muestra la alerta y luego redirige
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
        // Evitar multiples alertas si llegan 401s simultaneos? 
        // Por simplicidad mostramos y limpiamos.
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('usuario');

        const alert = await this.alertController.create({
            header: 'Sesión Expirada',
            message: 'Tu sesión ha terminado. Por favor inicia sesión nuevamente.',
            buttons: [{
                text: 'OK',
                handler: () => {
                    this.router.navigate(['/login']);
                }
            }],
            backdropDismiss: false
        });
        await alert.present();
    }
}
