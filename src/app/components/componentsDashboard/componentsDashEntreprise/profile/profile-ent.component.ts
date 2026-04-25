import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

@Component({
  selector: 'app-profile-ent',
  templateUrl: './profile-ent.component.html',
  styleUrls: ['./profile-ent.component.scss'],
  standalone: false
})
export class ProfileEntComponent implements OnInit {

  breadCrumbItems: any[] = [];

  activeTab: 'infos' | 'boutique' | 'securite' = 'infos';
  infoForm!: FormGroup;
  shopForm!: FormGroup;
  pwdForm!: FormGroup;

  submitted      = false;
  shopSubmit     = false;
  pwdSubmit      = false;
  saving         = false;
  saveMsg        = '';
  saveError      = '';
  showCurrentPwd = false;
  showNewPwd     = false;
  showConfirmPwd = false;
  loading        = true;

  profilePicture = '';
  uploading      = false;

  wilayas = [
    'Tunis','Ariana','Ben Arous','Manouba','Nabeul','Sousse','Sfax',
    'Monastir','Mahdia','Kairouan','Bizerte','Béja','Jendouba',
    'Gabès','Médenine','Gafsa','Tozeur','Kébili','Tataouine','Kasserine','Hammamet'
  ];

  constructor(
    private fb: FormBuilder,
    private api: TijaraApiService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Translate breadcrumb dynamically
    this.translate.get(['PROFILE.VENDOR_LABEL', 'PROFILE.TEXT']).subscribe(t => {
      this.breadCrumbItems = [
        { label: t['PROFILE.VENDOR_LABEL'] },
        { label: t['PROFILE.TEXT'], active: true }
      ];
    });
    this.buildForms();
    this.loadProfile();
  }

  buildForms() {
    this.infoForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName:  ['', [Validators.required, Validators.minLength(2)]],
      phone:     [''],
      city:      [''],
      address:   [''],
    });
    this.shopForm = this.fb.group({
      shopName:      ['', [Validators.required, Validators.minLength(3)]],
      companyNumber: [''],
    });
    this.pwdForm = this.fb.group({
      currentPwd: ['', Validators.required],
      newPwd:     ['', [Validators.required, Validators.minLength(6)]],
      confirmPwd: ['', Validators.required],
    });
  }

  loadProfile() {
    this.loading = true;
    this.api.getMe().subscribe({
      next: (u: any) => {
        this.profilePicture = u.profile_picture || '';
        this.infoForm.patchValue({
          firstName: u.first_name || '',
          lastName:  u.last_name  || '',
          phone:     u.phone      || '',
          city:      u.city       || '',
          address:   u.address    || '',
        });
        this.shopForm.patchValue({
          shopName:      u.shop_name      || '',
          companyNumber: u.company_number || '',
        });
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get fi() { return this.infoForm.controls; }
  get fs() { return this.shopForm.controls; }
  get fp() { return this.pwdForm.controls; }

  get initials(): string {
    const fn = this.fi['firstName'].value || '';
    const ln = this.fi['lastName'].value  || '';
    return `${fn[0] || ''}${ln[0] || ''}`.toUpperCase() || 'V';
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) { alert('Image trop grande (max 2MB).'); return; }
    const reader = new FileReader();
    reader.onload = (e: any) => { this.profilePicture = e.target.result; };
    reader.readAsDataURL(file);
  }

  saveInfos() {
    this.submitted = true;
    if (this.infoForm.invalid) return;
    this.saving    = true;
    this.saveMsg   = '';
    this.saveError = '';

    const v = this.infoForm.value;
    this.api.updateProfile({
      first_name:      v.firstName,
      last_name:       v.lastName,
      phone:           v.phone,
      city:            v.city,
      address:         v.address,
      profile_picture: this.profilePicture || null,
    }).subscribe({
      next: (res: any) => {
        this.saving    = false;
        this.saveMsg   = 'Informations mises à jour avec succès.';
        this.submitted = false;
        this.updateLocalStorage(res.user);
        setTimeout(() => this.saveMsg = '', 4000);
      },
      error: (err: any) => {
        this.saving    = false;
        this.saveError = err?.error?.message || 'Erreur lors de la sauvegarde.';
      }
    });
  }

  saveBoutique() {
    this.shopSubmit = true;
    if (this.shopForm.invalid) return;
    this.saving    = true;
    this.saveMsg   = '';
    this.saveError = '';

    const v = this.shopForm.value;
    this.api.updateProfile({
      shop_name:      v.shopName,
      company_number: v.companyNumber,
    }).subscribe({
      next: (res: any) => {
        this.saving     = false;
        this.saveMsg    = 'Informations boutique mises à jour.';
        this.shopSubmit = false;
        this.updateLocalStorage(res.user);
        setTimeout(() => this.saveMsg = '', 4000);
      },
      error: (err: any) => {
        this.saving    = false;
        this.saveError = err?.error?.message || 'Erreur.';
      }
    });
  }

  changePassword() {
    this.pwdSubmit = true;
    if (this.pwdForm.invalid) return;
    if (this.fp['newPwd'].value !== this.fp['confirmPwd'].value) return;

    this.saving    = true;
    this.saveMsg   = '';
    this.saveError = '';

    this.api.changePassword({
      current_password: this.fp['currentPwd'].value,
      new_password:     this.fp['newPwd'].value,
    }).subscribe({
      next: () => {
        this.saving    = false;
        this.saveMsg   = 'Mot de passe modifié avec succès.';
        this.pwdSubmit = false;
        this.pwdForm.reset();
        setTimeout(() => this.saveMsg = '', 4000);
      },
      error: (err: any) => {
        this.saving    = false;
        this.saveError = err?.error?.message || 'Mot de passe actuel incorrect.';
      }
    });
  }

  get pwdMismatch(): boolean {
    return this.pwdSubmit && this.fp['newPwd'].value !== this.fp['confirmPwd'].value;
  }

  private updateLocalStorage(user: any) {
    try {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const stored = JSON.parse(raw);
        localStorage.setItem('currentUser', JSON.stringify({
          ...stored,
          firstName:      user.first_name || stored.firstName,
          lastName:       user.last_name  || stored.lastName,
          phone:          user.phone      || stored.phone,
          city:           user.city       || stored.city,
          shopName:       user.shop_name  || stored.shopName,
          profilePicture: user.profile_picture,
        }));
      }
    } catch {}
  }
}