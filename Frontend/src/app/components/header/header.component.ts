import { Component, OnInit, Input } from '@angular/core';
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

  userName: string = 'Usuario';
  userRole: string = 'Analista';

  constructor(private router: Router, private authService: AuthService) {
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

    // Obtener usuario actual
    const user = this.authService.getUsuario();
    if (user) {
      this.userName = user.nombreApellido || 'Usuario';
      this.userRole = user.rol || 'Analista';
    }
  }

  private updateActiveSegment(url: string) {
    if (url.includes('/home')) {
      this.activeSegment = 'home';
    } else if (url.includes('/busqueda-ali')) {
      this.activeSegment = 'busqueda';
    } else if (url.includes('/generar-ali-basico')) {
      this.activeSegment = 'generar';
    } else if (url === '/') {
      this.activeSegment = 'home';
    }
  }

  busquedaALI() {
    console.log("Redirigiendo a Busqueda ALI");
    this.router.navigate(["/busqueda-ali"]);
  }

  generarALI() {
    console.log("Redirigiendo a Generar ALI");
    this.router.navigate(["/generar-ali-basico"]);
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
