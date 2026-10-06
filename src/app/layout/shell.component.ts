import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen overflow-hidden">
      <aside class="fixed inset-y-0 left-0 z-30 w-60 -translate-x-full border-r border-line bg-white transition lg:static lg:translate-x-0"
             [class.translate-x-0]="menuOpen()">
        <div class="flex h-16 items-center gap-2 px-5">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            <span class="material-symbols-outlined">scale</span>
          </div>
          <div>
            <div class="text-sm font-semibold leading-tight">Metro Scales</div>
            <div class="text-xs text-muted leading-tight">Dealer admin</div>
          </div>
        </div>
        <nav class="mt-2 flex flex-col gap-0.5 px-3">
          @for (link of links; track link.path) {
            <a [routerLink]="link.path" routerLinkActive="!bg-brand-soft !text-brand-dark"
               (click)="menuOpen.set(false)"
               class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              <span class="material-symbols-outlined">{{ link.icon }}</span>{{ link.label }}
            </a>
          }
        </nav>
      </aside>
      @if (menuOpen()) {
        <div class="fixed inset-0 z-20 bg-slate-900/30 lg:hidden" (click)="menuOpen.set(false)"></div>
      }
      <div class="flex min-w-0 flex-1 flex-col">
        <header class="flex h-16 shrink-0 items-center justify-between border-b border-line bg-white px-4 lg:px-8">
          <button class="btn-ghost lg:hidden" (click)="menuOpen.set(true)" aria-label="Menu">
            <span class="material-symbols-outlined">menu</span>
          </button>
          <div></div>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <div class="text-sm font-medium">{{ auth.user()?.name }}</div>
              <div class="text-xs text-muted">{{ auth.user()?.email }}</div>
            </div>
            <button class="btn-ghost" (click)="auth.logout()" title="Log out">
              <span class="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>
        <main class="flex-1 overflow-y-auto p-4 lg:p-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent {
  auth = inject(AuthService);
  menuOpen = signal(false);
  links = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/customers', label: 'Customers', icon: 'storefront' },
    { path: '/scales', label: 'Scales', icon: 'scale' },
    { path: '/sales', label: 'Sales', icon: 'receipt_long' },
  ];
}
