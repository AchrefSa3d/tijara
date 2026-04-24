import { Component } from '@angular/core';
import { CrudConfig } from '../crud-generic/admin-crud.component';

@Component({
    selector: 'app-cities-admin',
    template: `<app-admin-crud [config]="config"></app-admin-crud>`,
    standalone: false
})
export class CitiesAdminComponent {
    config: CrudConfig = {
        title:       'Villes',
        icon:        'ri-building-line',
        apiPath:     'cities',
        idField:     'id_city',
        breadcrumb:  'Villes',
        searchFields: ['title', 'title_en', 'title_ar'],
        listColumns: [
            { key: 'id_city',    label: 'ID' },
            { key: 'title',      label: 'Nom (FR)' },
            { key: 'title_en',   label: 'EN' },
            { key: 'title_ar',   label: 'AR' },
            { key: 'id_country', label: 'Pays ID' },
            { key: 'active',     label: 'Statut', type: 'badge' },
        ],
        fields: [
            { key: 'title',      label: 'Nom (FR)',  type: 'text', required: true, colSize: 6 },
            { key: 'id_country', label: 'ID pays',   type: 'number', colSize: 6, min: 0 },
            { key: 'title_en',   label: 'Nom (EN)',  type: 'text', colSize: 6 },
            { key: 'title_ar',   label: 'Nom (AR)',  type: 'text', colSize: 6 },
            { key: 'image',      label: 'URL image', type: 'text', colSize: 12 },
            { key: 'active',     label: 'Actif',     type: 'boolean', default: true, colSize: 6 },
        ],
    };
}
