import { Component, OnInit } from '@angular/core';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

@Component({
  selector: 'app-wishlist-user',
  standalone: false,
  template: `
<div class="container-fluid">
  <app-breadcrumbs [breadcrumbItems]="breadCrumbItems"></app-breadcrumbs>

  <div class="row g-4">
    <div class="col-12">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-0 pt-4 px-4">
          <div class="d-flex align-items-center justify-content-between">
            <h5 class="card-title mb-0 fw-bold">
              <i class="ri-heart-line me-2 text-danger"></i>Mes Favoris
            </h5>
            <!-- Tab switcher -->
            <ul class="nav nav-pills nav-sm">
              <li class="nav-item">
                <button class="nav-link" [class.active]="activeTab==='ads'" (click)="activeTab='ads'; loadAds()">
                  <i class="ri-megaphone-line me-1"></i>Annonces
                  <span class="badge bg-primary ms-1">{{ adsWishlist.length }}</span>
                </button>
              </li>
              <li class="nav-item">
                <button class="nav-link" [class.active]="activeTab==='deals'" (click)="activeTab='deals'; loadDeals()">
                  <i class="ri-price-tag-3-line me-1"></i>Deals
                  <span class="badge bg-primary ms-1">{{ dealsWishlist.length }}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div class="card-body p-4">

          <!-- Annonces wishlist -->
          @if (activeTab === 'ads') {
            @if (loadingAds) {
              <div class="text-center py-4">
                <div class="spinner-border text-primary"></div>
              </div>
            } @else if (adsWishlist.length === 0) {
              <div class="text-center py-5 text-muted">
                <i class="ri-heart-line fs-48 d-block mb-3 opacity-30"></i>
                <p>Vous n'avez pas encore d'annonces favorites.</p>
                <a routerLink="/landing/annonces" class="btn btn-primary btn-sm">
                  <i class="ri-search-line me-1"></i>Parcourir les annonces
                </a>
              </div>
            } @else {
              <div class="row g-3">
                @for (item of adsWishlist; track item.idWish) {
                  <div class="col-sm-6 col-lg-4 col-xl-3">
                    <div class="card border-0 shadow-sm h-100 hover-card">
                      <div class="position-relative">
                        <div style="height:160px;overflow:hidden;border-radius:8px 8px 0 0;background:#f3f4f8">
                          @if (item.image) {
                            <img [src]="item.image" style="width:100%;height:100%;object-fit:cover" alt="">
                          } @else {
                            <div class="d-flex align-items-center justify-content-center h-100">
                              <i class="ri-image-line text-muted fs-32"></i>
                            </div>
                          }
                        </div>
                        <button class="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 rounded-circle p-1"
                                style="width:28px;height:28px" title="Retirer des favoris"
                                (click)="removeAd(item)">
                          <i class="ri-heart-fill fs-12"></i>
                        </button>
                      </div>
                      <div class="card-body p-3">
                        <h6 class="fw-semibold mb-1 text-truncate">{{ item.title }}</h6>
                        @if (item.price) {
                          <p class="text-primary fw-bold mb-0">{{ item.price }} TND</p>
                        }
                        <p class="text-muted fs-12 mb-2">Ajouté le {{ item.createdAt | date:'dd/MM/yyyy' }}</p>
                        <a [routerLink]="['/landing/annonces', item.targetId]"
                           class="btn btn-outline-primary btn-sm w-100">
                          <i class="ri-eye-line me-1"></i>Voir l'annonce
                        </a>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          }

          <!-- Deals wishlist -->
          @if (activeTab === 'deals') {
            @if (loadingDeals) {
              <div class="text-center py-4">
                <div class="spinner-border text-primary"></div>
              </div>
            } @else if (dealsWishlist.length === 0) {
              <div class="text-center py-5 text-muted">
                <i class="ri-heart-line fs-48 d-block mb-3 opacity-30"></i>
                <p>Vous n'avez pas encore de deals favoris.</p>
                <a routerLink="/landing/deals" class="btn btn-primary btn-sm">
                  <i class="ri-search-line me-1"></i>Parcourir les deals
                </a>
              </div>
            } @else {
              <div class="row g-3">
                @for (item of dealsWishlist; track item.idWish) {
                  <div class="col-sm-6 col-lg-4 col-xl-3">
                    <div class="card border-0 shadow-sm h-100 hover-card">
                      <div class="position-relative">
                        <div style="height:160px;overflow:hidden;border-radius:8px 8px 0 0;background:#f3f4f8">
                          @if (item.image) {
                            <img [src]="item.image" style="width:100%;height:100%;object-fit:cover" alt="">
                          } @else {
                            <div class="d-flex align-items-center justify-content-center h-100">
                              <i class="ri-image-line text-muted fs-32"></i>
                            </div>
                          }
                        </div>
                        <button class="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 rounded-circle p-1"
                                style="width:28px;height:28px" title="Retirer des favoris"
                                (click)="removeDeal(item)">
                          <i class="ri-heart-fill fs-12"></i>
                        </button>
                      </div>
                      <div class="card-body p-3">
                        <h6 class="fw-semibold mb-1 text-truncate">{{ item.title }}</h6>
                        @if (item.price) {
                          <p class="text-primary fw-bold mb-0">{{ item.price }} TND</p>
                        }
                        <p class="text-muted fs-12 mb-2">Ajouté le {{ item.createdAt | date:'dd/MM/yyyy' }}</p>
                        <a [routerLink]="['/landing/deals', item.targetId]"
                           class="btn btn-outline-primary btn-sm w-100">
                          <i class="ri-eye-line me-1"></i>Voir le deal
                        </a>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          }

        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .hover-card {
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
    }
    .hover-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
    }
  `]
})
export class WishlistUserComponent implements OnInit {
  breadCrumbItems = [
    { label: 'Mon Espace' },
    { label: 'Mes Favoris', active: true }
  ];

  activeTab     = 'ads';
  adsWishlist:   any[] = [];
  dealsWishlist: any[] = [];
  loadingAds   = true;
  loadingDeals = false;

  constructor(private api: TijaraApiService) {}

  ngOnInit(): void { this.loadAds(); }

  loadAds(): void {
    this.loadingAds = true;
    this.api.getWishlistAds().subscribe({
      next: (data: any[]) => { this.adsWishlist = data; this.loadingAds = false; },
      error: ()            => { this.adsWishlist = []; this.loadingAds = false; }
    });
  }

  loadDeals(): void {
    this.loadingDeals = true;
    this.api.getWishlistDeals().subscribe({
      next: (data: any[]) => { this.dealsWishlist = data; this.loadingDeals = false; },
      error: ()            => { this.dealsWishlist = []; this.loadingDeals = false; }
    });
  }

  removeAd(item: any): void {
    this.api.removeFromWishlist('ads', item.targetId).subscribe({
      next: () => this.adsWishlist = this.adsWishlist.filter(i => i.idWish !== item.idWish)
    });
  }

  removeDeal(item: any): void {
    this.api.removeFromWishlist('deals', item.targetId).subscribe({
      next: () => this.dealsWishlist = this.dealsWishlist.filter(i => i.idWish !== item.idWish)
    });
  }
}
