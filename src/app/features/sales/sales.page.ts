import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Bill, Customer, CustomerDetail, DailyRow, ItemSale } from '../../core/models';
import { addDays, isoDay, money, qty } from '../../core/format';
import { ModalComponent } from '../../shared/modal.component';
import { StatCardComponent } from '../../shared/stat-card.component';

@Component({
  selector: 'app-sales',
  imports: [FormsModule, ModalComponent, StatCardComponent],
  template: `
    <h1 class="text-xl font-semibold">Sales</h1>
    <p class="mb-6 text-sm text-muted">Bills uploaded by the scales, per branch</p>

    <div class="card mb-6 flex flex-wrap items-end gap-3 p-4">
      <div class="min-w-[200px]">
        <label class="label">Customer</label>
        <select class="input" [(ngModel)]="customer" (ngModelChange)="loadBranches()">
          @for (c of customers(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
        </select>
      </div>
      <div class="min-w-[180px]">
        <label class="label">Branch</label>
        <select class="input" [(ngModel)]="branch" (ngModelChange)="load()">
          @for (b of branches(); track b.id) { <option [value]="b.id">{{ b.name }}</option> }
        </select>
      </div>
      <div><label class="label">From</label><input class="input" type="date" [(ngModel)]="from" (ngModelChange)="load()" /></div>
      <div><label class="label">To</label><input class="input" type="date" [(ngModel)]="to" (ngModelChange)="load()" /></div>
      <button class="btn-outline ml-auto" (click)="exportXlsx()" [disabled]="!daily().length">
        <span class="material-symbols-outlined">download</span>Excel
      </button>
    </div>

    <div class="mb-6 grid gap-4 sm:grid-cols-3">
      <app-stat-card label="Sales" [value]="money(totals().total)" icon="currency_rupee" />
      <app-stat-card label="Bills" [value]="totals().bills" icon="receipt_long" />
      <app-stat-card label="Discount given" [value]="money(totals().discount)" icon="sell" />
    </div>

    <div class="mb-4 flex gap-2 border-b border-line">
      <button class="tab" [class.tab-active]="tab() === 'daily'" (click)="tab.set('daily')">By day</button>
      <button class="tab" [class.tab-active]="tab() === 'items'" (click)="tab.set('items')">By item</button>
    </div>

    <div class="card divide-y divide-line md:hidden">
      @if (tab() === 'daily') {
        @for (d of daily(); track d.date) {
          <button class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-slate-50" (click)="openDay(d.date)">
            <div class="min-w-0">
              <div class="font-medium">{{ d.date }}</div>
              <div class="text-xs text-muted">
                {{ d.bills }} {{ d.bills === 1 ? 'bill' : 'bills' }} · Discount {{ money(d.discount) }} · Tax {{ money(d.tax) }}
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <span class="font-semibold">{{ money(d.total) }}</span>
              <span class="material-symbols-outlined text-muted">chevron_right</span>
            </div>
          </button>
        } @empty {
          <p class="py-10 text-center text-sm text-muted">Pick a customer and branch</p>
        }
      } @else {
        @for (i of itemSales(); track i.plu + i.name) {
          <div class="flex items-center justify-between gap-3 px-4 py-3">
            <div class="min-w-0">
              <div class="truncate font-medium">{{ i.name }}</div>
              <div class="text-xs text-muted">PLU {{ i.plu }} · {{ qty(i.quantity, i.unit) }}</div>
            </div>
            <span class="shrink-0 font-semibold">{{ money(i.amount) }}</span>
          </div>
        } @empty {
          <p class="py-10 text-center text-sm text-muted">No sales in this period</p>
        }
      }
    </div>

    <div class="card hidden overflow-x-auto md:block">
      @if (tab() === 'daily') {
        <table class="table">
          <thead><tr><th>Date</th><th class="text-right">Bills</th><th class="text-right">Discount</th><th class="text-right">Tax</th><th class="text-right">Total</th></tr></thead>
          <tbody>
            @for (d of daily(); track d.date) {
              <tr class="cursor-pointer hover:bg-slate-50" (click)="openDay(d.date)">
                <td class="font-medium">{{ d.date }}</td>
                <td class="text-right">{{ d.bills }}</td>
                <td class="text-right">{{ money(d.discount) }}</td>
                <td class="text-right">{{ money(d.tax) }}</td>
                <td class="text-right font-medium">{{ money(d.total) }}</td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="py-10 text-center text-muted">Pick a customer and branch</td></tr>
            }
          </tbody>
        </table>
      } @else {
        <table class="table">
          <thead><tr><th>PLU</th><th>Item</th><th class="text-right">Quantity</th><th class="text-right">Amount</th></tr></thead>
          <tbody>
            @for (i of itemSales(); track i.plu + i.name) {
              <tr>
                <td class="font-mono">{{ i.plu }}</td>
                <td class="font-medium">{{ i.name }}</td>
                <td class="text-right">{{ qty(i.quantity, i.unit) }}</td>
                <td class="text-right font-medium">{{ money(i.amount) }}</td>
              </tr>
            } @empty {
              <tr><td colspan="4" class="py-10 text-center text-muted">No sales in this period</td></tr>
            }
          </tbody>
        </table>
      }
    </div>

    @if (dayBills(); as bills) {
      <app-modal [title]="'Bills on ' + openDate" [width]="720" (close)="dayBills.set(null)">
        @for (b of bills; track b.id) {
          <div class="mb-3 rounded-lg border border-line">
            <div class="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2 text-sm">
              <span class="font-medium">Bill {{ b.billNo }} · {{ time(b.billedAt) }} · {{ b.scale?.name || 'Scale' }}</span>
              <span class="shrink-0 font-semibold">{{ money(b.total) }}</span>
            </div>
            <div class="divide-y divide-line md:hidden">
              @for (l of b.lines; track l.id) {
                <div class="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <div class="min-w-0">
                    <div class="truncate">{{ l.name }} <span class="text-xs text-muted">PLU {{ l.plu }}</span></div>
                    <div class="text-xs text-muted">{{ qty(l.quantity, l.unit) }} × {{ money(l.price) }}</div>
                  </div>
                  <span class="shrink-0">{{ money(l.amount) }}</span>
                </div>
              }
              @if (b.discount) {
                <div class="flex justify-between px-4 py-2.5 text-sm"><span class="text-muted">Discount</span><span>−{{ money(b.discount) }}</span></div>
              }
            </div>
            <div class="hidden md:block">
              <table class="table">
                <tbody>
                  @for (l of b.lines; track l.id) {
                    <tr>
                      <td>{{ l.name }} <span class="text-xs text-muted">PLU {{ l.plu }}</span></td>
                      <td class="text-right">{{ qty(l.quantity, l.unit) }} × {{ money(l.price) }}</td>
                      <td class="text-right">{{ money(l.amount) }}</td>
                    </tr>
                  }
                  @if (b.discount) { <tr><td colspan="2" class="text-right text-muted">Discount</td><td class="text-right">−{{ money(b.discount) }}</td></tr> }
                </tbody>
              </table>
            </div>
          </div>
        } @empty {
          <p class="text-sm text-muted">No bills on this day.</p>
        }
      </app-modal>
    }
  `,
})
export class SalesPage implements OnInit {
  customerId = input<string>();
  private api = inject(ApiService);
  private toast = inject(ToastService);

  customers = signal<Customer[]>([]);
  branches = signal<{ id: string; name: string }[]>([]);
  daily = signal<DailyRow[]>([]);
  itemSales = signal<ItemSale[]>([]);
  dayBills = signal<Bill[] | null>(null);
  tab = signal<'daily' | 'items'>('daily');
  customer = '';
  branch = '';
  to = isoDay();
  from = addDays(isoDay(), -6);
  openDate = '';
  money = money;
  qty = qty;

  totals = computed(() =>
    this.daily().reduce((t, d) => ({ total: t.total + d.total, bills: t.bills + d.bills, discount: t.discount + d.discount }), {
      total: 0, bills: 0, discount: 0,
    }),
  );

  async ngOnInit() {
    try {
      const list = await this.api.get<Customer[]>('/admin/customers');
      this.customers.set(list);
      this.customer = this.customerId() ?? list[0]?.id ?? '';
      await this.loadBranches();
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  async loadBranches() {
    if (!this.customer) return;
    const c = await this.api.get<CustomerDetail>(`/admin/customers/${this.customer}`);
    this.branches.set(c.branches);
    this.branch = c.branches[0]?.id ?? '';
    this.load();
  }

  async load() {
    if (!this.branch || !this.from || !this.to) {
      this.daily.set([]);
      this.itemSales.set([]);
      return;
    }
    const q = { branchId: this.branch, from: this.from, to: this.to, tz: -new Date().getTimezoneOffset() };
    try {
      const [daily, items] = await Promise.all([
        this.api.get<DailyRow[]>('/reports/daily', q),
        this.api.get<ItemSale[]>('/reports/items', q),
      ]);
      this.daily.set(daily.slice().reverse());
      this.itemSales.set(items);
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  async openDay(date: string) {
    this.openDate = date;
    try {
      this.dayBills.set(await this.api.get<Bill[]>('/reports/bills', { branchId: this.branch, date, tz: -new Date().getTimezoneOffset() }));
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  time(iso: string) {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  exportXlsx() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(this.daily().map((d) => ({
      Date: d.date, Bills: d.bills, Discount: d.discount, Tax: d.tax, Total: d.total,
    }))), 'By day');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(this.itemSales().map((i) => ({
      PLU: i.plu, Item: i.name, Unit: i.unit, Quantity: i.quantity, Amount: i.amount,
    }))), 'By item');
    const branch = this.branches().find((b) => b.id === this.branch)?.name ?? 'branch';
    XLSX.writeFile(wb, `sales-${branch}-${this.from}-to-${this.to}.xlsx`);
  }
}
