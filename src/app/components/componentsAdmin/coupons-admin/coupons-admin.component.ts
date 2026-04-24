import { Component } from '@angular/core';
import { CrudConfig } from '../crud-generic/admin-crud.component';

@Component({
    selector: 'app-coupons-admin',
    template: `<app-admin-crud [config]="config"></app-admin-crud>`,
    standalone: false
})
export class CouponsAdminComponent {
    config: CrudConfig = {
        title:       'Coupons',
        icon:        'ri-coupon-2-line',
        apiPath:     'coupons',
        idField:     'id_coupon',
        breadcrumb:  'Coupons',
        searchFields: ['title', 'description'],
        listColumns: [
            { key: 'id_coupon',        label: 'ID' },
            { key: 'title',            label: 'Titre' },
            { key: 'price',            label: 'Prix (DT)', type: 'number' },
            { key: 'number_of_coupon', label: 'Stock',     type: 'number' },
            { key: 'used',             label: 'Utilisés',  type: 'number' },
            { key: 'date_end',         label: 'Expire le', type: 'date' },
            { key: 'active',           label: 'Statut',    type: 'badge' },
        ],
        fields: [
            { key: 'title',            label: 'Titre',        type: 'text',     required: true, colSize: 8 },
            { key: 'price',            label: 'Prix (DT)',    type: 'number',   min: 0, step: 0.01, colSize: 4 },
            { key: 'description',      label: 'Description',  type: 'textarea', colSize: 12 },
            { key: 'date_start',       label: 'Date début',   type: 'date',     colSize: 6 },
            { key: 'date_end',         label: 'Date fin',     type: 'date',     colSize: 6 },
            { key: 'number_of_coupon', label: 'Nombre total', type: 'number',   min: 0, colSize: 6 },
            { key: 'active',           label: 'Actif',        type: 'boolean',  default: true, colSize: 6 },
        ],
    };
}
