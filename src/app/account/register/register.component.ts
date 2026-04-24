import { Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';
import { environment } from 'src/environments/environment';

declare const google: any;
declare const FB: any;

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
    standalone: false
})
export class RegisterComponent implements OnInit, AfterViewInit {

    signupForm!: UntypedFormGroup;
    submitted        = false;
    loading          = false;
    googleLoading    = false;
    facebookLoading  = false;
    error            = '';
    fieldTextType    = false;
    pendingApproval  = false;
    emailSent        = false;   // confirmation email sent
    registeredEmail  = '';
    year: number     = new Date().getFullYear();

    constructor(
        private fb: UntypedFormBuilder,
        private router: Router,
        private api: TijaraApiService,
        private ngZone: NgZone,
    ) {}

    ngOnInit(): void {
        this.signupForm = this.fb.group({
            role:          ['user'],
            firstName:     ['', Validators.required],
            lastName:      ['', Validators.required],
            phone:         [''],
            city:          [''],
            shopName:      [''],
            companyNumber: [''],
            email:         ['', [Validators.required, Validators.email]],
            password:      ['', [Validators.required, Validators.minLength(6)]],
            birthDate:     [''],   // date de naissance (client uniquement)
            gender:        [''],   // genre (client uniquement)
        });
    }

    ngAfterViewInit(): void {
        this.initGoogleSignIn();
    }

    initGoogleSignIn(): void {
        try {
            google.accounts.id.initialize({
                client_id: environment.googleClientId,
                callback: (response: any) => {
                    this.ngZone.run(() => this.handleGoogleCredential(response.credential));
                }
            });
            google.accounts.id.renderButton(
                document.getElementById('google-btn-register'),
                { theme: 'outline', size: 'large', width: 340, text: 'signup_with', logo_alignment: 'left' }
            );
        } catch (e) {}
    }

    handleGoogleCredential(credential: string): void {
        this.googleLoading = true;
        this.error = '';
        this.api.googleLogin(credential).subscribe({
            next: (res: any) => {
                this.googleLoading = false;
                const currentUser = {
                    token:     res.token,
                    id:        res.user.id,
                    email:     res.user.email,
                    role:      res.user.role,
                    firstName: res.user.first_name,
                    lastName:  res.user.last_name,
                    shopName:  res.user.shop_name || '',
                };
                localStorage.setItem('toast', 'true');
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                this.router.navigate(['/users/dashboard']);
            },
            error: (err: any) => {
                this.googleLoading = false;
                this.error = err?.error?.message || 'Connexion Google échouée.';
            }
        });
    }

    get f() { return this.signupForm.controls; }

    setRole(role: string): void {
        this.signupForm.patchValue({ role });
        // Ajouter/retirer validation boutique selon le rôle
        if (role === 'vendor') {
            this.f['shopName'].setValidators(Validators.required);
        } else {
            this.f['shopName'].clearValidators();
        }
        this.f['shopName'].updateValueAndValidity();
    }

    toggleFieldTextType() { this.fieldTextType = !this.fieldTextType; }

    facebookLogin(): void {
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
                                const currentUser = {
                                    token:          res.token,
                                    id:             res.user.id,
                                    email:          res.user.email,
                                    role:           res.user.role || 'user',
                                    firstName:      res.user.first_name || '',
                                    lastName:       res.user.last_name  || '',
                                    shopName:       res.user.shop_name  || '',
                                    profilePicture: res.user.profile_picture || '',
                                };
                                localStorage.setItem('toast', 'true');
                                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                                this.router.navigate(['/users/dashboard']);
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
                    this.ngZone.run(() => { this.facebookLoading = false; });
                }
            }, { scope: 'public_profile,email' });
        } catch {
            this.facebookLoading = false;
            this.error = 'Facebook SDK non disponible.';
        }
    }

    onSubmit() {
        this.submitted = true;
        this.error = '';
        if (this.signupForm.invalid) return;

        this.loading = true;

        this.api.register({
            first_name:     this.f['firstName'].value.trim(),
            last_name:      this.f['lastName'].value.trim(),
            email:          this.f['email'].value.trim().toLowerCase(),
            phone:          this.f['phone'].value?.trim() || '',
            city:           this.f['city'].value?.trim() || '',
            password:       this.f['password'].value,
            role:           this.f['role'].value,
            shop_name:      this.f['shopName'].value?.trim() || '',
            company_number: this.f['companyNumber'].value?.trim() || '',
            birth_date:     this.f['birthDate'].value || null,
            gender:         this.f['gender'].value   || null,
        }).subscribe({
            next: (res: any) => {
                this.loading = false;
                if (res.status === 'pending_approval') {
                    // Vendeur → attente validation
                    this.pendingApproval = true;
                } else if (res.email_sent) {
                    // Client → email de confirmation envoyé
                    this.emailSent       = true;
                    this.registeredEmail = this.f['email'].value.trim().toLowerCase();
                } else if (res.token) {
                    // Client → connexion directe (sans confirmation)
                    const currentUser = {
                        token:     res.token,
                        id:        res.user?.id,
                        email:     res.user?.email,
                        role:      res.user?.role || 'user',
                        firstName: res.user?.first_name || '',
                        lastName:  res.user?.last_name  || '',
                        shopName:  res.user?.shop_name  || '',
                    };
                    localStorage.setItem('toast',       'true');
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    this.router.navigate(['/users/dashboard']);
                } else {
                    this.router.navigate(['/auth/login']);
                }
            },
            error: (err: any) => {
                this.loading = false;
                this.error = err?.error?.message || 'Erreur lors de l\'inscription. Vérifiez vos données.';
            }
        });
    }
}
