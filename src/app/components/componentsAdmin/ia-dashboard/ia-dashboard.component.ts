import { Component, OnInit } from '@angular/core';
import { IaApiService } from 'src/app/core/services/ia-api.service';

@Component({
  selector: 'app-ia-dashboard',
  templateUrl: './ia-dashboard.component.html',
  standalone: false
})
export class IaDashboardComponent implements OnInit {

  breadCrumbItems = [
    { label: 'Admin' },
    { label: 'Intelligence Artificielle', active: true }
  ];

  // ── Données ───────────────────────────────────────────────
  overview: any       = null;
  purchases: any[]    = [];
  predictions: any[]  = [];
  categories: any[]   = [];

  // ── États de chargement ───────────────────────────────────
  loadingOverview    = true;
  loadingPurchases   = true;
  loadingPredictions = true;
  loadingCategories  = true;

  // ── Filtre recherche predictions ──────────────────────────
  searchPred = '';

  constructor(private ia: IaApiService) {}

  ngOnInit(): void {
    this.loadOverview();
    this.loadPurchases();
    this.loadPredictions();
    this.loadCategories();
  }

  loadOverview(): void {
    this.loadingOverview = true;
    this.ia.getOverview().subscribe({
      next: (data) => { this.overview = data; this.loadingOverview = false; },
      error: ()     => { this.loadingOverview = false; }
    });
  }

  loadPurchases(): void {
    this.loadingPurchases = true;
    this.ia.getProductsPurchases().subscribe({
      next: (data) => { this.purchases = data.slice(0, 10); this.loadingPurchases = false; },
      error: ()     => { this.loadingPurchases = false; }
    });
  }

  loadPredictions(): void {
    this.loadingPredictions = true;
    this.ia.getAllPredictions().subscribe({
      next: (res)   => { this.predictions = res.products || []; this.loadingPredictions = false; },
      error: ()     => { this.loadingPredictions = false; }
    });
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.ia.getCategoriesStats().subscribe({
      next: (data) => { this.categories = data; this.loadingCategories = false; },
      error: ()    => { this.loadingCategories = false; }
    });
  }

  retrain(): void {
    this.ia.retrainModels().subscribe({
      next: (res) => { alert(res.message); this.loadPredictions(); },
      error: ()   => { alert('Erreur lors du ré-entraînement.'); }
    });
  }

  // ── Helpers ───────────────────────────────────────────────
  get filteredPredictions(): any[] {
    if (!this.searchPred.trim()) return this.predictions;
    const t = this.searchPred.toLowerCase();
    return this.predictions.filter(p => p.product_name?.toLowerCase().includes(t));
  }

  getScoreClass(score: number): string {
    if (score >= 70) return 'bg-success';
    if (score >= 40) return 'bg-warning';
    return 'bg-danger';
  }

  getScoreLabel(score: number): string {
    if (score >= 70) return 'Fort potentiel';
    if (score >= 40) return 'Moyen';
    return 'Faible';
  }

  getScoreTextClass(score: number): string {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-danger';
  }

  getBarWidth(value: number, max: number): string {
    return max > 0 ? `${Math.round((value / max) * 100)}%` : '0%';
  }

  get maxPurchases(): number {
    return Math.max(...this.purchases.map(p => p.purchase_count || 0), 1);
  }

  get maxOrders(): number {
    return Math.max(...this.categories.map(c => c.total_orders || 0), 1);
  }
}
