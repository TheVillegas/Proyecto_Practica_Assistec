import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Analista } from '../interfaces/analista';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/Usuarios';

  constructor(private http: HttpClient) { }

  // Metodos de login 
  login(correo: string, contrasena: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, {
      correo: correo,
      contrasena_analista: contrasena
    }).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          // Opcional: guardar usuario en localStorage
          if (response.usuario) { // Controller returns 'usuario', not 'analista'
            localStorage.setItem('usuario', JSON.stringify(response.usuario));
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
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getUsuario() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }
}
