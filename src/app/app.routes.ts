import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.page').then((m) => m.LoginPage) },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage) },
      { path: 'customers', loadComponent: () => import('./features/customers/customers.page').then((m) => m.CustomersPage) },
      { path: 'customers/:id', loadComponent: () => import('./features/customers/customer-detail.page').then((m) => m.CustomerDetailPage) },
      { path: 'scales', loadComponent: () => import('./features/scales/scales.page').then((m) => m.ScalesPage) },
      { path: 'sales', loadComponent: () => import('./features/sales/sales.page').then((m) => m.SalesPage) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: '' },
];
