import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AccountMenuComponent } from './account-menu.component';

/// Phones: top app bar + bottom navigation bar.
/// Tablets: navigation rail. Desktops: navigation drawer.
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AccountMenuComponent],
  template: `
    <!-- Side navigation (tablet rail / desktop drawer) -->
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-24 flex-col items-center bg-surface-low py-4 md:flex lg:w-[264px] lg:items-stretch lg:px-3">
      <a routerLink="/dashboard" class="mb-6 flex items-center gap-3 lg:px-3">
        <img src="icons/icon.svg" alt="" class="h-11 w-11 rounded-[14px]" />
        <div class="hidden lg:block">
          <div class="font-extrabold leading-tight tracking-tight">Metro Scales</div>
          <div class="text-xs font-semibold text-on-surface-variant">Dealer admin</div>
        </div>
      </a>
      <nav class="flex flex-1 flex-col gap-3 lg:gap-1">
        @for (l of links; track l.path) {
          <a [routerLink]="l.path" routerLinkActive #rla="routerLinkActive" class="group flex flex-col items-center gap-1 lg:flex-row lg:gap-3 lg:rounded-full lg:px-4 lg:py-3.5"
             [class.lg:bg-secondary-container]="rla.isActive" [class.lg:hover:bg-on-surface/5]="!rla.isActive">
            <span class="flex h-8 w-14 items-center justify-center rounded-full transition lg:h-auto lg:w-auto"
                  [class]="rla.isActive ? 'bg-secondary-container text-on-secondary-container lg:bg-transparent' : 'text-on-surface-variant group-hover:bg-on-surface/5 lg:group-hover:bg-transparent'">
              <span class="material-symbols-rounded" [class.icon-fill]="rla.isActive">{{ l.icon }}</span>
            </span>
            <span class="text-xs font-semibold lg:text-sm lg:font-bold" [class]="rla.isActive ? 'text-on-surface lg:text-on-secondary-container' : 'text-on-surface-variant'">{{ l.label }}</span>
          </a>
        }
      </nav>
      <app-account-menu [up]="true" [wide]="true" />
    </aside>

    <!-- Phone top app bar -->
    <header class="pt-safe sticky top-0 z-30 bg-surface/90 backdrop-blur-md md:hidden">
      <div class="flex h-16 items-center gap-3 px-4">
        <img src="icons/icon.svg" alt="" class="h-9 w-9 rounded-xl" />
        <div class="flex-1 text-[17px] font-extrabold tracking-tight">Metro Scales</div>
        <app-account-menu />
      </div>
    </header>

    <main class="md:pl-24 lg:pl-[264px]">
      <div class="mx-auto max-w-6xl px-4 pb-[calc(112px+env(safe-area-inset-bottom))] pt-2 md:px-8 md:pb-12 md:pt-8">
        <router-outlet />
      </div>
    </main>

    <!-- Phone bottom navigation bar -->
    <nav class="pb-safe fixed inset-x-0 bottom-0 z-30 bg-surface-mid md:hidden">
      <div class="flex h-20">
        @for (l of links; track l.path) {
          <a [routerLink]="l.path" routerLinkActive #rla="routerLinkActive" class="flex flex-1 flex-col items-center justify-center gap-1">
            <span class="flex h-8 w-16 items-center justify-center rounded-full transition-colors"
                  [class]="rla.isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'">
              <span class="material-symbols-rounded" [class.icon-fill]="rla.isActive">{{ l.icon }}</span>
            </span>
            <span class="text-xs" [class]="rla.isActive ? 'font-bold text-on-surface' : 'font-semibold text-on-surface-variant'">{{ l.label }}</span>
          </a>
        }
      </div>
    </nav>
  `,
})
export class ShellComponent {
  links = [
    { path: '/dashboard', label: 'Home', icon: 'space_dashboard' },
    { path: '/customers', label: 'Customers', icon: 'storefront' },
    { path: '/scales', label: 'Scales', icon: 'scale' },
    { path: '/sales', label: 'Sales', icon: 'receipt_long' },
  ];
}
