import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-ingreso',
  templateUrl: './dashboard-ingreso.page.html',
  styleUrls: ['./dashboard-ingreso.page.scss'],
  standalone: false
})
export class DashboardIngresoPage {
  private router = inject(Router);


  solicitudIngreso() {
    this.router.navigate(['/solicitud-ingreso']);
  }

  busquedaSolicitud() {
    this.router.navigate(['/busqueda-solicitud-ingreso']);
  }

}
