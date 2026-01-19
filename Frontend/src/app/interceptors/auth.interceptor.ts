import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(private router: Router) { }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        console.log('AuthInterceptor: Interceptando query a', request.url);
        const token = localStorage.getItem('token');
        console.log('AuthInterceptor: Token encontrado?', !!token);

        if (token) {
            const cloned = request.clone({
                headers: request.headers.set('Authorization', `Bearer ${token}`)
            });
            return next.handle(cloned);
        }

        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401 || error.status === 403) {
                    console.log('Sesión expirada o no autorizada. Redirigiendo al login...');
                    localStorage.removeItem('token');
                    localStorage.removeItem('usuario');
                    this.router.navigate(['/login']);
                }
                return throwError(() => error);
            })
        );
    }
}
