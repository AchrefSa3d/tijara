import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

@Component({
  selector: 'app-categories-admin',
  templateUrl: './categories-admin.component.html',
  styleUrls: ['./categories-admin.component.scss'],
  standalone: false
})
export class CategoriesAdminComponent implements OnInit {

  breadCrumbItems = [
    { label: 'Admin' },
    { label: 'Catégories', active: true }
  ];

  categories: any[] = [];
  loading    = true;
  saving     = false;
  saveError  = '';
  showForm   = false;
  editingId: number | null = null;
  submitted  = false;
  form!: FormGroup;

  constructor(private fb: FormBuilder, private api: TijaraApiService) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    // Use /all to get all categories (including inactive) for admin view
    this.api.getCategoriesAdmin().subscribe({
      next: (data: any[]) => { this.categories = data; this.loading = false; },
      error: () => {
        // Fallback to public endpoint if admin endpoint not available
        this.api.getCategories().subscribe({
          next: (data: any[]) => { this.categories = data; this.loading = false; },
          error: () => { this.loading = false; }
        });
      }
    });
  }

  initForm(cat?: any) {
    this.form = this.fb.group({
      name_fr:     [cat?.name_fr || cat?.name || '', [Validators.required, Validators.minLength(2)]],
      name_en:     [cat?.name_en || ''],
      name_ar:     [cat?.name_ar || ''],
      description: [cat?.description || ''],
      image:       [cat?.image || ''],
    });
  }

  get f() { return this.form.controls; }

  openAdd() {
    this.editingId = null;
    this.submitted = false;
    this.saveError = '';
    this.initForm();
    this.showForm = true;
  }

  openEdit(cat: any) {
    this.editingId = cat.id;
    this.submitted = false;
    this.saveError = '';
    this.initForm(cat);
    this.showForm = true;
  }

  save() {
    this.submitted = true;
    if (this.form.invalid) return;
    this.saving    = true;
    this.saveError = '';

    const payload = {
      name_fr:     this.form.value.name_fr,
      name_en:     this.form.value.name_en || this.form.value.name_fr,
      name_ar:     this.form.value.name_ar,
      description: this.form.value.description,
      image:       this.form.value.image,
    };

    if (this.editingId) {
      this.api.updateCategory(this.editingId, payload).subscribe({
        next: (updated: any) => {
          const idx = this.categories.findIndex(c => c.id === this.editingId);
          if (idx >= 0) this.categories[idx] = updated;
          this.saving = false; this.showForm = false; this.submitted = false;
        },
        error: (err: any) => {
          this.saving = false;
          this.saveError = err?.error?.message || 'Erreur lors de la modification.';
        }
      });
    } else {
      this.api.createCategory(payload).subscribe({
        next: (created: any) => {
          this.categories.unshift(created);
          this.saving = false; this.showForm = false; this.submitted = false;
        },
        error: (err: any) => {
          this.saving = false;
          this.saveError = err?.error?.message || 'Erreur lors de la création.';
        }
      });
    }
  }

  cancel() {
    this.showForm  = false;
    this.submitted = false;
    this.saveError = '';
  }

  toggleActive(cat: any) {
    this.api.toggleCategory(cat.id).subscribe({
      next: (res: any) => { cat.active = res.active; }
    });
  }

  delete(cat: any) {
    if (!confirm(`Désactiver la catégorie "${cat.name}" ?`)) return;
    this.api.deleteCategory(cat.id).subscribe({
      next: () => { cat.active = false; }
    });
  }

  get activeCount()   { return this.categories.filter(c => c.active).length; }
  get inactiveCount() { return this.categories.filter(c => !c.active).length; }
}
