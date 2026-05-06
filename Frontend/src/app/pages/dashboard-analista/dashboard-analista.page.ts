import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-analista',
  templateUrl: './dashboard-analista.page.html',
  styleUrls: ['./dashboard-analista.page.scss'],
  standalone: false
})
export class DashboardAnalistaPage {
  private router = inject(Router);


  busquedaALI() {
    this.router.navigate(['/busqueda-ali']);
  }

}
