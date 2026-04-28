import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

@Component({
  selector: 'app-products-ent',
  templateUrl: './products-ent.component.html',
  styleUrls: ['./products-ent.component.scss'],
  standalone: false
})
export class ProductsEntComponent implements OnInit {

  breadCrumbItems = [
    { label: 'Vendeur' },
    { label: 'Mes Produits', active: true }
  ];

  products: any[]         = [];
  filteredProducts: any[] = [];
  categories: any[]       = [];
  searchTerm              = '';
  filterStatus            = 'tous';
  showForm                = false;
  editMode                = false;
  selectedProduct: any    = null;
  productForm!: FormGroup;
  loading                 = true;
  saving                  = false;
  saveError               = '';
  imagePreview            = '';
  uploadedImageUrl        = ''; // URL retournée par le serveur
  uploading               = false;
  uploadError             = '';
  deleteConfirmId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private api: TijaraApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProducts();
    this.api.getCategories().subscribe({
      next: (data: any[]) => { this.categories = data; }
    });
    // Auto-open form when navigating from "Ajouter un produit" menu item
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'add') {
        setTimeout(() => this.openAdd(), 300);
      }
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.api.getMyProducts().subscribe({
      next: (data: any[]) => {
        this.products = data.map(p => ({
          id:             p.id,
          name:           p.name,
          description:    p.description || '',
          category:       p.category_name || p.category || '—',
          categoryId:     p.category_id,
          price:          +p.price,
          stock:          p.stock ?? 0,
          status:         p.status || (p.active === 1 ? 'actif' : 'inactif'),
          approvalStatus: p.approval_status || 'approved',
          image:          p.image_url || p.image || null,
        }));
        this.loading = false;
        this.applyFilter();
      },
      error: () => { this.loading = false; }
    });
  }

  initForm(p?: any) {
    this.productForm = this.fb.group({
      name:        [p?.name        || '', [Validators.required, Validators.minLength(3)]],
      description: [p?.description || '', [Validators.required, Validators.minLength(10)]],
      category_id: [p?.categoryId  || null],
      price:       [p?.price       || '', [Validators.required, Validators.min(0.1)]],
      stock:       [p?.stock       ?? 0,  [Validators.required, Validators.min(0)]],
    });
  }

  get f() { return this.productForm.controls; }

  applyFilter() {
    let list = [...this.products];
    if (this.filterStatus !== 'tous') list = list.filter(p => p.status === this.filterStatus);
    if (this.searchTerm.trim()) {
      const t = this.searchTerm.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(t) ||
        p.category.toLowerCase().includes(t) ||
        (p.description || '').toLowerCase().includes(t)
      );
    }
    this.filteredProducts = list;
  }

  openAdd() {
    this.editMode        = false;
    this.selectedProduct = null;
    this.imagePreview    = '';
    this.uploadedImageUrl = '';
    this.uploadError     = '';
    this.saveError       = '';
    this.initForm();
    this.showForm = true;
    setTimeout(() => document.getElementById('productNameInput')?.focus(), 100);
  }

  openEdit(p: any) {
    this.editMode        = true;
    this.selectedProduct = p;
    this.imagePreview    = p.image || '';
    this.saveError       = '';
    this.initForm(p);
    this.showForm = true;
  }

  cancelForm() {
    this.showForm        = false;
    this.selectedProduct = null;
    this.imagePreview    = '';
    this.saveError       = '';
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (file.size > 3 * 1024 * 1024) {
      alert('Image trop grande. Maximum 3 MB.');
      input.value = '';
      return;
    }
    
    // Afficher preview immédiatement
    const reader = new FileReader();
    reader.onload = (e: any) => { 
      this.imagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // Uploader le fichier au serveur
    this.uploading = true;
    this.uploadError = '';
    this.api.uploadImage(file, 'products').subscribe({
      next: (response: any) => {
        this.uploadedImageUrl = response.url || response.imageUrl || response.path || '';
        this.uploading = false;
        console.log('Image uploadée:', this.uploadedImageUrl);
      },
      error: (error: any) => {
        this.uploading = false;
        this.uploadError = error?.error?.message || 'Erreur lors du téléchargement de l\'image.';
        console.error('Erreur upload:', error);
        this.imagePreview = '';
        this.uploadedImageUrl = '';
        input.value = '';
      }
    });
  }

  removeImage(): void { 
    this.imagePreview = ''; 
    this.uploadedImageUrl = '';
  }

  saveProduct() {
    this.productForm.markAllAsTouched();
    if (this.productForm.invalid) return;

    const val     = this.productForm.value;
    const priceStr = val.price ? `${(+val.price).toFixed(3)} TND` : '';
    const payload = {
      // Champs attendus par l'API
      title_product:       val.name?.trim(),
      description_product: val.description?.trim(),
      price_product:       priceStr,
      quantity:            String(val.stock ?? 0),
      id_categ:            val.category_id ? +val.category_id : null,
      image_url:           this.uploadedImageUrl || null, // Utiliser l'URL du serveur
    };

    this.saving    = true;
    this.saveError = '';

    if (this.editMode && this.selectedProduct) {
      this.api.updateProduct(this.selectedProduct.id, payload).subscribe({
        next: () => { this.saving = false; this.showForm = false; this.loadProducts(); },
        error: (err: any) => {
          this.saving    = false;
          this.saveError = err?.error?.message || 'Erreur lors de la modification.';
        }
      });
    } else {
      this.api.createProduct(payload).subscribe({
        next: () => { this.saving = false; this.showForm = false; this.loadProducts(); },
        error: (err: any) => {
          this.saving    = false;
          this.saveError = err?.error?.message || 'Erreur lors de l\'ajout.';
        }
      });
    }
  }

  toggleStatus(p: any) {
    this.api.toggleProductStatus(p.id).subscribe({
      next: () => {
        p.status = p.status === 'actif' ? 'inactif' : 'actif';
        this.applyFilter();
      },
      error: (err: any) => {
        console.error('Erreur toggle statut:', err);
      }
    });
  }

  confirmDelete(id: number) { this.deleteConfirmId = id; }
  cancelDelete()            { this.deleteConfirmId = null; }

  deleteProduct(id: number) {
    this.api.deleteProduct(id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== id);
        this.applyFilter();
        this.deleteConfirmId = null;
      }
    });
  }

  get pendingCount()  { return this.products.filter(p => p.approvalStatus === 'pending').length; }
  get activeCount()   { return this.products.filter(p => p.status === 'actif').length; }
  get inactiveCount() { return this.products.filter(p => p.status === 'inactif').length; }

  getApprovalBadge(status: string): string {
    const m: Record<string, string> = {
      approved: 'badge bg-success-subtle text-success',
      pending:  'badge bg-warning-subtle text-warning',
      rejected: 'badge bg-danger-subtle text-danger',
    };
    return m[status] || 'badge bg-secondary-subtle text-secondary';
  }

  getApprovalLabel(status: string): string {
    const m: Record<string, string> = { approved: 'Approuvé', pending: 'En attente', rejected: 'Refusé' };
    return m[status] || status;
  }
}
