import { Component, OnInit, inject } from '@angular/core';
import { Route, Router } from '@angular/router';
import { AuthService, SessionUser } from 'src/app/services/auth-service';

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
    if (!user) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    this.router.navigate([this.resolveLandingRoute(user)], { replaceUrl: true });
  }

  private resolveLandingRoute(user: SessionUser): string {
    const landingRoute = this.authService.getLandingRoute(user);
    const availableRoutes = this.router.config
      .filter((route: Route) => route.path && Array.isArray(route.data?.['allowedRoles']))
      .map((route: Route) => ({
        path: `/${route.path}`,
        allowedRoles: route.data?.['allowedRoles'] as number[]
      }));

    if (availableRoutes.some((route) => route.path === landingRoute)) {
      return landingRoute;
    }

    return availableRoutes.find((route) => this.authService.canAccess(route.allowedRoles, user))?.path ?? landingRoute;
  }

}
