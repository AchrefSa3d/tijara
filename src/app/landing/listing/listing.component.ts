import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

export type ListingType = 'annonces' | 'deals' | 'produits' | 'vendeurs';

@Component({
    selector: 'app-listing',
    templateUrl: './listing.component.html',
    styleUrls: ['./listing.component.scss'],
    standalone: false
})
export class ListingComponent implements OnInit {

    type: ListingType = 'annonces';

    // Data
    allItems:   any[] = [];
    filtered:   any[] = [];
    paginated:  any[] = [];
    categories: any[] = [];
    loading     = true;

    // Filters
    search        = '';
    selectedCat   = '';
    priceMin: number | null = null;
    priceMax: number | null = null;
    sortBy        = 'newest';
    viewMode: 'grid' | 'list' = 'grid';

    // Pagination
    page     = 1;
    pageSize = 12;
    total    = 0;

    // Login toast
    showLoginToast = false;

    private readonly PROD_COLORS = ['#6691e7','#f06548','#0ab39c','#405189','#f7b84b','#299cdb'];

    configs: Record<ListingType, { title: string; icon: string; apiMethod: string; emptyMsg: string; priceLbl: string }> = {
        annonces: { title: 'Toutes les annonces', icon: 'ri-megaphone-line',  apiMethod: 'annonces',  emptyMsg: 'Aucune annonce disponible.', priceLbl: 'Prix' },
        deals:    { title: 'Tous les deals',       icon: 'ri-flashlight-line', apiMethod: 'deals',     emptyMsg: 'Aucun deal disponible.',     priceLbl: 'Prix' },
        produits: { title: 'Tous les produits',    icon: 'ri-box-3-line',      apiMethod: 'products',  emptyMsg: 'Aucun produit disponible.',  priceLbl: 'Prix' },
        vendeurs: { title: 'Tous les vendeurs',    icon: 'ri-store-2-line',    apiMethod: 'vendors',   emptyMsg: 'Aucun vendeur disponible.',  priceLbl: '' },
    };

    get config() { return this.configs[this.type]; }
    get totalPages(): number { return Math.ceil(this.total / this.pageSize); }
    get pages(): number[] {
        const t = this.totalPages;
        const p = this.page;
        const range: number[] = [];
        for (let i = Math.max(1, p - 2); i <= Math.min(t, p + 2); i++) range.push(i);
        return range;
    }

    get isLoggedIn(): boolean {
        try { return !!localStorage.getItem('currentUser'); } catch { return false; }
    }

    constructor(private route: ActivatedRoute, private router: Router, private api: TijaraApiService) {}

    ngOnInit(): void {
        // Detect type from route data or URL
        this.route.data.subscribe(d => { if (d['listingType']) this.type = d['listingType']; });
        this.route.queryParams.subscribe(q => {
            if (q['q'])    this.search      = q['q'];
            if (q['cat'])  this.selectedCat = q['cat'];
            if (q['sort']) this.sortBy      = q['sort'];
            if (q['page']) this.page        = +q['page'] || 1;
        });
        this.loadCategories();
        this.loadItems();
    }

    private loadCategories(): void {
        this.api.getCategories().subscribe({
            next: (r: any) => { this.categories = Array.isArray(r) ? r : (r?.categories || []); }
        });
    }

    private loadItems(): void {
        this.loading = true;
        const call = this.type === 'annonces' ? this.api.getAnnonces()
                   : this.type === 'deals'    ? this.api.getDeals()
                   : this.type === 'vendeurs' ? this.api.getVendors()
                   : this.api.getProducts();

        call.subscribe({
            next: (r: any) => {
                const raw: any[] = Array.isArray(r) ? r : (r?.data || r?.products || r?.deals || r?.ads || r?.vendors || []);
                this.allItems = raw.map((item: any, i: number) => this.mapItem(item, i));
                this.applyFilters();
                this.loading = false;
            },
            error: () => {
                this.allItems = this.getDemoItems();
                this.applyFilters();
                this.loading = false;
            }
        });
    }

    private mapItem(item: any, i: number): any {
        const price = parseFloat(item.price || item.Price || item.deal_price || '0') || 0;
        return {
            id:           item.id      || item.IdUser || i + 1,
            title:        item.title   || item.name   || item.username || item.shop_name || 'Sans titre',
            description:  item.description || item.bio || '',
            price,
            oldPrice:     item.original_price ? parseFloat(item.original_price) : null,
            discount:     item.discount ? parseFloat(item.discount) : null,
            image:        item.image   || item.image_url || item.profile_picture || null,
            category:     item.category || item.category_name || '',
            categoryId:   item.id_categ || item.category_id || null,
            vendor:       item.vendor_name || item.shop_name || item.username || '',
            location:     item.city    || item.location || '',
            date:         item.created_at || item.date_publication || item.CreationDate || '',
            badge:        item.is_boost ? 'Boost' : item.discount ? `-${Math.round(parseFloat(item.discount))}%` : null,
            rating:       parseFloat(item.rating || item.avg_rating || '0') || 0,
            reviews:      item.review_count || 0,
            bgColor:      this.PROD_COLORS[i % this.PROD_COLORS.length],
            isVerified:   item.is_verified || item.IsVerified || false,
            productCount: item.product_count || 0,
            raw:          item,
        };
    }

    applyFilters(): void {
        let r = [...this.allItems];

        if (this.search.trim()) {
            const q = this.search.toLowerCase();
            r = r.filter(x => (x.title + x.description + x.category + x.vendor).toLowerCase().includes(q));
        }
        if (this.selectedCat) {
            r = r.filter(x => String(x.categoryId) === String(this.selectedCat) || x.category === this.selectedCat);
        }
        if (this.priceMin != null) r = r.filter(x => x.price >= this.priceMin!);
        if (this.priceMax != null) r = r.filter(x => x.price <= this.priceMax!);

        switch (this.sortBy) {
            case 'price_asc':  r.sort((a, b) => a.price - b.price); break;
            case 'price_desc': r.sort((a, b) => b.price - a.price); break;
            case 'rating':     r.sort((a, b) => b.rating - a.rating); break;
            case 'oldest':     r.sort((a, b) => a.date.localeCompare(b.date)); break;
            default:           r.sort((a, b) => b.date.localeCompare(a.date)); break; // newest
        }

        this.total    = r.length;
        this.filtered = r;
        this.updatePage();
    }

    updatePage(): void {
        const start    = (this.page - 1) * this.pageSize;
        this.paginated = this.filtered.slice(start, start + this.pageSize);
    }

    goPage(p: number): void {
        if (p < 1 || p > this.totalPages) return;
        this.page = p;
        this.updatePage();
        window.scrollTo({ top: 200, behavior: 'smooth' });
    }

    resetFilters(): void {
        this.search = '';
        this.selectedCat = '';
        this.priceMin = null;
        this.priceMax = null;
        this.sortBy = 'newest';
        this.page = 1;
        this.applyFilters();
    }

    goDetail(item: any): void {
        const base = this.type === 'vendeurs' ? '/landing/vendeurs' : `/landing/${this.type}`;
        this.router.navigate([`${base}/${item.id}`]);
    }

    addToCart(item: any): void {
        if (!this.isLoggedIn) { this.showLoginToast = true; setTimeout(() => this.showLoginToast = false, 4000); }
        else this.router.navigate(['/users/dashboard']);
    }

    formatPrice(p: number): string {
        return new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(p);
    }

    getStars(r: number): number[] { return Array(Math.min(5, Math.floor(r))).fill(0); }

    formatDate(d: string): string {
        if (!d) return '';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return d;
        const diff = (Date.now() - dt.getTime()) / 1000;
        if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
        if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
        return dt.toLocaleDateString('fr-FR');
    }

    // Demo data fallback
    private getDemoItems(): any[] {
        if (this.type === 'vendeurs') {
            return Array.from({ length: 12 }, (_, i) => ({
                id: i + 1, title: `Boutique ${['TechShop', 'FashionHub', 'DecoStore', 'MobilePro', 'SportZone'][i % 5]}`,
                description: 'Boutique partenaire certifiée Tijara.',
                price: 0, oldPrice: null, discount: null, image: null,
                category: '', categoryId: null, vendor: '', location: ['Tunis', 'Sfax', 'Sousse'][i % 3],
                date: new Date(Date.now() - i * 86400000 * 5).toISOString(),
                badge: i % 3 === 0 ? 'Vérifié' : null,
                rating: 3.5 + (i % 15) / 10, reviews: 10 + i * 7,
                bgColor: this.PROD_COLORS[i % this.PROD_COLORS.length],
                isVerified: i % 2 === 0, productCount: 12 + i * 3, raw: {},
            }));
        }
        const types: any = {
            annonces: [
                { title: 'Appartement S+2 à vendre',        price: 85000, cat: 'Immobilier' },
                { title: 'iPhone 14 Pro Max',               price: 1200,  cat: 'Électronique' },
                { title: 'Toyota Corolla 2019',             price: 25000, cat: 'Voitures' },
                { title: 'Cours de langue arabe',           price: 15,    cat: 'Services' },
                { title: 'Canapé 3 places cuir',            price: 650,   cat: 'Maison' },
                { title: 'MacBook Pro M2',                  price: 1800,  cat: 'Électronique' },
                { title: 'Location studio meublé',          price: 300,   cat: 'Immobilier' },
                { title: 'VTT 27 vitesses',                 price: 350,   cat: 'Sports' },
                { title: 'Chiot Berger Allemand',           price: 500,   cat: 'Animaux' },
                { title: 'Machine à laver Samsung',         price: 420,   cat: 'Électroménager' },
                { title: 'Terrain 200m² Sousse',            price: 45000, cat: 'Immobilier' },
                { title: 'Réfrigérateur double portes',     price: 380,   cat: 'Électroménager' },
            ],
            deals:    [
                { title: '-50% Nike Air Max',               price: 90,    cat: 'Mode',          discount: '50' },
                { title: 'Pack Xbox Series X + 3 jeux',    price: 450,   cat: 'Gaming',         discount: '20' },
                { title: 'Montre Casio G-Shock',            price: 125,   cat: 'Accessoires',    discount: '30' },
                { title: 'Tablette Samsung Galaxy Tab',     price: 280,   cat: 'Électronique',   discount: '15' },
                { title: 'Parfum Calvin Klein',             price: 55,    cat: 'Beauté',         discount: '40' },
                { title: 'Trousse maquillage 50 pièces',   price: 35,    cat: 'Beauté',         discount: '60' },
                { title: 'Chaussures Adidas Stan Smith',    price: 75,    cat: 'Mode',           discount: '25' },
                { title: 'Sac à dos 30L imperméable',       price: 45,    cat: 'Sports',         discount: '35' },
                { title: 'Smartwatch Xiaomi Mi Band 7',     price: 40,    cat: 'Électronique',   discount: '20' },
                { title: 'Cafetière Nespresso Vertuo',      price: 110,   cat: 'Électroménager', discount: '30' },
                { title: 'Livres lot 5 romans français',    price: 25,    cat: 'Culture',        discount: '50' },
                { title: 'Matelas ergonomique 140x190',     price: 320,   cat: 'Maison',         discount: '10' },
            ],
            produits: [
                { title: 'iPhone 15 Pro',            price: 1350, cat: 'Électronique'   },
                { title: 'Veste cuir homme',         price: 189,  cat: 'Mode'           },
                { title: 'Canapé scandinave',        price: 850,  cat: 'Maison'         },
                { title: 'Samsung Galaxy S24',       price: 980,  cat: 'Électronique'   },
                { title: 'Nike Air Max 270',         price: 149,  cat: 'Sports'         },
                { title: 'MacBook Air M3',           price: 1350, cat: 'Électronique'   },
                { title: 'Robe été 2024',            price: 45,   cat: 'Mode'           },
                { title: 'Robot cuisine Moulinex',   price: 220,  cat: 'Électroménager' },
                { title: 'Livre Maths Terminale',    price: 18,   cat: 'Culture'        },
                { title: 'Vélo électrique urbain',   price: 1200, cat: 'Sports'         },
                { title: 'Casque Sony WH-1000XM5',  price: 340,  cat: 'Électronique'   },
                { title: 'Parfum Dior Sauvage',      price: 85,   cat: 'Beauté'         },
            ],
        };
        const src = types[this.type] || types['produits'];
        return src.map((x: any, i: number) => ({
            id: i + 1, title: x.title, description: '', price: x.price, oldPrice: null,
            discount: x.discount || null, image: null, category: x.cat, categoryId: null,
            vendor: ['TechShop', 'FashionHub', 'DecoStore'][i % 3],
            location: ['Tunis', 'Sfax', 'Sousse', 'Bizerte'][i % 4],
            date: new Date(Date.now() - i * 86400000 * 2).toISOString(),
            badge: i === 0 ? 'Nouveau' : x.discount ? `-${x.discount}%` : null,
            rating: 3.5 + (i % 15) / 10, reviews: 5 + i * 4,
            bgColor: this.PROD_COLORS[i % this.PROD_COLORS.length],
            isVerified: false, productCount: 0, raw: {},
        }));
    }
}
