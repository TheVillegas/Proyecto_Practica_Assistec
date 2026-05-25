import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SessionUser {
  rut: string;
  nombre?: string;
  nombreApellido?: string;
  correo?: string;
  foto?: string;
  role?: number;
  rol?: number;
  rolUsuario?: number;
  rol_analista?: number;
  rut_analista?: string;
  correo_analista?: string;
  urlFoto?: string;
  url_foto?: string;
  roles: number[];
  primaryRole: number;
  activeRole?: number;
  [key: string]: any;
}

const ROLE_ROUTES: Record<number, string> = {
  4: '/dashboard-admin',
  2: '/dashboard-jefe',
  1: '/dashboard-coordinadora',
  3: '/dashboard-ingreso',
  0: '/dashboard-analista'
};

const LANDING_PRECEDENCE = [4, 2, 1, 3, 0];

const normalizeRole = (role: unknown): number | null => {
  const parsedRole = Number(role);
  return Number.isInteger(parsedRole) ? parsedRole : null;
};

const uniqueRoles = (roles: Array<number | null>): number[] => {
  const deduped: number[] = [];

  roles.forEach((role) => {
    if (role !== null && !deduped.includes(role)) {
      deduped.push(role);
    }
  });

  return deduped;
};

const normalizeSessionUser = (user: Record<string, unknown> | null): SessionUser | null => {
  if (!user) {
    return null;
  }

  const explicitRoles = Array.isArray(user['roles'])
    ? (user['roles'] as unknown[]).map((role) => normalizeRole(role))
    : [];

  const fallbackRole = normalizeRole(user['primaryRole'] ?? user['rol'] ?? user['role'] ?? user['rolUsuario'] ?? user['rol_analista']);
  const roles = uniqueRoles([...explicitRoles, fallbackRole]);
  const primaryRole = uniqueRoles([
    normalizeRole(user['primaryRole']),
    normalizeRole(user['rol']),
    normalizeRole(user['role']),
    normalizeRole(user['rolUsuario']),
    normalizeRole(user['rol_analista']),
    ...roles
  ]).find((role) => LANDING_PRECEDENCE.includes(role)) ?? 0;

  return {
    ...(user as Record<string, unknown>),
    rut: String(user['rut'] ?? user['rutUsuario'] ?? user['rut_analista'] ?? ''),
    roles,
    primaryRole,
    rol: primaryRole,
    role: primaryRole,
    activeRole: normalizeRole(user['activeRole']) ?? primaryRole
  } as SessionUser;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl + '/auth';

  // Subject para notificar cambios en el usuario
  private currentUserSubject = new BehaviorSubject<any>(this.getUsuarioFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private getUsuarioFromStorage(): any {
    const usuario = sessionStorage.getItem('usuario');
    return usuario ? normalizeSessionUser(JSON.parse(usuario)) : null;
  }

  // Metodos de login 
  login(correo: string, contrasena: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, {
      correo: correo,
      contrasena: contrasena
    }).pipe(
      tap(response => {
        if (response && response.token) {
          sessionStorage.setItem('token', response.token);
          if (response.usuario) {
            const normalizedUser = normalizeSessionUser(response.usuario);
            sessionStorage.setItem('usuario', JSON.stringify(normalizedUser));
            this.currentUserSubject.next(normalizedUser); // Notificar cambio
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
          currentUser['url_foto'] = urlFoto; // Asegurar consistencia con backend
          if (currentUser['urlFoto']) currentUser['urlFoto'] = urlFoto;
          currentUser.foto = urlFoto;

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

  getUsuario(): any {
    return this.currentUserSubject.value;
  }

  hasRole(role: number, user: SessionUser | null = this.getUsuario()): boolean {
    return !!user?.roles.includes(role);
  }

  canAccess(allowedRoles: number[], user: SessionUser | null = this.getUsuario()): boolean {
    return allowedRoles.some((role) => this.hasRole(role, user));
  }

  getLandingRoute(user: SessionUser | null = this.getUsuario()): string {
    const role = user?.primaryRole ?? 0;
    return ROLE_ROUTES[role] ?? ROLE_ROUTES[0];
  }
}
