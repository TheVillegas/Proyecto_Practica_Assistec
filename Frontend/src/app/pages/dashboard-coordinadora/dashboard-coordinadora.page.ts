import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-coordinadora',
  templateUrl: './dashboard-coordinadora.page.html',
  styleUrls: ['./dashboard-coordinadora.page.scss'],
  standalone: false
})
export class DashboardCoordinadoraPage {
  private router = inject(Router);


  busquedaSolicitud() {
    this.router.navigate(['/busqueda-solicitud-ingreso']);
  }

  busquedaALI() {
    this.router.navigate(['/busqueda-ali']);
  }

}
