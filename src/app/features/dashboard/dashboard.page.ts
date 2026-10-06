import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Dashboard } from '../../core/models';
import { money } from '../../core/format';
import { StatCardComponent } from '../../shared/stat-card.component';

@Component({
  selector: 'app-dashboard',
  imports: [StatCardComponent, RouterLink],
  template: `
    <h1 class="text-xl font-semibold">Dashboard</h1>
    <p class="mb-6 text-sm text-muted">Overview of all customers and scales</p>
    @if (error()) { <p class="card p-4 text-sm text-red-700">{{ error() }}</p> }
    @if (data(); as d) {
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <app-stat-card label="Customers" [value]="d.customers" icon="storefront" [hint]="d.activeCustomers + ' active'" />
        <app-stat-card label="Scales online" [value]="d.onlineScales + ' / ' + d.scales" icon="wifi" [hint]="d.unassignedScales + ' not assigned to a shop'" />
        <app-stat-card label="Bills today" [value]="d.billsToday" icon="receipt_long" />
        <app-stat-card label="Sales today" [value]="money(d.salesToday)" icon="currency_rupee" hint="All customers" />
      </div>

      <div class="card mt-6">
        <div class="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 class="font-semibold">Subscriptions ending within 15 days</h2>
        </div>
        @if (d.expiringSubscriptions.length) {
          <table class="table">
            <tbody>
              @for (c of d.expiringSubscriptions; track c.id) {
                <tr>
                  <td><a class="font-medium text-brand hover:underline" [routerLink]="['/customers', c.id]">{{ c.name }}</a></td>
                  <td class="text-right">
                    <span [class]="isPast(c.subscriptionEndsAt) ? 'badge-red' : 'badge-amber'">
                      {{ isPast(c.subscriptionEndsAt) ? 'Ended' : 'Ends' }} {{ c.subscriptionEndsAt.slice(0, 10) }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="px-5 py-6 text-sm text-muted">Nothing ending soon.</p>
        }
      </div>
    }
  `,
})
export class DashboardPage implements OnInit {
  private api = inject(ApiService);
  data = signal<Dashboard | null>(null);
  error = signal<string | null>(null);
  money = money;

  async ngOnInit() {
    try {
      this.data.set(await this.api.get<Dashboard>('/admin/dashboard'));
    } catch (e: any) {
      this.error.set(e.message);
    }
  }

  isPast(iso: string) {
    return new Date(iso) < new Date();
  }
}
