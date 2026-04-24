import { Component } from '@angular/core';
import { CrudConfig } from '../crud-generic/admin-crud.component';

@Component({
    selector: 'app-causes-admin',
    template: `<app-admin-crud [config]="config"></app-admin-crud>`,
    standalone: false
})
export class CausesAdminComponent {
    config: CrudConfig = {
        title:       'Causes de réclamation',
        icon:        'ri-customer-service-2-line',
        apiPath:     'causes',
        idField:     'id_cause',
        breadcrumb:  'Causes',
        searchFields: ['title', 'description', 'type'],
        listColumns: [
            { key: 'id_cause',    label: 'ID' },
            { key: 'title',       label: 'Titre' },
            { key: 'type',        label: 'Type' },
            { key: 'email',       label: 'Email contact' },
            { key: 'active',      label: 'Statut', type: 'badge' },
        ],
        fields: [
            { key: 'title',       label: 'Titre',        type: 'text',     required: true, colSize: 8 },
            { key: 'type',        label: 'Type',         type: 'select',   colSize: 4,
                options: [
                    { value: 'order',   label: 'Commande' },
                    { value: 'product', label: 'Produit' },
                    { value: 'vendor',  label: 'Vendeur' },
                    { value: 'payment', label: 'Paiement' },
                    { value: 'other',   label: 'Autre' },
                ] },
            { key: 'description', label: 'Description',  type: 'textarea', colSize: 12 },
            { key: 'email',       label: 'Email contact', type: 'email',   colSize: 8 },
            { key: 'active',      label: 'Actif',        type: 'boolean',  default: true, colSize: 4 },
        ],
    };
}
