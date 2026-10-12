import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

// Sidebar from lg up; below that a top bar and a bottom navigation bar, like a mobile app.
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-dvh overflow-hidden">
      <aside class="hidden w-60 shrink-0 border-r border-line bg-white lg:block">
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
               class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              <span class="material-symbols-outlined">{{ link.icon }}</span>{{ link.label }}
            </a>
          }
        </nav>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-4 lg:h-16 lg:px-8">
          <div class="flex items-center gap-2 lg:hidden">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              <span class="material-symbols-outlined">scale</span>
            </div>
            <div class="text-sm font-semibold">Metro Scales</div>
          </div>
          <div class="hidden lg:block"></div>
          <div class="flex items-center gap-1 lg:gap-3">
            <div class="hidden text-right sm:block">
              <div class="text-sm font-medium">{{ auth.user()?.name }}</div>
              <div class="text-xs text-muted">{{ auth.user()?.email }}</div>
            </div>
            <button class="btn-ghost" (click)="auth.logout()" title="Log out" aria-label="Log out">
              <span class="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>

        <main class="flex-1 overflow-y-auto p-4 lg:p-8">
          <router-outlet />
        </main>

        <nav class="flex shrink-0 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
          @for (link of links; track link.path) {
            <a [routerLink]="link.path" routerLinkActive #rla="routerLinkActive"
               class="flex flex-1 flex-col items-center gap-1 pt-2 pb-1.5 text-[11px] font-medium"
               [class.text-brand-dark]="rla.isActive" [class.text-slate-500]="!rla.isActive">
              <span class="flex h-8 w-14 items-center justify-center rounded-full transition-colors"
                    [class.bg-brand-soft]="rla.isActive">
                <span class="material-symbols-outlined !text-[22px]" [class.icon-filled]="rla.isActive">{{ link.icon }}</span>
              </span>
              {{ link.label }}
            </a>
          }
        </nav>
      </div>
    </div>
  `,
})
export class ShellComponent {
  auth = inject(AuthService);
  links = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/customers', label: 'Customers', icon: 'storefront' },
    { path: '/scales', label: 'Scales', icon: 'scale' },
    { path: '/sales', label: 'Sales', icon: 'receipt_long' },
  ];
}
