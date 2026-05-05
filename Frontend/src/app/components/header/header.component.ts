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
  @Input() activeSegment: string = 'home';

  userName = 'Usuario';
  userRole = 'Analista';
  userPhoto = '';

  constructor(private router: Router, private authService: AuthService) {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateActiveSegment(event.urlAfterRedirects);
    });
  }

  ngOnInit() {
    this.updateActiveSegment(this.router.url);

    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.userName = user.nombreApellido || user.nombre || 'Usuario';

        const rolInt = user.rol !== undefined ? user.rol : user.rol_analista;
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
            this.userRole = 'Analista';
        }

        this.userPhoto = user.url_foto || user.urlFoto || `https://ui-avatars.com/api/?name=${this.userName || 'U'}&background=random`;
      } else {
        this.userName = 'Usuario';
        this.userRole = 'Analista';
        this.userPhoto = 'https://ui-avatars.com/api/?name=Usuario&background=random';
      }
    });
  }

  private updateActiveSegment(url: string) {
    if (url.includes('/home')) {
      this.activeSegment = 'home';
    } else if (url.includes('/busqueda-ali')) {
      this.activeSegment = 'busqueda';
    } else if (url.includes('/solicitud-ingreso') || url.includes('/generar-ali-basico')) {
      this.activeSegment = 'generar';
    } else if (url === '/') {
      this.activeSegment = 'home';
    }
  }

  busquedaALI() {
    this.router.navigate(['/busqueda-ali']);
  }

  generarALI() {
    this.router.navigate(['/solicitud-ingreso']);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  goToLogin() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToProfile() {
    this.router.navigate(['/configuracion-usuario']);
  }
}
