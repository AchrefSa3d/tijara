import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

interface PointPacket {
    id_packet?:   number;
    idPacket?:    number;
    title:        string;
    description?: string;
    points_count?: number;
    pointsCount?: number;
    price:        number;
    discount:     number;
    active:       boolean;
}

@Component({
    selector: 'app-settings-admin',
    templateUrl: './settings-admin.component.html',
    styleUrls: ['./settings-admin.component.scss'],
    standalone: false
})
export class SettingsAdminComponent implements OnInit {

    breadCrumbItems = [
        { label: 'Admin' },
        { label: 'Paramètres', active: true }
    ];

    form!: FormGroup;
    loading   = true;
    saving    = false;
    saveError = '';
    saveOk    = '';

    // Point packets CRUD
    packets: PointPacket[] = [];
    packetsLoading = true;
    packetForm!: FormGroup;
    showPacketForm = false;
    editingPacketId: number | null = null;
    packetSubmitted = false;
    packetSaving    = false;
    packetError     = '';

    constructor(private fb: FormBuilder, private api: TijaraApiService) {}

    ngOnInit(): void {
        this.initForm();
        this.initPacketForm();
        this.loadSettings();
        this.loadPackets();
    }

    // ── Formulaire paramètres ─────────────────────────────────────────

    private initForm(): void {
        this.form = this.fb.group({
            // Financier
            money_transfer_commission_pct:      [0, [Validators.required, Validators.min(0), Validators.max(100)]],
            standard_purchase_commission_pct:   [0, [Validators.required, Validators.min(0), Validators.max(100)]],
            // Abonnements
            account_pro_user_month_price:       [0,  [Validators.required, Validators.min(0)]],
            account_pro_entreprise_month_price: [0,  [Validators.required, Validators.min(0)]],
            min_subscription_months:            [1,  [Validators.required, Validators.min(1), Validators.max(12)]],
            // Durées annonces
            max_jobs_duration_days:             [30, [Validators.required, Validators.min(1), Validators.max(366)]],
            max_missions_duration_days:         [30, [Validators.required, Validators.min(1), Validators.max(366)]],
            max_freelance_duration_days:        [30, [Validators.required, Validators.min(1), Validators.max(366)]],
            // Limites standard
            standard_max_magasin:               [1,   [Validators.required, Validators.min(0)]],
            standard_max_points:                [100, [Validators.required, Validators.min(0)]],
            min_add_annonce_points:             [5,   [Validators.required, Validators.min(0)]],
            min_add_freelance_points:           [5,   [Validators.required, Validators.min(0)]],
            min_add_products_points:            [5,   [Validators.required, Validators.min(0)]],
            // Toggles fonctionnalités
            mode_magasin_deals_active:          [true],
            boost_ads_enabled:                  [true],
            upgrade_account_enabled:            [true],
            buy_points_enabled:                 [true],
            premium_account_enabled:            [true],
            rating_preview_standard_enabled:    [true],
            rating_preview_enabled:             [true],
            // Coupons
            boost_ads_coupon_enabled:           [false],
            boost_ads_coupon_price:             [0, [Validators.min(0)]],
            freelance_coupon_enabled:           [false],
            freelance_coupon_price:             [0, [Validators.min(0)]],
        });
    }

    private loadSettings(): void {
        this.loading = true;
        this.api.getAdminSettings().subscribe({
            next: (res: any) => {
                const patch: any = {};
                Object.keys(this.form.controls).forEach(k => {
                    if (res[k] === undefined || res[k] === null) return;
                    const ctrl = this.form.get(k);
                    const val = res[k];
                    if (typeof ctrl?.value === 'boolean') {
                        patch[k] = String(val).toLowerCase() === 'true';
                    } else if (typeof ctrl?.value === 'number') {
                        patch[k] = parseFloat(val);
                    } else {
                        patch[k] = val;
                    }
                });
                this.form.patchValue(patch);
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    get f() { return this.form.controls; }

    save(): void {
        this.saveError = '';
        this.saveOk    = '';
        if (this.form.invalid) {
            this.saveError = 'Certains champs sont invalides.';
            return;
        }
        this.saving = true;
        // Transformer tout en string pour le backend
        const payload: Record<string, string> = {};
        Object.entries(this.form.value).forEach(([k, v]) => {
            payload[k] = String(v);
        });
        this.api.updateAdminSettings(payload).subscribe({
            next: () => {
                this.saving = false;
                this.saveOk = '✅ Paramètres enregistrés avec succès.';
                setTimeout(() => this.saveOk = '', 3500);
            },
            error: (err: any) => {
                this.saving = false;
                this.saveError = err?.error?.message || 'Erreur lors de l\'enregistrement.';
            }
        });
    }

    // ── Packets de points ─────────────────────────────────────────────

    private initPacketForm(pk?: PointPacket): void {
        this.packetForm = this.fb.group({
            title:        [pk?.title        || '',   [Validators.required, Validators.minLength(2)]],
            description:  [pk?.description  || ''],
            points_count: [pk?.points_count ?? pk?.pointsCount ?? 0, [Validators.required, Validators.min(1)]],
            price:        [pk?.price        ?? 0,    [Validators.required, Validators.min(0)]],
            discount:     [pk?.discount     ?? 0,    [Validators.required, Validators.min(0), Validators.max(100)]],
            active:       [pk?.active ?? true],
        });
    }

    get pf() { return this.packetForm.controls; }

    private loadPackets(): void {
        this.packetsLoading = true;
        this.api.getPointPackets().subscribe({
            next: (data: any[]) => {
                this.packets = (data || []).map(p => ({
                    id_packet:    p.id_packet    ?? p.idPacket,
                    idPacket:     p.idPacket     ?? p.id_packet,
                    title:        p.title,
                    description:  p.description,
                    points_count: p.points_count ?? p.pointsCount,
                    pointsCount:  p.pointsCount  ?? p.points_count,
                    price:        Number(p.price    ?? 0),
                    discount:     Number(p.discount ?? 0),
                    active:       !!p.active,
                }));
                this.packetsLoading = false;
            },
            error: () => { this.packetsLoading = false; }
        });
    }

    openAddPacket(): void {
        this.editingPacketId = null;
        this.packetSubmitted = false;
        this.packetError     = '';
        this.initPacketForm();
        this.showPacketForm  = true;
    }

    openEditPacket(pk: PointPacket): void {
        this.editingPacketId = (pk.id_packet ?? pk.idPacket) || null;
        this.packetSubmitted = false;
        this.packetError     = '';
        this.initPacketForm(pk);
        this.showPacketForm  = true;
    }

    cancelPacket(): void {
        this.showPacketForm  = false;
        this.packetSubmitted = false;
        this.packetError     = '';
    }

    savePacket(): void {
        this.packetSubmitted = true;
        if (this.packetForm.invalid) return;
        this.packetSaving = true;
        this.packetError  = '';

        const v = this.packetForm.value;
        const payload = {
            title:        v.title,
            description:  v.description,
            pointsCount:  Number(v.points_count),
            price:        Number(v.price),
            discount:     Number(v.discount),
            active:       !!v.active,
        };

        const done = () => { this.packetSaving = false; this.showPacketForm = false; this.loadPackets(); };
        const fail = (err: any) => {
            this.packetSaving = false;
            this.packetError  = err?.error?.message || 'Erreur lors de l\'enregistrement du packet.';
        };

        if (this.editingPacketId) {
            this.api.updatePointPacket(this.editingPacketId, payload).subscribe({ next: done, error: fail });
        } else {
            this.api.createPointPacket(payload).subscribe({ next: done, error: fail });
        }
    }

    deletePacket(pk: PointPacket): void {
        const id = pk.id_packet ?? pk.idPacket;
        if (!id) return;
        if (!confirm(`Supprimer le packet "${pk.title}" ?`)) return;
        this.api.deletePointPacket(id).subscribe({
            next: () => { this.packets = this.packets.filter(p => (p.id_packet ?? p.idPacket) !== id); }
        });
    }
}
