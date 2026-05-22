import { Component, OnInit, Input, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService, SessionUser } from '../../services/auth-service';

const ROLE_LABELS: Record<number, string> = {
  4: 'Administrator',
  3: 'Ingreso',
  2: 'Jefe de Área',
  1: 'Coordinadora de Área',
  0: 'Analista'
};

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false
})
export class HeaderComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);


  userName: string = 'Usuario';
  userRole: string = 'Analista';
  userRolNum: number = 0;
  userRoles: number[] = [0];
  userPhoto: string = '';
  userInitials: string = 'U';

  constructor() {
    // Escuchar cambios de ruta para actualizar el segmento activo
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateActiveSegment(event.urlAfterRedirects);
    });
  }

  // Variable para saber qué botón pintar como activo ('home', 'busqueda', 'generar')
  @Input() activeSegment: string = 'home';

  ngOnInit() {
    this.updateActiveSegment(this.router.url);

    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = user.nombreApellido || user.nombre || 'Usuario';
        const rolInt = user.primaryRole ?? user.rol ?? user.rol_analista ?? 0;
        this.userRolNum = rolInt;
        this.userRoles = Array.isArray(user.roles) && user.roles.length ? user.roles : [rolInt];
        this.userRole = this.buildUserRoleLabel(user);

        this.userPhoto = user.url_foto || user.urlFoto || 'https://ui-avatars.com/api/?name=' + (this.userName || 'U') + '&background=random';
        this.userInitials = this.getInitials(this.userName);
      } else {
        this.userName = 'Usuario';
        this.userRole = 'Analista';
        this.userRolNum = 0;
        this.userRoles = [0];
        this.userPhoto = 'https://ui-avatars.com/api/?name=Usuario&background=random';
        this.userInitials = 'U';
      }
    });
  }

  private updateActiveSegment(url: string) {
    if (url.includes('/home') || url.includes('/dashboard-')) {
      this.activeSegment = 'home';
    } else if (url.includes('/busqueda-solicitud-ingreso')) {
      this.activeSegment = 'busqueda-solicitud';
    } else if (url.includes('/busqueda-ali')) {
      this.activeSegment = 'busqueda';
    } else if (url.includes('/solicitud-ingreso')) {
      this.activeSegment = 'solicitud';
    } else if (url === '/') {
      this.activeSegment = 'home';
    }
  }

  private getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  private buildUserRoleLabel(user: SessionUser): string {
    const primaryRoleLabel = ROLE_LABELS[user.primaryRole] ?? ROLE_LABELS[0];
    const secondaryRoles = this.userRoles.filter((role) => role !== user.primaryRole).map((role) => ROLE_LABELS[role]).filter(Boolean);

    return secondaryRoles.length ? `${primaryRoleLabel} · ${secondaryRoles.join(' · ')}` : primaryRoleLabel;
  }

  canAccessNavigation(allowedRoles: number[]): boolean {
    return this.authService.canAccess(allowedRoles, { roles: this.userRoles } as SessionUser);
  }


  busquedaALI() {
    console.log("Redirigiendo a Busqueda ALI");
    this.router.navigate(["/busqueda-ali"]);
  }

  busquedaSolicitudIngreso() {
    console.log("Redirigiendo a Búsqueda Solicitud Ingreso");
    this.router.navigate(["/busqueda-solicitud-ingreso"]);
  }

  solicitudIngreso() {
    console.log("Redirigiendo a Solicitud de Ingreso");
    this.router.navigate(["/solicitud-ingreso"]);
  }

  goToHome() {
    console.log("Redirigiendo a Home");
    this.router.navigate(["/home"]);
  }

  goToLogin() {
    console.log("Cerrando sesión...");
    this.authService.logout(); // Limpiar token y usuario
    this.router.navigate(["/login"]);
  }

  goToProfile() {
    console.log("Redirigiendo a Configuración de Usuario");
    this.router.navigate(["/configuracion-usuario"]);
  }

}
