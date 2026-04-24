import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

@Component({
    selector: 'app-boutique-list',
    templateUrl: './boutique-list.component.html',
    standalone: false
})
export class BoutiqueListComponent implements OnInit {

    products:   any[] = [];
    annonces:   any[] = [];
    deals:      any[] = [];
    categories: any[] = [];

    loading      = true;
    activeTab    = 'products';   // 'products' | 'annonces' | 'deals'
    searchQuery  = '';
    selectedCat  = 0;
    currentPage  = 1;
    pageSize     = 12;
    sortBy       = 'newest';

    constructor(
        private api: TijaraApiService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.api.getCategories().subscribe({
            next: (res: any) => { this.categories = res?.categories || res || []; },
            error: () => {}
        });
        this.loadAll();
    }

    loadAll(): void {
        this.loading = true;
        this.api.getProducts().subscribe({
            next: (res: any) => {
                this.products = res?.products || res || [];
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
        this.api.getAnnonces().subscribe({
            next: (res: any) => { this.annonces = (res?.annonces || res || []).filter((a: any) => a.type === 'annonce' || !a.type); },
            error: () => {}
        });
        this.api.getAnnonces().subscribe({
            next: (res: any) => { this.deals = (res?.annonces || res || []).filter((a: any) => a.type === 'deal'); },
            error: () => {}
        });
    }

    get currentList(): any[] {
        let list = this.activeTab === 'products' ? this.products
                 : this.activeTab === 'annonces' ? this.annonces
                 : this.deals;

        if (this.searchQuery.trim()) {
            const q = this.searchQuery.trim().toLowerCase();
            list = list.filter(i =>
                (i.title_product || i.title_deal || i.title_ad || '').toLowerCase().includes(q) ||
                (i.description_product || i.description_deal || i.description_ad || '').toLowerCase().includes(q)
            );
        }
        if (this.selectedCat) {
            list = list.filter(i => (i.id_categ || i.id_cateorie) === this.selectedCat);
        }
        // Sort
        if (this.sortBy === 'price_asc')  list = [...list].sort((a, b) => parseFloat(a.price_product || a.price_deal || a.price_ad || 0) - parseFloat(b.price_product || b.price_deal || b.price_ad || 0));
        if (this.sortBy === 'price_desc') list = [...list].sort((a, b) => parseFloat(b.price_product || b.price_deal || b.price_ad || 0) - parseFloat(a.price_product || a.price_deal || a.price_ad || 0));

        return list;
    }

    get pagedList(): any[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.currentList.slice(start, start + this.pageSize);
    }

    get totalPages(): number { return Math.ceil(this.currentList.length / this.pageSize); }
    get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

    setTab(tab: string): void {
        this.activeTab   = tab;
        this.currentPage = 1;
    }

    setPage(p: number): void {
        if (p >= 1 && p <= this.totalPages) this.currentPage = p;
    }

    getTitle(item: any): string {
        return item.title_product || item.title_deal || item.title_ad || 'Sans titre';
    }

    getPrice(item: any): string {
        const p = item.price_product || item.price_deal || item.price_ad;
        return p ? parseFloat(p).toLocaleString('fr-TN') + ' DT' : '';
    }

    getImage(item: any): string {
        return item.image_product || item.image_deal || item.image_ad || '';
    }

    getSeller(item: any): string {
        return item.vendor_name || item.shop_name || item.author_name || '';
    }

    isLoggedIn(): boolean {
        return !!localStorage.getItem('currentUser');
    }

    openProduct(item: any): void {
        if (this.activeTab === 'products') {
            this.router.navigate(['/boutique/product', item.id_product]);
        }
    }

    orderNow(item: any): void {
        if (!this.isLoggedIn()) {
            this.router.navigate(['/auth/login']);
            return;
        }
        this.router.navigate(['/boutique/product', item.id_product]);
    }
}
