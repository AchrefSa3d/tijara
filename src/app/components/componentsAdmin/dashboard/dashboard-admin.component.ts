import { Component, OnInit } from '@angular/core';
import {
  ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexDataLabels,
  ApexStroke, ApexTooltip, ApexFill, ApexNonAxisChartSeries,
  ApexPlotOptions, ApexLegend, ApexGrid
} from 'ng-apexcharts';
import { Router } from '@angular/router';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.scss'],
  standalone: false
})
export class DashboardAdminComponent implements OnInit {

  breadCrumbItems = [
    { label: 'Admin' },
    { label: 'Dashboard', active: true }
  ];

  today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  currentYear = new Date().getFullYear();

  kpis = [
    { label: 'Utilisateurs',     value: 0, icon: 'ri-user-3-line',             color: '#405189', bg: 'rgba(64,81,137,.12)',  link: '/admin/users' },
    { label: 'Vendeurs actifs',  value: 0, icon: 'ri-store-2-line',             color: '#0ab39c', bg: 'rgba(10,179,156,.12)', link: '/admin/vendors' },
    { label: 'Commandes',        value: 0, icon: 'ri-shopping-bag-3-line',      color: '#299cdb', bg: 'rgba(41,156,219,.12)', link: '/admin/orders' },
    { label: 'Chiffre d\'affaires', value: 0, icon: 'ri-money-dollar-circle-line', color: '#0ab39c', bg: 'rgba(10,179,156,.12)', link: '/admin/orders', isMoney: true },
    { label: 'Produits',         value: 0, icon: 'ri-box-3-line',              color: '#f7b84b', bg: 'rgba(247,184,75,.12)', link: '/admin/products' },
    { label: 'Réclamations',     value: 0, icon: 'ri-customer-service-2-line', color: '#f06548', bg: 'rgba(240,101,72,.12)', link: '/admin/reclamations' },
  ];

  pendingBadges = [
    { label: 'Vendeurs',  value: 0, icon: 'ri-store-2-line',   color: 'warning', link: '/admin/vendors' },
    { label: 'Produits',  value: 0, icon: 'ri-box-3-line',     color: 'primary', link: '/admin/products' },
    { label: 'Annonces',  value: 0, icon: 'ri-megaphone-line', color: 'info',    link: '/admin/annonces' },
  ];

  recentOrders: any[]   = [];
  pendingVendors: any[] = [];

  // ── Area chart: commandes/mois ──────────────────────────────
  salesSeries: ApexAxisChartSeries = [{ name: 'Commandes', data: Array(12).fill(0) }];
  salesChart: ApexChart = {
    type: 'area', height: 300,
    toolbar: { show: false }, zoom: { enabled: false },
    animations: { enabled: true }
  };
  salesXAxis: ApexXAxis = {
    categories: ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'],
    axisBorder: { show: false }, axisTicks: { show: false },
    labels: { style: { colors: '#adb5bd', fontSize: '12px' } }
  };
  salesYAxis: ApexYAxis = { labels: { style: { colors: '#adb5bd', fontSize: '11px' } } };
  salesGrid: ApexGrid = { borderColor: '#f1f3fa', strokeDashArray: 4 };
  salesStroke: ApexStroke = { curve: 'smooth', width: 2.5 };
  salesFill: ApexFill = {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 100] }
  };
  salesDataLabels: ApexDataLabels = { enabled: false };
  salesTooltip: ApexTooltip = { theme: 'light' };

  // ── Donut chart: statuts commandes ──────────────────────────
  catSeries: ApexNonAxisChartSeries = [1, 1, 1, 1, 1];
  catChart: ApexChart = { type: 'donut', height: 280 };
  catLabels = ['En attente', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'];
  catLegend: ApexLegend = { position: 'bottom', fontSize: '12px' };
  catPlotOptions: ApexPlotOptions = { pie: { donut: { size: '70%' } } };
  catColors = ['#f7b84b', '#299cdb', '#405189', '#0ab39c', '#f06548'];

  constructor(private api: TijaraApiService, private router: Router) {}

  ngOnInit(): void {
    this.api.getAdminStats().subscribe({
      next: (s: any) => {
        this.kpis[0].value = s.users            || 0;
        this.kpis[1].value = s.vendors          || 0;
        this.kpis[2].value = s.orders           || 0;
        this.kpis[3].value = s.revenue          || 0;
        this.kpis[4].value = s.products         || 0;
        this.kpis[5].value = s.open_reclamations || 0;

        this.pendingBadges[0].value = s.pending_vendors  || 0;
        this.pendingBadges[1].value = s.pending_products || 0;
        this.pendingBadges[2].value = s.pending_annonces || 0;

        if (s.orders_by_month) {
          this.salesSeries = [{ name: 'Commandes', data: s.orders_by_month }];
        }
        if (s.orders_by_status) {
          const st = s.orders_by_status;
          this.catSeries = [
            st['pending']   || 0,
            st['confirmed'] || 0,
            st['shipped']   || 0,
            st['delivered'] || 0,
            st['cancelled'] || 0,
          ];
        }
      }
    });

    this.api.getPendingVendors().subscribe({
      next: (data: any[]) => {
        this.pendingVendors = data.slice(0, 6).map(v => ({
          id:    v.id,
          name:  v.shop_name || `${v.first_name} ${v.last_name}`,
          owner: `${v.first_name} ${v.last_name}`,
          email: v.email,
          date:  new Date(v.created_at).toLocaleDateString('fr-FR'),
        }));
      }
    });

    this.api.getAdminOrders().subscribe({
      next: (data: any[]) => {
        this.recentOrders = data.slice(0, 7).map(o => ({
          id:     `#${String(o.id).padStart(4,'0')}`,
          client: o.client_name || o.client_email || 'Client',
          total:  o.total_amount || 0,
          status: o.status,
          date:   new Date(o.created_at).toLocaleDateString('fr-FR'),
        }));
      }
    });
  }

  getStatusClass(status: string): string {
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

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  navigate(link: string): void { this.router.navigate([link]); }
}
