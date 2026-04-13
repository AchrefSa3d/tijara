import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

@Component({
  selector: 'app-user-detail-admin',
  templateUrl: './user-detail-admin.component.html',
  standalone: false
})
export class UserDetailAdminComponent implements OnInit {

  breadCrumbItems = [
    { label: 'Admin' },
    { label: 'Utilisateurs', link: '/admin/users' },
    { label: 'Profil client', active: true }
  ];

  user: any = null;
  orders: any[] = [];
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

    this.api.getAdminUserDetails(id).subscribe({
      next: (res: any) => {
        this.user   = res.user;
        this.orders = res.orders;
        this.stats  = res.stats || {};
        this.loading = false;
      },
      error: () => { this.error = 'Utilisateur introuvable.'; this.loading = false; }
    });
  }

  get initials(): string {
    if (!this.user) return '?';
    return ((this.user.first_name?.[0] || '') + (this.user.last_name?.[0] || '')).toUpperCase();
  }

  get fullName(): string {
    return `${this.user?.first_name || ''} ${this.user?.last_name || ''}`.trim();
  }

  get memberSince(): string {
    if (!this.user?.created_at) return '';
    return new Date(this.user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'pending':   return 'bg-warning-subtle text-warning';
      case 'confirmed': return 'bg-info-subtle text-info';
      case 'shipped':   return 'bg-primary-subtle text-primary';
      case 'delivered': return 'bg-success-subtle text-success';
      case 'cancelled': return 'bg-danger-subtle text-danger';
      default:          return 'bg-secondary-subtle text-secondary';
    }
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'En attente', confirmed: 'Confirmée',
      shipped: 'Expédiée',   delivered: 'Livrée', cancelled: 'Annulée'
    };
    return map[status] || status;
  }

  countByStatus(status: string): number {
    return this.orders.filter(o => o.status === status).length;
  }

  back(): void { this.router.navigate(['/admin/users']); }
}
