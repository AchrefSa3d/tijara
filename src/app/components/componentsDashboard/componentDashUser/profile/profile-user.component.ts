import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

@Component({
  selector: 'app-profile-user',
  templateUrl: './profile-user.component.html',
  standalone: false
})
export class ProfileUserComponent implements OnInit {

  breadcrumbItems: any[] = [];

  activeTab: 'info' | 'security' | 'follows' = 'info';
  infoForm!: FormGroup;
  pwdForm!: FormGroup;
  isVendor = false;

  submitted   = false;
  pwdSubmit   = false;
  saving      = false;
  saveMsg     = '';
  saveError   = '';
  loading     = true;
  showCurPwd  = false;
  showNewPwd  = false;
  showConPwd  = false;

  profilePicture = '';
  uploadedImageUrl = ''; // URL retournée par le serveur
  uploading = false;
  uploadError = '';
  ordersStats = { total: 0, delivered: 0, pending: 0, totalSpent: 0 };
  followedVendors: any[] = [];
  followsLoading = false;

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
    this.translate.get(['MY_ACCOUNT.TEXT', 'PROFILE.TEXT']).subscribe(t => {
      this.breadcrumbItems = [
        { label: t['MY_ACCOUNT.TEXT'] },
        { label: t['PROFILE.TEXT'], active: true }
      ];
    });
    this.buildForms();
    this.loadProfile();
    this.loadStats();
    this.loadFollows();
  }

  buildForms() {
    try {
      const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
      this.isVendor = u?.role === 'vendor';
    } catch {}

    this.infoForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName:  ['', [Validators.required, Validators.minLength(2)]],
      shopName:  [''],
      phone:     ['', [Validators.pattern(/^[2-9]\d{7}$/)]],
      city:      [''],
      address:   [''],
      birthDate: [''],
      gender:    [''],
    });
    this.pwdForm = this.fb.group({
      currentPwd: ['', Validators.required],
      newPwd:     ['', [Validators.required, Validators.minLength(6)]],
      confirmPwd: ['', Validators.required],
    });
  }

  loadProfile() {
    try {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const u = JSON.parse(raw);
        this.isVendor       = u?.role === 'vendor';
        this.profilePicture = u.profilePicture || '';
        this.infoForm.patchValue({
          firstName: u.firstName || '',
          lastName:  u.lastName  || '',
          shopName:  u.shopName  || '',
          phone:     u.phone     || '',
          city:      u.city      || '',
        });
        this.loading = false;
      }
    } catch {}

    this.api.getMe().subscribe({
      next: (u: any) => {
        this.isVendor       = u?.role === 'vendor';
        this.profilePicture = u.profile_picture || '';
        this.infoForm.patchValue({
          firstName: u.first_name  || '',
          lastName:  u.last_name   || '',
          shopName:  u.shop_name   || '',
          phone:     u.phone       || '',
          city:      u.city        || '',
          address:   u.address     || '',
          birthDate: u.birth_date ? u.birth_date.substring(0, 10) : '',
          gender:    u.gender      || '',
        });
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadStats() {
    this.api.getOrders().subscribe({
      next: (orders: any[]) => {
        this.ordersStats.total      = orders.length;
        this.ordersStats.delivered  = orders.filter(o => o.status === 'delivered').length;
        this.ordersStats.pending    = orders.filter(o => o.status === 'pending').length;
        this.ordersStats.totalSpent = orders.reduce((s, o) => s + (+o.total_amount || 0), 0);
      }
    });
  }

  loadFollows(): void {
    this.followsLoading = true;
    this.api.getMyFollows().subscribe({
      next: (data: any[]) => { this.followedVendors = data; this.followsLoading = false; },
      error: () => { this.followsLoading = false; }
    });
  }

  unfollowVendor(vendorId: number): void {
    this.api.toggleFollow(vendorId).subscribe({
      next: () => { this.followedVendors = this.followedVendors.filter(v => v.id !== vendorId); }
    });
  }

  get fi() { return this.infoForm.controls; }
  get fp() { return this.pwdForm.controls; }

  get initials(): string {
    const fn = this.fi['firstName'].value || '';
    const ln = this.fi['lastName'].value  || '';
    return `${fn[0] || ''}${ln[0] || ''}`.toUpperCase() || 'U';
  }

  get fullName(): string {
    return `${this.fi['firstName'].value} ${this.fi['lastName'].value}`.trim() || 'Client';
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) { alert('Image trop grande (max 2MB).'); return; }
    
    // Afficher preview immédiatement
    const reader = new FileReader();
    reader.onload = (e: any) => { this.profilePicture = e.target.result; };
    reader.readAsDataURL(file);
    
    // Uploader le fichier au serveur
    this.uploading = true;
    this.uploadError = '';
    this.api.uploadImage(file, 'users').subscribe({
      next: (response: any) => {
        this.uploadedImageUrl = response.url || response.imageUrl || response.path || '';
        this.uploading = false;
        console.log('Image uploadée:', this.uploadedImageUrl);
      },
      error: (error: any) => {
        this.uploading = false;
        this.uploadError = error?.error?.message || 'Erreur lors du téléchargement de l\'image.';
        this.profilePicture = '';
        this.uploadedImageUrl = '';
        input.value = '';
      }
    });
  }

  saveProfile() {
    this.submitted = true;
    if (this.infoForm.invalid) return;
    this.saving    = true;
    this.saveMsg   = '';
    this.saveError = '';

    const v = this.infoForm.value;
    this.api.updateProfile({
      first_name:      v.firstName,
      last_name:       v.lastName,
      username:        v.shopName   || null,
      phone:           v.phone,
      city:            v.city,
      address:         v.address,
      profile_picture: this.uploadedImageUrl || null, // Utiliser l'URL du serveur
      birth_date:      v.birthDate  || null,
      gender:          v.gender     || null,
    }).subscribe({
      next: (res: any) => {
        this.saving    = false;
        this.translate.get('PROFILE.SAVE_CHANGES').subscribe(t => this.saveMsg = t + ' ✓');
        this.submitted = false;
        this.uploadedImageUrl = '';
        this.updateLocalStorage(res.user);
        setTimeout(() => this.saveMsg = '', 4000);
      },
      error: (err: any) => {
        this.saving    = false;
        this.saveError = err?.error?.message || 'Erreur lors de la sauvegarde.';
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
          firstName:      user.first_name  || stored.firstName,
          lastName:       user.last_name   || stored.lastName,
          shopName:       user.shop_name   || stored.shopName,
          phone:          user.phone       || stored.phone,
          city:           user.city        || stored.city,
          profilePicture: user.profile_picture,
        }));
      }
    } catch {}
  }
}