import { Component } from '@angular/core';
import { CrudConfig } from '../crud-generic/admin-crud.component';

@Component({
    selector: 'app-prizes-admin',
    template: `<app-admin-crud [config]="config"></app-admin-crud>`,
    standalone: false
})
export class PrizesAdminComponent {
    config: CrudConfig = {
        title:       'Prix & cadeaux',
        icon:        'ri-gift-line',
        apiPath:     'prizes',
        idField:     'id_prize',
        breadcrumb:  'Prix',
        searchFields: ['title', 'description'],
        listColumns: [
            { key: 'id_prize',   label: 'ID' },
            { key: 'title',      label: 'Titre' },
            { key: 'date_prize', label: 'Date prix', type: 'date' },
            { key: 'id_user',    label: 'Gagnant (user ID)' },
            { key: 'active',     label: 'Statut', type: 'badge' },
        ],
        fields: [
            { key: 'title',       label: 'Titre',       type: 'text',     required: true, colSize: 8 },
            { key: 'date_prize',  label: 'Date prix',   type: 'date',     colSize: 4 },
            { key: 'description', label: 'Description', type: 'textarea', colSize: 12 },
            { key: 'image',       label: 'URL image',   type: 'text',     colSize: 8 },
            { key: 'id_user',     label: 'Gagnant (ID user)', type: 'number', min: 0, colSize: 4 },
            { key: 'active',      label: 'Actif',       type: 'boolean',  default: true, colSize: 6 },
        ],
    };
}
