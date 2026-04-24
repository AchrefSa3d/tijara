import { Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';
import { environment } from 'src/environments/environment';

declare const google: any;
declare const FB: any;

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: false
})
export class LoginComponent implements OnInit, AfterViewInit {

    loginForm!: UntypedFormGroup;
    submitted       = false;
    loading         = false;
    error           = '';
    success         = '';
    fieldTextType   = false;
    year            = new Date().getFullYear();

    demoUsers = [
        { email: 'admin@tijara.tn',  password: 'admin123',  role: 'admin'  },
        { email: 'vendor@tijara.tn', password: 'vendor123', role: 'vendor' },
        { email: 'user@tijara.tn',   password: 'user123',   role: 'user'   },
    ];

    googleLoading    = false;
    facebookLoading  = false;
    googleConfigured = false;  // true uniquement si clientId réel configuré

    constructor(
        private fb: UntypedFormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private api: TijaraApiService,
        private ngZone: NgZone,
    ) {
        try {
            const raw = localStorage.getItem('currentUser');
            if (raw) {
                const user = JSON.parse(raw);
                if (user?.role) this.redirectByRole(user.role);
            }
        } catch {
            localStorage.removeItem('currentUser');
        }
    }

    ngOnInit(): void {
        this.loginForm = this.fb.group({
            email:    ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
        });
        this.route.queryParams.subscribe(p => {
            if (p['confirmed'] === '1')
                this.success = '✅ Email confirmé avec succès ! Vous pouvez maintenant vous connecter.';
        });
    }

    ngAfterViewInit(): void {
        this.initGoogleSignIn();
    }

    // ── Google Sign-In ────────────────────────────────────────────────

    initGoogleSignIn(): void {
        const clientId = environment.googleClientId || '';
        // Ne pas initialiser GIS si l'ID est un placeholder
        if (!clientId || clientId.includes('YOUR_GOOGLE') || clientId === '') {
            this.googleConfigured = false;
            return;
        }
        try {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: (response: any) => {
                    this.ngZone.run(() => this.handleGoogleCredential(response.credential));
                }
            });
            google.accounts.id.renderButton(
                document.getElementById('google-btn-login'),
                { theme: 'outline', size: 'large', width: 340, text: 'signin_with', logo_alignment: 'left' }
            );
            this.googleConfigured = true;
        } catch (e) {
            this.googleConfigured = false;
        }
    }

    handleGoogleCredential(credential: string): void {
        this.googleLoading = true;
        this.error = '';
        this.api.googleLogin(credential).subscribe({
            next: (res: any) => {
                this.googleLoading = false;
                const currentUser = this.buildCurrentUser(res);
                localStorage.setItem('toast', 'true');
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                this.redirectByRole(currentUser.role);
            },
            error: (err: any) => {
                this.googleLoading = false;
                this.error = err?.error?.message || 'Connexion Google échouée.';
            }
        });
    }

    /** Demo : connexion Google simulée (sans vrai OAuth) */
    loginDemoGoogle(): void {
        this.googleLoading = true;
        setTimeout(() => {
            this.googleLoading = false;
            const currentUser = {
                token:          'demo_google_token',
                id:             9001,
                email:          'demo.google@tijara.tn',
                role:           'user',
                firstName:      'Demo Google',
                lastName:       '',
                shopName:       '',
                phone:          '',
                city:           '',
                address:        '',
                country:        'Tunisie',
                profilePicture: '',
                isApproved:     true,
            };
            localStorage.setItem('toast', 'true');
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            this.redirectByRole('user');
        }, 800);
    }

    // ── Facebook Login ────────────────────────────────────────────────

    facebookLogin(): void {
        // Vérifier si l'App ID Facebook est valide (pas '0' ou vide)
        const fbAppId = environment.facebookAppId || '0';
        if (!fbAppId || fbAppId === '0' || fbAppId === '') {
            this.loginDemoFacebook();
            return;
        }

        this.facebookLoading = true;
        this.error = '';
        try {
            FB.login((loginResp: any) => {
                if (loginResp.authResponse?.accessToken) {
                    const token = loginResp.authResponse.accessToken;
                    this.api.facebookLogin(token).subscribe({
                        next: (res: any) => {
                            this.ngZone.run(() => {
                                this.facebookLoading = false;
                                const currentUser = this.buildCurrentUser(res);
                                localStorage.setItem('toast', 'true');
                                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                                this.redirectByRole(currentUser.role);
                            });
                        },
                        error: (err: any) => {
                            this.ngZone.run(() => {
                                this.facebookLoading = false;
                                this.error = err?.error?.message || 'Connexion Facebook échouée.';
                            });
                        }
                    });
                } else {
                    this.ngZone.run(() => {
                        this.facebookLoading = false;
                        if (loginResp.status !== 'unknown') {
                            this.error = 'Connexion Facebook annulée.';
                        }
                    });
                }
            }, { scope: 'public_profile,email' });
        } catch {
            this.facebookLoading = false;
            this.loginDemoFacebook();
        }
    }

    /** Demo : connexion Facebook simulée (sans vrai App ID) */
    private loginDemoFacebook(): void {
        this.facebookLoading = true;
        setTimeout(() => {
            this.facebookLoading = false;
            const currentUser = {
                token:          'demo_facebook_token',
                id:             9002,
                email:          'demo.facebook@tijara.tn',
                role:           'user',
                firstName:      'Demo Facebook',
                lastName:       '',
                shopName:       '',
                phone:          '',
                city:           '',
                address:        '',
                country:        'Tunisie',
                profilePicture: '',
                isApproved:     true,
            };
            localStorage.setItem('toast', 'true');
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            this.redirectByRole('user');
        }, 800);
    }

    private getFBAppId(): string {
        try {
            // Lire l'App ID depuis le script FB déjà initialisé
            const match = document.cookie.match(/fblo_(\d+)/);
            if (match) return match[1];
            // Fallback : lire depuis le SDK
            return (window as any).FB?.AppID?.toString() || '0';
        } catch {
            return '0';
        }
    }

    // ── Formulaire e-mail ─────────────────────────────────────────────

    get f() { return this.loginForm.controls; }

    toggleFieldTextType(): void { this.fieldTextType = !this.fieldTextType; }

    fillDemo(user: any): void {
        this.loginForm.patchValue({ email: user.email, password: user.password });
    }

    onSubmit(): void {
        this.submitted = true;
        this.error     = '';
        if (this.loginForm.invalid) return;

        this.loading = true;
        const email    = this.f['email'].value.trim().toLowerCase();
        const password = this.f['password'].value;

        this.api.login(email, password).subscribe({
            next: (res: any) => {
                this.loading = false;
                const currentUser = this.buildCurrentUser(res);
                localStorage.setItem('toast', 'true');
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                this.redirectByRole(currentUser.role);
            },
            error: (err: any) => {
                this.loading = false;
                if (err?.error?.status === 'pending_approval') {
                    this.error = '⏳ Votre compte vendeur est en attente de validation par l\'administrateur.';
                } else {
                    this.error = err?.error?.message || 'Email ou mot de passe incorrect.';
                }
            }
        });
    }

    private buildCurrentUser(res: any) {
        return {
            token:          res.token,
            id:             res.user.id,
            email:          res.user.email,
            role:           res.user.role,
            firstName:      res.user.first_name  || '',
            lastName:       res.user.last_name   || '',
            shopName:       res.user.shop_name   || '',
            phone:          res.user.phone       || '',
            city:           res.user.city        || '',
            address:        res.user.address     || '',
            country:        res.user.country     || 'Tunisie',
            profilePicture: res.user.profile_picture || '',
            isApproved:     res.user.is_approved,
        };
    }

    private redirectByRole(role: string): void {
        if (role === 'admin')       this.router.navigate(['/admin/reclamations']);
        else if (role === 'vendor') this.router.navigate(['/ent/dashboard']);
        else                        this.router.navigate(['/users/dashboard']);
    }
}
