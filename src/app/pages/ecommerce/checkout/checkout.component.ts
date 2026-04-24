import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CartItem } from '../cart/cart.component';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  standalone: false
})
export class CheckoutComponent implements OnInit {

  breadCrumbItems = [
    { label: 'Boutique', link: '/shop/products' },
    { label: 'Panier', link: '/shop/cart' },
    { label: 'Commande', active: true }
  ];

  checkoutForm!: FormGroup;
  cartItems: CartItem[] = [];
  submitted    = false;
  loading      = false;
  orderPlaced  = false;
  orderNumber  = '';
  errorMsg     = '';
  paymentMethod = 'livraison';

  villes = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Hammamet', 'Zaghouan',
    'Bizerte', 'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Sousse', 'Monastir',
    'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Gabès',
    'Médenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kébili', 'La Marsa'
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private api: TijaraApiService
  ) {}

  private get cartKey(): string {
    try {
      const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return u?.id ? `tijara_cart_${u.id}` : 'tijara_cart_guest';
    } catch { return 'tijara_cart_guest'; }
  }

  ngOnInit(): void {
    const saved = localStorage.getItem(this.cartKey);
    this.cartItems = saved ? JSON.parse(saved) : [];
    if (this.cartItems.length === 0) {
      this.router.navigate(['/shop/cart']);
      return;
    }

    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.checkoutForm = this.fb.group({
      firstName: [user.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName:  [user.lastName  || '', [Validators.required, Validators.minLength(2)]],
      email:     [user.email     || '', [Validators.required, Validators.email]],
      phone:     [user.phone     || '', [Validators.required, Validators.pattern(/^[2459]\d{7}$/)]],
      ville:     [user.city      || '', Validators.required],
      address:   [user.address   || '', [Validators.required, Validators.minLength(8)]],
      notes:     [''],
    });
  }

  get f() { return this.checkoutForm.controls; }

  get subtotal(): number {
    return this.cartItems.reduce((s, i) => s + i.product.price * i.qty, 0);
  }

  get shipping(): number { return this.subtotal > 100 ? 0 : 7; }
  get total(): number { return this.subtotal + this.shipping; }

  placeOrder() {
    this.submitted = true;
    this.errorMsg  = '';
    if (this.checkoutForm.invalid) return;

    // Vérifier que l'utilisateur est connecté
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser?.token) {
      this.errorMsg = 'Vous devez être connecté pour passer une commande.';
      return;
    }

    const v = this.checkoutForm.value;

    // Construire un objet "detail" commun pour toutes les commandes
    const detail = {
      first_name: v.firstName,
      last_name:  v.lastName,
      email:      v.email,
      telephone:  v.phone,
      address:    `${v.address}, ${v.ville}`,
    };

    // Créer une commande par article du panier (API accepte 1 deal par commande)
    const requests = this.cartItems.map((item: CartItem) =>
      this.api.createOrder({
        id_deal: item.product.id,
        detail:  { ...detail, quantity: item.qty }
      })
    );

    if (requests.length === 0) {
      this.errorMsg = 'Votre panier est vide.';
      return;
    }

    this.loading = true;
    forkJoin(requests).subscribe({
      next: (results: any[]) => {
        this.loading     = false;
        // Utiliser l'ID de la première commande créée
        const firstId    = results[0]?.id ?? results[0]?.order_id ?? '0';
        this.orderNumber = `TJR-${String(firstId).padStart(6, '0')}`;
        localStorage.removeItem(this.cartKey);
        this.cartItems   = [];
        this.orderPlaced = true;
      },
      error: (err: any) => {
        this.loading  = false;
        this.errorMsg = err?.error?.message || 'Erreur lors de la commande. Veuillez réessayer.';
      }
    });
  }

  goShop()   { this.router.navigate(['/shop/products']); }
  goOrders() { this.router.navigate(['/users/orders']); }
}
