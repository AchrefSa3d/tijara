import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

/**
 * Guard : seuls les utilisateurs avec role='user' peuvent accéder aux routes /shop
 * Les admin/vendor sont redirigés vers leur dashboard respectif
 */
@Injectable({ providedIn: 'root' })
export class UserOnlyGuard {
    constructor(private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const raw = localStorage.getItem('currentUser');
        if (!raw) {
            this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
            return false;
        }
        try {
            const user = JSON.parse(raw);
            if (!user?.token) {
                this.router.navigate(['/auth/login']);
                return false;
            }
            if (user.role === 'admin') {
                this.router.navigate(['/admin/reclamations']);
                return false;
            }
            if (user.role === 'vendor') {
                this.router.navigate(['/ent/dashboard']);
                return false;
            }
            return true; // role === 'user'
        } catch {
            localStorage.removeItem('currentUser');
            this.router.navigate(['/auth/login']);
            return false;
        }
    }
}
