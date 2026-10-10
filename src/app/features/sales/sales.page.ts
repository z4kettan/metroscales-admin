import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Bill, Customer, CustomerDetail, DailyRow, ItemSale } from '../../core/models';
import { addDays, isoDay, money, qty } from '../../core/format';
import { ModalComponent } from '../../shared/modal.component';
import { StatCardComponent } from '../../shared/stat-card.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';

@Component({
  selector: 'app-sales',
  imports: [FormsModule, ModalComponent, StatCardComponent, PageHeaderComponent, EmptyStateComponent],
  template: `
    <app-page-header title="Sales" subtitle="Bills uploaded by the scales, per branch">
      <button class="btn-tonal" (click)="exportXlsx()" [disabled]="!daily().length"><span class="material-symbols-rounded">download</span>Excel</button>
    </app-page-header>

    <section class="card mb-4 grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
      <div class="col-span-2 md:col-span-1">
        <label class="field-label">Customer</label>
        <select class="select" [(ngModel)]="customer" (ngModelChange)="loadBranches()">
          @for (c of customers(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
        </select>
      </div>
      <div class="col-span-2 md:col-span-1">
        <label class="field-label">Branch</label>
        <select class="select" [(ngModel)]="branch" (ngModelChange)="load()">
          @for (b of branches(); track b.id) { <option [value]="b.id">{{ b.name }}</option> }
        </select>
      </div>
      <div><label class="field-label">From</label><input class="input" type="date" [(ngModel)]="from" (ngModelChange)="load()" /></div>
      <div><label class="field-label">To</label><input class="input" type="date" [(ngModel)]="to" (ngModelChange)="load()" /></div>
    </section>

    <div class="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
      @for (r of ranges; track r.days) {
        <button class="chip" [class.chip-selected]="rangeDays() === r.days" (click)="setRange(r.days)">{{ r.label }}</button>
      }
    </div>

    <div class="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      <div class="col-span-2 md:col-span-1"><app-stat-card label="Sales" [value]="money(totals().total)" icon="currency_rupee" /></div>
      <app-stat-card label="Bills" [value]="totals().bills" icon="receipt_long" tone="tertiary" />
      <app-stat-card label="Discount" [value]="money(totals().discount)" icon="sell" tone="warning" />
    </div>

    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="segmented">
        <button class="segment" [class.segment-on]="tab() === 'daily'" (click)="tab.set('daily')">
          @if (tab() === 'daily') { <span class="material-symbols-rounded !text-lg">check</span> }By day
        </button>
        <button class="segment" [class.segment-on]="tab() === 'items'" (click)="tab.set('items')">
          @if (tab() === 'items') { <span class="material-symbols-rounded !text-lg">check</span> }By item
        </button>
      </div>
      <button class="btn-tonal md:hidden" (click)="exportXlsx()" [disabled]="!daily().length"><span class="material-symbols-rounded">download</span>Excel</button>
    </div>

    <section class="card overflow-hidden">
      @if (tab() === 'daily') {
        @if (daily().length) {
          <div class="py-2 md:hidden">
            @for (d of daily(); track d.date) {
              <button class="row-item" (click)="openDay(d.date)">
                <span class="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-surface-highest leading-none">
                  <span class="text-[15px] font-extrabold">{{ d.date.slice(8) }}</span>
                  <span class="text-[10px] font-bold uppercase text-on-surface-variant">{{ month(d.date) }}</span>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block font-semibold">{{ weekday(d.date) }}</span>
                  <span class="block text-xs text-on-surface-variant">{{ d.bills }} bills{{ d.discount ? ' · ' + money(d.discount) + ' off' : '' }}</span>
                </span>
                <span class="font-extrabold">{{ money(d.total) }}</span>
              </button>
            }
          </div>
          <table class="data-table hidden md:table">
            <thead><tr><th>Date</th><th class="text-right">Bills</th><th class="text-right">Discount</th><th class="text-right">Tax</th><th class="text-right">Total</th></tr></thead>
            <tbody>
              @for (d of daily(); track d.date) {
                <tr class="cursor-pointer transition hover:bg-on-surface/[0.04]" (click)="openDay(d.date)">
                  <td class="font-semibold">{{ weekday(d.date) }}, {{ d.date }}</td>
                  <td class="text-right">{{ d.bills }}</td>
                  <td class="text-right">{{ money(d.discount) }}</td>
                  <td class="text-right">{{ money(d.tax) }}</td>
                  <td class="text-right font-bold">{{ money(d.total) }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <app-empty-state icon="query_stats" title="Nothing to show" message="Pick a customer and branch with sales in this period." />
        }
      } @else {
        @if (itemSales().length) {
          <div class="py-2 md:hidden">
            @for (i of itemSales(); track i.plu + i.name) {
              <div class="row-item">
                <span class="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-surface-highest px-2 font-mono text-sm font-bold">{{ i.plu }}</span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate font-semibold">{{ i.name }}</span>
                  <span class="block text-xs text-on-surface-variant">{{ qty(i.quantity, i.unit) }}</span>
                </span>
                <span class="font-extrabold">{{ money(i.amount) }}</span>
              </div>
            }
          </div>
          <table class="data-table hidden md:table">
            <thead><tr><th>PLU</th><th>Item</th><th class="text-right">Quantity</th><th class="text-right">Amount</th></tr></thead>
            <tbody>
              @for (i of itemSales(); track i.plu + i.name) {
                <tr>
                  <td class="font-mono">{{ i.plu }}</td>
                  <td class="font-semibold">{{ i.name }}</td>
                  <td class="text-right">{{ qty(i.quantity, i.unit) }}</td>
                  <td class="text-right font-bold">{{ money(i.amount) }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <app-empty-state icon="nutrition" title="No item sales" message="No bills in this period." />
        }
      }
    </section>

    @if (dayBills(); as bills) {
      <app-modal [title]="'Bills on ' + openDate" icon="receipt_long" [subtitle]="bills.length + ' bills'" [width]="720" (close)="dayBills.set(null)">
        <div class="flex flex-col gap-3">
          @for (b of bills; track b.id) {
            <div class="overflow-hidden rounded-2xl bg-surface-lowest">
              <div class="flex items-center justify-between gap-3 px-4 py-3">
                <div class="min-w-0">
                  <div class="font-bold">Bill {{ b.billNo }}</div>
                  <div class="text-xs text-on-surface-variant">{{ time(b.billedAt) }} · {{ b.scale?.name || 'Scale' }}</div>
                </div>
                <span class="text-lg font-extrabold">{{ money(b.total) }}</span>
              </div>
              @for (l of b.lines; track l.id) {
                <div class="flex items-center gap-3 border-t border-outline-variant/50 px-4 py-2 text-sm">
                  <span class="min-w-0 flex-1 truncate">{{ l.name }} <span class="text-xs text-on-surface-variant">PLU {{ l.plu }}</span></span>
                  <span class="text-on-surface-variant">{{ qty(l.quantity, l.unit) }} × {{ money(l.price) }}</span>
                  <span class="w-20 text-right font-semibold">{{ money(l.amount) }}</span>
                </div>
              }
              @if (b.discount) {
                <div class="flex justify-between border-t border-outline-variant/50 px-4 py-2 text-sm text-on-surface-variant">
                  <span>Discount</span><span>−{{ money(b.discount) }}</span>
                </div>
              }
            </div>
          } @empty {
            <p class="text-sm text-on-surface-variant">No bills on this day.</p>
          }
        </div>
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
  rangeDays = signal<number | null>(7);
  ranges = [
    { days: 1, label: 'Today' },
    { days: 7, label: 'Last 7 days' },
    { days: 30, label: 'Last 30 days' },
    { days: 90, label: 'Last 3 months' },
  ];
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

  setRange(days: number) {
    this.rangeDays.set(days);
    this.to = isoDay();
    this.from = addDays(this.to, -(days - 1));
    this.load();
  }

  weekday(day: string) {
    return new Date(day + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' });
  }

  month(day: string) {
    return new Date(day + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' });
  }

  async load() {
    const span = Math.round((new Date(this.to).getTime() - new Date(this.from).getTime()) / 86_400_000) + 1;
    this.rangeDays.set(this.to === isoDay() && this.ranges.some((r) => r.days === span) ? span : null);
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
