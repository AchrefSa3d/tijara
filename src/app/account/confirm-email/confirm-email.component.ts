import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

@Component({
    selector: 'app-confirm-email',
    templateUrl: './confirm-email.component.html',
    standalone: false
})
export class ConfirmEmailComponent implements OnInit {

    state: 'loading' | 'success' | 'error' = 'loading';
    message = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private api: TijaraApiService
    ) {}

    ngOnInit(): void {
        const token = this.route.snapshot.queryParamMap.get('token') || '';
        if (!token) {
            this.state   = 'error';
            this.message = 'Token manquant. Ce lien est invalide.';
            return;
        }
        this.api.confirmEmail(token).subscribe({
            next: () => {
                this.state = 'success';
                setTimeout(() => this.router.navigate(['/auth/login'], { queryParams: { confirmed: '1' } }), 2500);
            },
            error: (err: any) => {
                this.state   = 'error';
                this.message = err?.error?.message || 'Lien invalide ou expiré.';
            }
        });
    }

    goLogin(): void { this.router.navigate(['/auth/login']); }
}
