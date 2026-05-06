import { Component, OnInit, Input, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth-service';

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
        
        const rolInt = user.rol !== undefined ? user.rol : (user.rol_analista ?? 0);
        this.userRolNum = rolInt;

        switch (rolInt) {
          case 1:
            this.userRole = 'Coordinadora de Área';
            break;
          case 2:
            this.userRole = 'Jefe de Área';
            break;
          case 3:
            this.userRole = 'Ingreso';
            break;
          default:
            this.userRolNum = 0;
            this.userRole = 'Analista';
        }

        this.userPhoto = user.url_foto || user.urlFoto || 'https://ui-avatars.com/api/?name=' + (this.userName || 'U') + '&background=random';
        this.userInitials = this.getInitials(this.userName);
      } else {
        this.userName = 'Usuario';
        this.userRole = 'Analista';
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
