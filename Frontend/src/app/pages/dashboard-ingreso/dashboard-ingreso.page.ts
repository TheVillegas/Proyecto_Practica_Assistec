import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-ingreso',
  templateUrl: './dashboard-ingreso.page.html',
  styleUrls: ['./dashboard-ingreso.page.scss'],
  standalone: false
})
export class DashboardIngresoPage {

  constructor(private router: Router) {}

  solicitudIngreso() {
    this.router.navigate(['/solicitud-ingreso']);
  }

  busquedaSolicitud() {
    this.router.navigate(['/busqueda-solicitud-ingreso']);
  }

}
