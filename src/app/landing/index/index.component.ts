import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

const CAT_COLORS  = ['primary','success','warning','danger','info','secondary','dark','primary'];
const CAT_ICONS   = [
    'ri-computer-line', 'ri-t-shirt-line', 'ri-home-2-line', 'ri-car-line',
    'ri-run-line', 'ri-book-open-line', 'ri-heart-line', 'ri-building-line'
];
const PROD_COLORS = ['#6691e7','#f06548','#0ab39c','#405189','#f7b84b','#299cdb'];

@Component({
    selector: 'app-index',
    templateUrl: './index.component.html',
    styleUrls: ['./index.component.scss'],
    standalone: false
})
export class IndexComponent implements OnInit {

    currentSection   = 'hero';
    year             = new Date().getFullYear();
    showLoginToast   = false;
    private toastTimer: any;

    categories:       any[] = [];
    categoriesLoading = true;

    featuredProducts: any[] = [];
    productsLoading   = true;

    steps = [
        { step: '01', icon: 'ri-search-2-line',        title: 'Parcourez',  desc: 'Explorez des milliers de produits dans toutes les catégories.' },
        { step: '02', icon: 'ri-message-3-line',       title: 'Contactez',  desc: 'Discutez directement avec le vendeur et négociez le meilleur prix.' },
        { step: '03', icon: 'ri-secure-payment-line',  title: 'Achetez',    desc: 'Finalisez votre achat en toute sécurité avec nos moyens de paiement.' },
    ];

    stats = [
        { value: '12 500+', label: 'Produits publiés',   icon: 'ri-shopping-bag-3-line' },
        { value: '3 200+',  label: 'Vendeurs actifs',    icon: 'ri-store-2-line'        },
        { value: '45 000+', label: 'Acheteurs inscrits', icon: 'ri-group-line'          },
        { value: '98%',     label: 'Satisfaction',       icon: 'ri-star-line'           },
    ];

    testimonials = [
        { name: 'Sami B.',    role: 'Acheteur', rating: 5, text: 'Excellente plateforme, j\'ai trouvé ce que je cherchais en quelques minutes. Livraison rapide !' },
        { name: 'Mariam K.',  role: 'Vendeuse', rating: 5, text: 'J\'ai ouvert ma boutique il y a 3 mois. Le dashboard vendeur est simple et mes ventes ont décollé.' },
        { name: 'Karim T.',   role: 'Acheteur', rating: 4, text: 'Prix très compétitifs et messagerie pratique avec les vendeurs. Je recommande vivement Tijara.' },
    ];

    constructor(private api: TijaraApiService, private router: Router) {}

    ngOnInit(): void {
        this.loadCategories();
        this.loadProducts();
    }

    // ── Chargement données API ────────────────────────────────────────

    private loadCategories(): void {
        this.api.getCategories().subscribe({
            next: (res: any) => {
                const all: any[] = Array.isArray(res) ? res : (res?.categories || res?.data || []);
                this.categories = all.slice(0, 8).map((c: any, i: number) => ({
                    idCateg: c.id   || c.id_categ || c.idCateg || i,
                    // L'API retourne directement "name" (= TitleFr ?? TitleEn ?? TitleAr côté C#)
                    name:    c.name || c.name_fr || c.title_fr || c.title_en || 'Catégorie',
                    icon:    CAT_ICONS[i % CAT_ICONS.length],
                    color:   CAT_COLORS[i % CAT_COLORS.length],
                    count:   c.active_deals ?? c.deals_count ?? 0,
                }));
                this.categoriesLoading = false;
            },
            error: () => {
                // Fallback données démo si API indisponible
                this.categories = [
                    { idCateg: 1, name: 'Électronique',     icon: 'ri-computer-line',   color: 'primary',   count: 248 },
                    { idCateg: 2, name: 'Mode & Vêtements', icon: 'ri-t-shirt-line',    color: 'success',   count: 195 },
                    { idCateg: 3, name: 'Maison & Jardin',  icon: 'ri-home-2-line',     color: 'warning',   count: 162 },
                    { idCateg: 4, name: 'Voitures',         icon: 'ri-car-line',        color: 'danger',    count: 87  },
                    { idCateg: 5, name: 'Sports & Loisirs', icon: 'ri-run-line',        color: 'info',      count: 134 },
                    { idCateg: 6, name: 'Livres',           icon: 'ri-book-open-line',  color: 'secondary', count: 210 },
                    { idCateg: 7, name: 'Beauté & Santé',   icon: 'ri-heart-line',      color: 'danger',    count: 176 },
                    { idCateg: 8, name: 'Immobilier',       icon: 'ri-building-line',   color: 'dark',      count: 53  },
                ];
                this.categoriesLoading = false;
            }
        });
    }

    private loadProducts(): void {
        this.api.getProducts({ limit: 6, page: 1 }).subscribe({
            next: (res: any) => {
                const all: any[] = Array.isArray(res)
                    ? res
                    : (res?.data || res?.products || res?.deals || []);
                this.featuredProducts = all.slice(0, 6).map((p: any, i: number) => ({
                    id:       p.id          || i,
                    name:     p.name        || p.title || 'Produit',
                    category: p.category    || p.category_name || '',
                    // L'API retourne price comme nombre (ParsePrice côté C#)
                    price:    typeof p.price === 'number' ? p.price : parseFloat(p.price || '0'),
                    oldPrice: p.original_price ? parseFloat(p.original_price) : null,
                    seller:   p.vendor_name || p.shop_name || p.vendor || '',
                    rating:   p.rating      || p.avg_rating || 0,
                    reviews:  p.review_count || 0,
                    badge:    p.discount     ? `-${p.discount}%` : null,
                    bgColor:  PROD_COLORS[i % PROD_COLORS.length],
                    image:    p.image       || p.image_url || null,
                }));
                this.productsLoading = false;
            },
            error: () => {
                // Fallback données démo
                this.featuredProducts = [
                    { id: 1, name: 'iPhone 14 Pro',           category: 'Électronique', price: 1200, oldPrice: 1400, seller: 'TechShop',   rating: 4.8, reviews: 124, badge: 'Nouveau',   bgColor: '#6691e7', image: null },
                    { id: 2, name: 'Veste en Cuir Noir',      category: 'Mode',         price: 189,  oldPrice: 250,  seller: 'FashionHub', rating: 4.5, reviews: 67,  badge: '-25%',      bgColor: '#f06548', image: null },
                    { id: 3, name: 'Canapé Moderne 3 places', category: 'Maison',       price: 850,  oldPrice: null, seller: 'DecoStore',  rating: 4.7, reviews: 42,  badge: null,        bgColor: '#0ab39c', image: null },
                    { id: 4, name: 'Samsung Galaxy S23',      category: 'Électronique', price: 980,  oldPrice: 1100, seller: 'MobilePro',  rating: 4.6, reviews: 98,  badge: 'Populaire', bgColor: '#405189', image: null },
                    { id: 5, name: 'Nike Air Max 270',         category: 'Sports',       price: 149,  oldPrice: 180,  seller: 'SportZone',  rating: 4.9, reviews: 213, badge: '-17%',      bgColor: '#f7b84b', image: null },
                    { id: 6, name: 'MacBook Air M2',          category: 'Électronique', price: 1350, oldPrice: 1500, seller: 'TechShop',   rating: 4.9, reviews: 87,  badge: 'Top vente', bgColor: '#299cdb', image: null },
                ];
                this.productsLoading = false;
            }
        });
    }

    // ── Auth helpers ─────────────────────────────────────────────────

    get isLoggedIn(): boolean {
        try {
            const raw = localStorage.getItem('currentUser');
            return !!raw && !!JSON.parse(raw);
        } catch {
            return false;
        }
    }

    get currentUser(): any {
        try {
            const raw = localStorage.getItem('currentUser');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    addToCart(productId: number): void {
        if (this.isLoggedIn) {
            this.router.navigate(['/users/dashboard']);
        } else {
            this.triggerLoginToast();
        }
    }

    goToLogin(): void {
        this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/landing' } });
    }

    private triggerLoginToast(): void {
        this.showLoginToast = true;
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => { this.showLoginToast = false; }, 4500);
    }

    dismissToast(): void {
        this.showLoginToast = false;
        clearTimeout(this.toastTimer);
    }

    // ── Scroll / UI ──────────────────────────────────────────────────

    windowScroll() {
        const navbar = document.getElementById('navbar');
        if (document.body.scrollTop > 40 || document.documentElement.scrollTop > 40) {
            navbar?.classList.add('is-sticky');
        } else {
            navbar?.classList.remove('is-sticky');
        }
        const btn = document.getElementById('back-to-top') as HTMLElement;
        if (btn) btn.style.display = (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) ? 'block' : 'none';
    }

    onSectionChange(sectionId: string) { this.currentSection = sectionId; }
    toggleMenu() { document.getElementById('navbarSupportedContent')?.classList.toggle('show'); }
    topFunction() { document.body.scrollTop = 0; document.documentElement.scrollTop = 0; }
    getStars(rating: number): number[] { return Array(Math.floor(rating)).fill(0); }
}
