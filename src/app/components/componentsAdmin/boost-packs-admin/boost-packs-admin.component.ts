import { Component } from '@angular/core';
import { CrudConfig } from '../crud-generic/admin-crud.component';

@Component({
    selector: 'app-boost-packs-admin',
    template: `<app-admin-crud [config]="config"></app-admin-crud>`,
    standalone: false
})
export class BoostPacksAdminComponent {
    config: CrudConfig = {
        title:       'Packs Boost Ads',
        icon:        'ri-rocket-2-line',
        apiPath:     'boost-packs',
        idField:     'id_boost',
        breadcrumb:  'Packs Boost',
        searchFields: ['title'],
        listColumns: [
            { key: 'id_boost',     label: 'ID' },
            { key: 'title',        label: 'Nom' },
            { key: 'price',        label: 'Prix (DT)',    type: 'number' },
            { key: 'discount',     label: 'Remise (%)',   type: 'number' },
            { key: 'max_duration', label: 'Durée max (j)', type: 'number' },
            { key: 'active',       label: 'Statut',       type: 'badge' },
        ],
        fields: [
            { key: 'title',        label: 'Nom du pack',    type: 'text',    required: true, colSize: 8 },
            { key: 'max_duration', label: 'Durée max (jours)', type: 'number', min: 1, max: 366, colSize: 4 },
            { key: 'price',        label: 'Prix (DT)',      type: 'number',  min: 0, step: 0.01, colSize: 4 },
            { key: 'discount',     label: 'Remise (%)',     type: 'number',  min: 0, max: 100, step: 0.01, colSize: 4 },
            { key: 'orders_count', label: 'Nombre de commandes', type: 'number', min: 0, colSize: 4 },

            // Placements (booleans)
            { key: 'sliders',      label: 'Slider accueil',  type: 'boolean', colSize: 4 },
            { key: 'side_bar',     label: 'Sidebar',         type: 'boolean', colSize: 4 },
            { key: 'footer',       label: 'Footer',          type: 'boolean', colSize: 4 },
            { key: 'related_post', label: 'Posts similaires', type: 'boolean', colSize: 4 },
            { key: 'first_login',  label: 'Box 1ère connexion', type: 'boolean', colSize: 4 },
            { key: 'links',        label: 'Liens ajoutés',   type: 'boolean', colSize: 4 },
            { key: 'active',       label: 'Actif',           type: 'boolean', default: true, colSize: 4 },
        ],
    };
}
