import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/Usuarios';

  // Subject para notificar cambios en el usuario
  private currentUserSubject = new BehaviorSubject<any>(this.getUsuarioFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) { }

  private getUsuarioFromStorage() {
    const usuario = sessionStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }

  // Metodos de login 
  login(correo: string, contrasena: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, {
      correo: correo,
      contrasena_analista: contrasena
    }).pipe(
      tap(response => {
        if (response && response.token) {
          sessionStorage.setItem('token', response.token);
          if (response.usuario) {
            sessionStorage.setItem('usuario', JSON.stringify(response.usuario));
            this.currentUserSubject.next(response.usuario); // Notificar cambio
          }
        }
      })
    );
  }

  // Metodos de Registro
  register(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/crearAnalista`, data);
  }

  logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    this.currentUserSubject.next(null); // Notificar logout
  }

  getToken() {
    return sessionStorage.getItem('token');
  }

  getUsuario() {
    return this.currentUserSubject.value;
  }
}
