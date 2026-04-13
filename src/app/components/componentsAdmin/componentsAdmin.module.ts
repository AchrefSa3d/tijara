import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import {
  NgbToastModule, NgbProgressbarModule, NgbDropdownModule, NgbTooltipModule
} from '@ng-bootstrap/ng-bootstrap';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SharedModule } from 'src/app/shared/shared.module';

import { DashboardAdminComponent }    from './dashboard/dashboard-admin.component';
import { UsersAdminComponent }        from './users-admin/users-admin.component';
import { CategoriesAdminComponent }   from './categories-admin/categories-admin.component';
import { OrdersAdminComponent }       from './orders-admin/orders-admin.component';
import { VendorsAdminComponent }      from './vendors-admin/vendors-admin.component';
import { AnnoncesAdminComponent }     from './annonces-admin/annonces-admin.component';
import { ProductsAdminComponent }     from './products-admin/products-admin.component';
import { VendorDetailAdminComponent } from './vendor-detail-admin/vendor-detail-admin.component';
import { UserDetailAdminComponent }   from './user-detail-admin/user-detail-admin.component';

const routes: Routes = [
  { path: '',                   redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard',          component: DashboardAdminComponent },
  { path: 'users',              component: UsersAdminComponent },
  { path: 'user-detail/:id',    component: UserDetailAdminComponent },
  { path: 'categories',         component: CategoriesAdminComponent },
  { path: 'orders',             component: OrdersAdminComponent },
  { path: 'vendors',            component: VendorsAdminComponent },
  { path: 'vendor-detail/:id',  component: VendorDetailAdminComponent },
  { path: 'annonces',           component: AnnoncesAdminComponent },
  { path: 'products',           component: ProductsAdminComponent },
  {
    path: 'reclamations',
    loadChildren: () => import('./reclamations/reclamations.module').then(m => m.ReclamationsModule),
  },
];

@NgModule({
  declarations: [
    DashboardAdminComponent,
    UsersAdminComponent,
    CategoriesAdminComponent,
    OrdersAdminComponent,
    VendorsAdminComponent,
    AnnoncesAdminComponent,
    ProductsAdminComponent,
    VendorDetailAdminComponent,
    UserDetailAdminComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbToastModule,
    NgbProgressbarModule,
    NgbDropdownModule,
    NgbTooltipModule,
    NgApexchartsModule,
    SharedModule,
    RouterModule.forChild(routes),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ComponentsAdminModule {}
