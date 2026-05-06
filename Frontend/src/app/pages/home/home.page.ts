import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth-service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);


  ngOnInit() {
    const user = this.authService.getUsuario();
    const rol = user?.rol !== undefined ? user.rol : (user?.rol_analista ?? 0);

    switch (rol) {
      case 3:
        this.router.navigate(['/dashboard-ingreso'], { replaceUrl: true });
        break;
      case 2:
        this.router.navigate(['/dashboard-jefe'], { replaceUrl: true });
        break;
      case 1:
        this.router.navigate(['/dashboard-coordinadora'], { replaceUrl: true });
        break;
      default:
        this.router.navigate(['/dashboard-analista'], { replaceUrl: true });
    }
  }

}
