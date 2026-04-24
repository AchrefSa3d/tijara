import { Component } from '@angular/core';
import { CrudConfig } from '../crud-generic/admin-crud.component';

@Component({
    selector: 'app-brands-admin',
    template: `<app-admin-crud [config]="config"></app-admin-crud>`,
    standalone: false
})
export class BrandsAdminComponent {
    config: CrudConfig = {
        title:       'Marques',
        icon:        'ri-price-tag-3-line',
        apiPath:     'brands',
        idField:     'id_brand',
        breadcrumb:  'Marques',
        searchFields: ['title', 'description'],
        listColumns: [
            { key: 'id_brand',    label: 'ID' },
            { key: 'title',       label: 'Nom' },
            { key: 'description', label: 'Description' },
            { key: 'active',      label: 'Statut', type: 'badge' },
            { key: 'created_at',  label: 'Créé le', type: 'date' },
        ],
        fields: [
            { key: 'title',       label: 'Nom',         type: 'text',     required: true, colSize: 12 },
            { key: 'description', label: 'Description', type: 'textarea', colSize: 12 },
            { key: 'image',       label: 'URL image',   type: 'text',     colSize: 12 },
            { key: 'active',      label: 'Actif',       type: 'boolean',  default: true, colSize: 6 },
        ],
    };
}
