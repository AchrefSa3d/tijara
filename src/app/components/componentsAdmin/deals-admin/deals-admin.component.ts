import { Component, OnInit } from '@angular/core';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

@Component({
  selector: 'app-deals-admin',
  standalone: false,
  template: `
<div class="container-fluid">
  <app-breadcrumbs [breadcrumbItems]="breadCrumbItems"></app-breadcrumbs>

  <!-- Stats bar -->
  <div class="row g-3 mb-4">
    @for (s of stats; track s.label) {
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center gap-3 p-3">
            <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                 style="width:44px;height:44px" [style.background]="s.bg">
              <i [class]="s.icon + ' fs-20'" [style.color]="s.color"></i>
            </div>
            <div>
              <div class="fw-bold fs-20">{{ s.value }}</div>
              <div class="fs-12 text-muted">{{ s.label }}</div>
            </div>
          </div>
        </div>
      </div>
    }
  </div>

  <!-- Filters -->
  <div class="row g-2 mb-3 align-items-center">
    <div class="col">
      <div class="d-flex gap-2">
        @for (f of filters; track f.key) {
          <button class="btn btn-sm"
                  [class]="activeFilter===f.key ? f.activeClass : 'btn-outline-secondary'"
                  (click)="setFilter(f.key)">
            {{ f.label }}
          </button>
        }
      </div>
    </div>
    <div class="col-auto">
      <input type="text" class="form-control form-control-sm" style="width:230px"
             placeholder="Rechercher un deal..." [(ngModel)]="searchTerm" (input)="applyFilter()">
    </div>
  </div>

  <!-- Table -->
  @if (loading) {
    <div class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>
  } @else {
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead style="background:#f8f9fc">
              <tr>
                <th class="ps-3">Deal</th>
                <th>Vendeur</th>
                <th>Prix</th>
                <th>Catégorie</th>
                <th>Date</th>
                <th>Statut</th>
                <th class="text-end pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (filtered.length === 0) {
                <tr>
                  <td colspan="7" class="text-center py-5 text-muted">
                    <i class="ri-price-tag-3-line fs-36 d-block mb-2 opacity-30"></i>
                    Aucun deal trouvé
                  </td>
                </tr>
              }
              @for (d of filtered; track d.id) {
                <tr>
                  <td class="ps-3">
                    <div class="d-flex align-items-center gap-3">
                      <div class="rounded-2 overflow-hidden flex-shrink-0"
                           style="width:44px;height:44px;background:#f3f4f8">
                        @if (d.image) {
                          <img [src]="d.image" style="width:100%;height:100%;object-fit:cover" alt="">
                        } @else {
                          <div class="d-flex align-items-center justify-content-center h-100">
                            <i class="ri-price-tag-3-line text-muted fs-20"></i>
                          </div>
                        }
                      </div>
                      <div>
                        <div class="fw-medium fs-14 text-truncate" style="max-width:220px">{{ d.title }}</div>
                        <div class="fs-12 text-muted">ID #{{ d.id }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="fw-medium fs-13">{{ d.vendor_name }}</div>
                    @if (d.shop_name) {
                      <div class="fs-12 text-muted">{{ d.shop_name }}</div>
                    }
                  </td>
                  <td>
                    <span class="fw-semibold text-primary">{{ d.price }} TND</span>
                    @if (d.discount) {
                      <div class="badge bg-danger-subtle text-danger fs-10">-{{ d.discount }}%</div>
                    }
                  </td>
                  <td>
                    <span class="badge bg-light text-dark border">{{ d.category || '—' }}</span>
                  </td>
                  <td class="text-muted fs-12">{{ d.date | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <span class="badge rounded-pill"
                          [class]="d.is_active ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'">
                      {{ d.is_active ? 'Actif' : 'En attente' }}
                    </span>
                  </td>
                  <td class="text-end pe-3">
                    <div class="d-flex justify-content-end gap-1">
                      <button class="btn btn-sm"
                              [class]="d.is_active ? 'btn-outline-warning' : 'btn-outline-success'"
                              [title]="d.is_active ? 'Désactiver' : 'Activer'"
                              (click)="toggle(d)">
                        <i [class]="d.is_active ? 'ri-eye-off-line' : 'ri-check-line'"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" title="Supprimer" (click)="remove(d)">
                        <i class="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination footer -->
        <div class="px-3 py-2 d-flex align-items-center justify-content-between border-top bg-light">
          <span class="text-muted fs-12">{{ filtered.length }} deal(s) affiché(s)</span>
        </div>
      </div>
    </div>
  }
</div>
  `
})
export class DealsAdminComponent implements OnInit {
  breadCrumbItems = [
    { label: 'Admin' },
    { label: 'Gestion Deals', active: true }
  ];

  allDeals: any[]  = [];
  filtered: any[]  = [];
  loading          = true;
  activeFilter     = 'all';
  searchTerm       = '';

  filters = [
    { key: 'all',     label: 'Tous',        activeClass: 'btn-primary'  },
    { key: 'active',  label: 'Actifs',       activeClass: 'btn-success' },
    { key: 'pending', label: 'En attente',   activeClass: 'btn-warning' },
  ];

  get stats() {
    const total   = this.allDeals.length;
    const actifs  = this.allDeals.filter(d => d.is_active).length;
    const pending = this.allDeals.filter(d => !d.is_active).length;
    return [
      { label: 'Total Deals',  value: total,   icon: 'ri-price-tag-3-line',  bg: '#eef2ff', color: '#405189' },
      { label: 'Actifs',       value: actifs,  icon: 'ri-check-double-line', bg: '#d1fae5', color: '#059669' },
      { label: 'En attente',   value: pending, icon: 'ri-time-line',         bg: '#fef3c7', color: '#d97706' },
      { label: 'Ce mois',      value: total,   icon: 'ri-calendar-line',     bg: '#f0fdf4', color: '#0ab39c' },
    ];
  }

  constructor(private api: TijaraApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.adminList('deals').subscribe({
      next: (data: any[]) => {
        this.allDeals = data;
        this.loading  = false;
        this.applyFilter();
      },
      error: () => {
        this.allDeals = [];
        this.loading  = false;
        this.applyFilter();
      }
    });
  }

  setFilter(key: string): void {
    this.activeFilter = key;
    this.applyFilter();
  }

  applyFilter(): void {
    let list = this.allDeals;
    if (this.activeFilter === 'active')  list = list.filter(d =>  d.is_active);
    if (this.activeFilter === 'pending') list = list.filter(d => !d.is_active);
    const q = this.searchTerm.toLowerCase();
    if (q) list = list.filter(d =>
      (d.title || '').toLowerCase().includes(q) ||
      (d.vendor_name || '').toLowerCase().includes(q) ||
      (d.category    || '').toLowerCase().includes(q)
    );
    this.filtered = list;
  }

  toggle(d: any): void {
    this.api.adminPatch('deals/' + d.id + '/toggle').subscribe({
      next: () => this.load()
    });
  }

  remove(d: any): void {
    if (!confirm(`Supprimer le deal "${d.title}" ?`)) return;
    this.api.adminDelete('deals', d.id).subscribe({
      next: () => this.load()
    });
  }
}
