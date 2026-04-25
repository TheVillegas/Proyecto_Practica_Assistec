import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  showHeader: boolean = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const hideOnRoutes = ['/login', '/register'];
      // Si la URL actual NO contiene 'login' ni 'register', mostramos el header
      this.showHeader = !hideOnRoutes.some(route => event.urlAfterRedirects.includes(route));
    });
  }
}
