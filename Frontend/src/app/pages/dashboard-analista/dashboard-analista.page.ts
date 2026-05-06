import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-analista',
  templateUrl: './dashboard-analista.page.html',
  styleUrls: ['./dashboard-analista.page.scss'],
  standalone: false
})
export class DashboardAnalistaPage {

  constructor(private router: Router) {}

  busquedaALI() {
    this.router.navigate(['/busqueda-ali']);
  }

}
