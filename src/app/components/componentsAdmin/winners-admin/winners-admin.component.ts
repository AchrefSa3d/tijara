import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

@Component({
  selector: 'app-winners-admin',
  standalone: false,
  template: `
<div class="container-fluid">
  <!-- Breadcrumb -->
  <app-breadcrumbs [breadcrumbItems]="breadCrumbItems"></app-breadcrumbs>

  <!-- Header -->
  <div class="row g-3 mb-4 align-items-center">
    <div class="col">
      <h4 class="mb-0 fw-bold">
        <i class="ri-trophy-line me-2 text-warning"></i>Gestion des Gagnants
      </h4>
      <p class="text-muted fs-13 mb-0">{{ winners.length }} gagnant(s) enregistré(s)</p>
    </div>
    <div class="col-auto d-flex gap-2">
      <input type="text" class="form-control form-control-sm" style="width:220px"
             placeholder="Rechercher..." [(ngModel)]="searchTerm" (input)="applyFilter()">
      <button class="btn btn-primary btn-sm" (click)="openForm()">
        <i class="ri-add-line me-1"></i>Nouveau gagnant
      </button>
    </div>
  </div>

  <!-- Loading -->
  @if (loading) {
    <div class="text-center py-5">
      <div class="spinner-border text-primary"></div>
      <p class="text-muted mt-3">Chargement...</p>
    </div>
  }

  <!-- Table -->
  @if (!loading) {
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead style="background:#f8f9fc">
              <tr>
                <th class="ps-3">#</th>
                <th>Gagnant</th>
                <th>Email</th>
                <th>Prix</th>
                <th>Date gain</th>
                <th>Statut</th>
                <th class="text-end pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (filtered.length === 0) {
                <tr>
                  <td colspan="7" class="text-center py-5 text-muted">
                    <i class="ri-trophy-line fs-36 d-block mb-2 opacity-30"></i>
                    Aucun gagnant trouvé
                  </td>
                </tr>
              }
              @for (w of filtered; track w.idWinner) {
                <tr>
                  <td class="ps-3 text-muted fs-13">{{ w.idWinner }}</td>
                  <td>
                    <div class="fw-medium">{{ w.fullName || w.userName || '—' }}</div>
                    @if (w.phone) { <div class="fs-12 text-muted">{{ w.phone }}</div> }
                  </td>
                  <td class="fs-13">{{ w.email || '—' }}</td>
                  <td>
                    <span class="badge bg-warning-subtle text-warning border border-warning-subtle">
                      {{ w.prizeTitle || '—' }}
                    </span>
                  </td>
                  <td class="fs-13 text-muted">{{ w.wonAt | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <span class="badge" [class]="w.active ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'">
                      {{ w.active ? 'Actif' : 'Inactif' }}
                    </span>
                  </td>
                  <td class="text-end pe-3">
                    <div class="d-flex justify-content-end gap-1">
                      <button class="btn btn-sm btn-outline-primary" title="Modifier" (click)="edit(w)">
                        <i class="ri-edit-line"></i>
                      </button>
                      <button class="btn btn-sm" [class]="w.active ? 'btn-outline-warning' : 'btn-outline-success'"
                              title="Changer statut" (click)="toggleStatus(w)">
                        <i [class]="w.active ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" title="Supprimer" (click)="remove(w)">
                        <i class="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  }
</div>

<!-- Modal Form -->
@if (showForm) {
  <div class="modal d-block" tabindex="-1" style="background:rgba(0,0,0,0.5);z-index:1050">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header" style="background:linear-gradient(135deg,#405189,#0ab39c)">
          <h5 class="modal-title text-white">
            <i class="ri-trophy-line me-2"></i>
            {{ editingId ? 'Modifier le gagnant' : 'Nouveau gagnant' }}
          </h5>
          <button type="button" class="btn-close btn-close-white" (click)="closeForm()"></button>
        </div>
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="modal-body p-4">
            @if (saveError) {
              <div class="alert alert-danger">{{ saveError }}</div>
            }
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-medium">Nom complet</label>
                <input type="text" class="form-control" formControlName="fullName" placeholder="Prénom Nom">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-medium">Email</label>
                <input type="email" class="form-control" formControlName="email">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-medium">Téléphone</label>
                <input type="text" class="form-control" formControlName="phone">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-medium">ID Prix</label>
                <input type="number" class="form-control" formControlName="idPrize" placeholder="Laisser vide si aucun">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-medium">ID Utilisateur</label>
                <input type="number" class="form-control" formControlName="idUser" placeholder="Laisser vide si invité">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-medium">ID Commande</label>
                <input type="number" class="form-control" formControlName="idOrder">
              </div>
              <div class="col-12">
                <label class="form-label fw-medium">Note</label>
                <textarea class="form-control" formControlName="note" rows="2"
                          placeholder="Informations complémentaires..."></textarea>
              </div>
              <div class="col-12">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" formControlName="active" id="activeCheck">
                  <label class="form-check-label fw-medium" for="activeCheck">Actif</label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" (click)="closeForm()">Annuler</button>
            <button type="submit" class="btn btn-primary" [disabled]="saving">
              @if (saving) { <span class="spinner-border spinner-border-sm me-1"></span> }
              {{ editingId ? 'Mettre à jour' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
}
  `
})
export class WinnersAdminComponent implements OnInit {
  breadCrumbItems = [
    { label: 'Admin' },
    { label: 'Gagnants', active: true }
  ];

  winners: any[] = [];
  filtered: any[] = [];
  loading   = true;
  saving    = false;
  saveError = '';
  showForm  = false;
  editingId: number | null = null;
  searchTerm = '';
  form!: FormGroup;

  constructor(private fb: FormBuilder, private api: TijaraApiService) {}

  ngOnInit(): void {
    this.initForm();
    this.load();
  }

  initForm(): void {
    this.form = this.fb.group({
      fullName: [''],
      email:    ['', Validators.email],
      phone:    [''],
      idPrize:  [null],
      idUser:   [null],
      idOrder:  [null],
      note:     [''],
      active:   [true],
    });
  }

  load(): void {
    this.loading = true;
    this.api.adminList('winners').subscribe({
      next: (data: any[]) => {
        this.winners = data;
        this.filtered = data;
        this.loading = false;
      },
      error: () => {
        this.winners = [];
        this.filtered = [];
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filtered = this.winners.filter(w =>
      (w.fullName || '').toLowerCase().includes(q) ||
      (w.email    || '').toLowerCase().includes(q) ||
      (w.prizeTitle || '').toLowerCase().includes(q)
    );
  }

  openForm(): void {
    this.editingId = null;
    this.saveError = '';
    this.form.reset({ active: true });
    this.showForm = true;
  }

  edit(w: any): void {
    this.editingId = w.idWinner;
    this.saveError = '';
    this.form.patchValue({
      fullName: w.fullName,
      email:    w.email,
      phone:    w.phone,
      idPrize:  w.idPrize,
      idUser:   w.idUser,
      idOrder:  w.idOrder,
      note:     w.note,
      active:   w.active,
    });
    this.showForm = true;
  }

  closeForm(): void { this.showForm = false; }

  save(): void {
    this.saving    = true;
    this.saveError = '';
    const payload  = this.form.value;

    const req = this.editingId
      ? this.api.adminUpdate('winners', this.editingId, payload)
      : this.api.adminCreate('winners', payload);

    req.subscribe({
      next: () => {
        this.saving   = false;
        this.showForm = false;
        this.load();
      },
      error: (e: any) => {
        this.saving    = false;
        this.saveError = e?.error?.message || 'Erreur lors de la sauvegarde.';
      }
    });
  }

  toggleStatus(w: any): void {
    this.api.adminPatch('winners/' + w.idWinner + '/toggle').subscribe({
      next: () => this.load()
    });
  }

  remove(w: any): void {
    if (!confirm(`Supprimer le gagnant "${w.fullName}" ?`)) return;
    this.api.adminDelete('winners', w.idWinner).subscribe({
      next: () => this.load()
    });
  }
}
