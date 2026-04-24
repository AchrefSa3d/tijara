import { Component } from '@angular/core';
import { CrudConfig } from '../crud-generic/admin-crud.component';

@Component({
    selector: 'app-countries-admin',
    template: `<app-admin-crud [config]="config"></app-admin-crud>`,
    standalone: false
})
export class CountriesAdminComponent {
    config: CrudConfig = {
        title:       'Pays',
        icon:        'ri-flag-2-line',
        apiPath:     'countries',
        idField:     'id_country',
        breadcrumb:  'Pays',
        searchFields: ['title', 'code'],
        listColumns: [
            { key: 'flag',       label: 'Drapeau' },
            { key: 'title',      label: 'Nom' },
            { key: 'code',       label: 'Code' },
            { key: 'phone_code', label: 'Indicatif' },
            { key: 'active',     label: 'Statut', type: 'badge' },
        ],
        fields: [
            { key: 'title',      label: 'Nom',       type: 'text', required: true, colSize: 8 },
            { key: 'flag',       label: 'Emoji drapeau', type: 'text', colSize: 4, hint: 'ex: 🇹🇳' },
            { key: 'code',       label: 'Code ISO',  type: 'text', colSize: 6, hint: 'ex: TN' },
            { key: 'phone_code', label: 'Indicatif téléphone', type: 'text', colSize: 6, hint: 'ex: +216' },
            { key: 'active',     label: 'Actif',     type: 'boolean', default: true, colSize: 6 },
        ],
    };
}
