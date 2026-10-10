import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Dashboard } from '../../core/models';
import { money } from '../../core/format';
import { StatCardComponent } from '../../shared/stat-card.component';
import { ScaleDialogComponent } from '../../shared/scale-dialog.component';

@Component({
  selector: 'app-dashboard',
  imports: [StatCardComponent, RouterLink, ScaleDialogComponent],
  template: `
    <div class="mb-6 md:mb-8">
      <div class="label-sm uppercase text-primary">{{ today }}</div>
      <h1 class="headline mt-1">{{ greeting() }}</h1>
    </div>

    @if (error()) {
      <div class="card mb-6 flex items-center gap-3 p-4 text-sm text-error">
        <span class="material-symbols-rounded">cloud_off</span>{{ error() }}
      </div>
    }

    <div class="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
      <app-stat-card label="Customers" [value]="d()?.customers ?? '–'" icon="storefront" [hint]="d() ? d()!.activeCustomers + ' active' : null" />
      <app-stat-card label="Scales online" [value]="d() ? d()!.onlineScales + ' / ' + d()!.scales : '–'" icon="wifi" tone="success"
                     [hint]="d() ? d()!.unassignedScales + ' in stock' : null" />
      <app-stat-card label="Bills today" [value]="d()?.billsToday ?? '–'" icon="receipt_long" tone="tertiary" />
      <app-stat-card label="Sales today" [value]="d() ? money(d()!.salesToday) : '–'" icon="currency_rupee" tone="warning" hint="All shops" />
    </div>

    <h2 class="title-md mb-3 mt-8 px-1">Quick actions</h2>
    <div class="grid gap-3 sm:grid-cols-3">
      <button class="card flex items-center gap-4 p-4 text-left transition hover:bg-surface-mid" (click)="router.navigate(['/customers'], { queryParams: { new: 1 } })">
        <span class="icon-box"><span class="material-symbols-rounded">add_business</span></span>
        <span><span class="block font-bold">New customer</span><span class="text-sm text-on-surface-variant">Shop, branch and owner login</span></span>
      </button>
      <button class="card flex items-center gap-4 p-4 text-left transition hover:bg-surface-mid" (click)="registering.set(true)">
        <span class="icon-box"><span class="material-symbols-rounded">add_link</span></span>
        <span><span class="block font-bold">Register a scale</span><span class="text-sm text-on-surface-variant">By its MAC address</span></span>
      </button>
      <a class="card flex items-center gap-4 p-4 transition hover:bg-surface-mid" routerLink="/sales">
        <span class="icon-box"><span class="material-symbols-rounded">bar_chart</span></span>
        <span><span class="block font-bold">Sales report</span><span class="text-sm text-on-surface-variant">Per branch, with Excel export</span></span>
      </a>
    </div>

    <div class="mt-8 grid gap-4 lg:grid-cols-2">
      <section class="card overflow-hidden">
        <div class="flex items-center justify-between px-5 pb-2 pt-5">
          <h2 class="title-md">Subscriptions ending soon</h2>
          <span class="pill-neutral">15 days</span>
        </div>
        @for (c of d()?.expiringSubscriptions ?? []; track c.id) {
          <a class="row-item" [routerLink]="['/customers', c.id]">
            <span class="avatar !bg-warning-container !text-on-warning-container">{{ c.name[0] }}</span>
            <span class="min-w-0 flex-1 truncate font-semibold">{{ c.name }}</span>
            <span [class]="isPast(c.subscriptionEndsAt) ? 'pill-danger' : 'pill-warning'">
              {{ isPast(c.subscriptionEndsAt) ? 'Ended' : 'Ends' }} {{ shortDate(c.subscriptionEndsAt) }}
            </span>
          </a>
        } @empty {
          <div class="flex items-center gap-3 px-5 pb-6 pt-2 text-sm text-on-surface-variant">
            <span class="material-symbols-rounded text-success">task_alt</span>Nothing ending in the next 15 days.
          </div>
        }
      </section>

      <section class="card overflow-hidden">
        <div class="px-5 pb-2 pt-5"><h2 class="title-md">Scales</h2></div>
        <a class="row-item" routerLink="/scales" [queryParams]="{ status: 'offline' }">
          <span class="icon-box !bg-surface-highest !text-on-surface-variant"><span class="material-symbols-rounded">wifi_off</span></span>
          <span class="flex-1"><span class="block font-semibold">Offline</span><span class="text-sm text-on-surface-variant">Not heard from in the last 2 minutes</span></span>
          <span class="text-lg font-extrabold">{{ d() ? d()!.scales - d()!.onlineScales : '–' }}</span>
        </a>
        <a class="row-item mb-2" routerLink="/scales" [queryParams]="{ status: 'unassigned' }">
          <span class="icon-box !bg-tertiary-container !text-on-tertiary-container"><span class="material-symbols-rounded">inventory_2</span></span>
          <span class="flex-1"><span class="block font-semibold">In stock</span><span class="text-sm text-on-surface-variant">Registered, not given to a shop yet</span></span>
          <span class="text-lg font-extrabold">{{ d()?.unassignedScales ?? '–' }}</span>
        </a>
      </section>
    </div>

    @if (registering()) {
      <app-scale-dialog (close)="registering.set(false)" (saved)="registering.set(false); load()" />
    }
  `,
})
export class DashboardPage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  router = inject(Router);
  d = signal<Dashboard | null>(null);
  error = signal<string | null>(null);
  registering = signal(false);
  money = money;
  today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  greeting = computed(() => {
    const h = new Date().getHours();
    const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const first = this.auth.user()?.name?.split(' ')[0];
    return first ? `${part}, ${first}` : part;
  });

  ngOnInit() {
    this.load();
  }

  async load() {
    try {
      this.d.set(await this.api.get<Dashboard>('/admin/dashboard'));
      this.error.set(null);
    } catch (e: any) {
      this.error.set(e.message);
    }
  }

  isPast(iso: string) {
    return new Date(iso) < new Date();
  }

  shortDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}
