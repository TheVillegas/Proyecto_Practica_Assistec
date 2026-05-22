import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Route, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth-service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
        const token = this.authService.getToken();

        if (!token) {
            return this.router.createUrlTree(['/login']);
        }

        const user = this.authService.getUsuario();
        const allowedRoles = route.data?.['allowedRoles'] as number[] | undefined;

        if (!allowedRoles?.length) {
            return true;
        }

        if (this.authService.canAccess(allowedRoles, user)) {
            return true;
        }

        return this.router.createUrlTree([this.getAuthorizedRoute()]);
    }

    private getAuthorizedRoute(): string {
        const user = this.authService.getUsuario();
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
