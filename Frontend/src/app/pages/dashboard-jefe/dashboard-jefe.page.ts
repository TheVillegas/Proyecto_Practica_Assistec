import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-jefe',
  templateUrl: './dashboard-jefe.page.html',
  styleUrls: ['./dashboard-jefe.page.scss'],
  standalone: false
})
export class DashboardJefePage {
  private router = inject(Router);


  busquedaSolicitud() {
    this.router.navigate(['/busqueda-solicitud-ingreso']);
  }

  busquedaALI() {
    this.router.navigate(['/busqueda-ali']);
  }

}
