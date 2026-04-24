import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

@Component({
    selector: 'app-boutique-detail',
    templateUrl: './boutique-detail.component.html',
    standalone: false
})
export class BoutiqueDetailComponent implements OnInit {

    product:   any     = null;
    reviews:   any[]   = [];
    loading    = true;
    orderLoading = false;
    error      = '';
    quantity   = 1;
    selectedTab = 'description';

    // Formulaire commande
    showOrderForm = false;
    orderForm = { firstName: '', lastName: '', phone: '', email: '', address: '' };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private api: TijaraApiService
    ) {}

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.api.getProduct(id).subscribe({
            next: (res: any) => {
                this.product = res?.product || res;
                this.loading = false;
            },
            error: () => { this.loading = false; this.error = 'Produit introuvable.'; }
        });
        this.api.getProductReviews(id).subscribe({
            next: (res: any) => { this.reviews = res?.reviews || res || []; },
            error: () => {}
        });
    }

    isLoggedIn(): boolean { return !!localStorage.getItem('currentUser'); }

    getPrice(): string {
        const p = this.product?.price_product;
        return p ? parseFloat(p).toLocaleString('fr-TN') + ' DT' : 'Prix non renseigné';
    }

    orderNow(): void {
        if (!this.isLoggedIn()) {
            this.router.navigate(['/auth/login']);
            return;
        }
        this.showOrderForm = true;
    }

    submitOrder(): void {
        if (!this.isLoggedIn()) { this.router.navigate(['/auth/login']); return; }
        this.orderLoading = true;
        const data = {
            id_product:  this.product.id_product,
            quantity:    this.quantity,
            first_name:  this.orderForm.firstName,
            last_name:   this.orderForm.lastName,
            phone:       this.orderForm.phone,
            email:       this.orderForm.email,
            address:     this.orderForm.address,
        };
        this.api.createOrder(data).subscribe({
            next: () => {
                this.orderLoading    = false;
                this.showOrderForm   = false;
                alert('✅ Commande passée avec succès !');
                this.router.navigate(['/users/dashboard']);
            },
            error: (err: any) => {
                this.orderLoading = false;
                this.error = err?.error?.message || 'Erreur lors de la commande.';
            }
        });
    }

    getStars(rating: number): number[] { return Array(Math.floor(rating || 0)).fill(0); }
    getEmptyStars(rating: number): number[] { return Array(5 - Math.floor(rating || 0)).fill(0); }

    goBack(): void { this.router.navigate(['/boutique']); }
}
