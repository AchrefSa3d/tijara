import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

@Component({
  selector: 'app-vendor-detail-admin',
  templateUrl: './vendor-detail-admin.component.html',
  standalone: false
})
export class VendorDetailAdminComponent implements OnInit {

  breadCrumbItems = [
    { label: 'Admin' },
    { label: 'Vendeurs', link: '/admin/vendors' },
    { label: 'Profil vendeur', active: true }
  ];

  vendor: any = null;
  products: any[] = [];
  stats: any = {};
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: TijaraApiService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error = 'ID invalide.'; this.loading = false; return; }

    this.api.getAdminVendorDetails(id).subscribe({
      next: (res: any) => {
        this.vendor   = res.vendor;
        this.products = res.products;
        this.stats    = res.stats || {};
        this.loading  = false;
      },
      error: () => { this.error = 'Vendeur introuvable.'; this.loading = false; }
    });
  }

  get displayName(): string {
    return this.vendor?.shop_name || `${this.vendor?.first_name} ${this.vendor?.last_name}`;
  }

  get initials(): string {
    if (!this.vendor) return '?';
    return ((this.vendor.first_name?.[0] || '') + (this.vendor.last_name?.[0] || '')).toUpperCase();
  }

  get memberSince(): string {
    if (!this.vendor?.created_at) return '';
    return new Date(this.vendor.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  }

  getStars(n: number): number[] { return Array.from({ length: n }, (_, i) => i + 1); }

  getApprovalBadge(status: string): string {
    if (status === 'approved') return 'bg-success-subtle text-success';
    if (status === 'pending')  return 'bg-warning-subtle text-warning';
    return 'bg-danger-subtle text-danger';
  }

  getApprovalLabel(status: string): string {
    if (status === 'approved') return 'Approuvé';
    if (status === 'pending')  return 'En attente';
    return 'Rejeté';
  }

  back(): void { this.router.navigate(['/admin/vendors']); }
}
