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

  // Actualizar Foto Perfil
  actualizarFotoPerfil(rut: string, urlFoto: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/foto-perfil/${rut}`, { url_foto: urlFoto }).pipe(
      tap(() => {
        // Actualizar almacenamiento local
        const currentUser = this.getUsuarioFromStorage();
        if (currentUser) {
          currentUser.url_foto = urlFoto; // Asegurar consistencia con backend
          if (currentUser.urlFoto) currentUser.urlFoto = urlFoto;

          sessionStorage.setItem('usuario', JSON.stringify(currentUser));
          this.currentUserSubject.next(currentUser);
        }
      })
    );
  }

  // Actualizar Correo
  actualizarCorreo(rut: string, correo: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/correo/${rut}`, { correo }).pipe(
      tap(() => {
        // Actualizar almacenamiento local
        const currentUser = this.getUsuarioFromStorage();
        if (currentUser) {
          currentUser.correo = correo;
          currentUser.correo_analista = correo; // Mantener consistencia
          sessionStorage.setItem('usuario', JSON.stringify(currentUser));
          this.currentUserSubject.next(currentUser);
        }
      })
    );
  }

  // Actualizar Contraseña
  actualizarPassword(rut: string, password: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/password/${rut}`, { password });
  }

  getUsuario() {
    return this.currentUserSubject.value;
  }
}
