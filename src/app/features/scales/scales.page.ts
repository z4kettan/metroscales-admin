import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import { Scale } from '../../core/models';
import { formatMac, since } from '../../core/format';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { FabComponent } from '../../shared/fab.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { ScaleDialogComponent } from '../../shared/scale-dialog.component';

@Component({
  selector: 'app-scales',
  imports: [FormsModule, RouterLink, PageHeaderComponent, FabComponent, EmptyStateComponent, ScaleDialogComponent],
  template: `
    <app-page-header title="Scales" subtitle="Every scale you have registered, by MAC address">
      <button class="btn-filled" (click)="open()"><span class="material-symbols-rounded">add_link</span>Register scale</button>
    </app-page-header>

    <div class="relative mb-3 max-w-md">
      <span class="material-symbols-rounded pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
      <input class="search" placeholder="Search name, MAC or customer" [(ngModel)]="search" (ngModelChange)="load()" />
    </div>
    <div class="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
      @for (f of filters; track f.value) {
        <button class="chip" [class.chip-selected]="filter() === f.value" (click)="filter.set(f.value); load()">
          @if (filter() === f.value) { <span class="material-symbols-rounded !text-lg">check</span> }{{ f.label }}
        </button>
      }
    </div>

    <div class="card overflow-hidden">
      @if (scales().length) {
        <div class="py-2 md:hidden">
          @for (s of scales(); track s.id) {
            <button class="row-item" (click)="open(s)">
              <span class="icon-box" [class]="s.online ? '!bg-success-container !text-on-success-container' : '!bg-surface-highest !text-on-surface-variant'">
                <span class="material-symbols-rounded">scale</span>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate font-bold">{{ s.name }} <span class="font-semibold text-on-surface-variant">#{{ s.number }}</span></span>
                <span class="block truncate font-mono text-xs text-on-surface-variant">{{ formatMac(s.mac) }}</span>
                <span class="block truncate text-xs text-on-surface-variant">{{ s.customer ? s.customer.name + ' · ' + (s.branch?.name ?? '') : 'In stock' }}</span>
              </span>
              <span [class]="s.online ? 'pill-success' : s.customer ? 'pill-neutral' : 'pill-info'">{{ s.online ? 'Online' : s.customer ? 'Offline' : 'In stock' }}</span>
            </button>
          }
        </div>
        <table class="data-table hidden md:table">
          <thead><tr><th>Scale</th><th>MAC address</th><th>Customer / branch</th><th>Status</th><th class="text-right">Queued</th><th></th></tr></thead>
          <tbody>
            @for (s of scales(); track s.id) {
              <tr>
                <td>
                  <div class="font-bold">{{ s.name }} <span class="font-semibold text-on-surface-variant">#{{ s.number }}</span></div>
                  <div class="text-xs text-on-surface-variant">{{ s.model || '' }}</div>
                </td>
                <td class="font-mono text-[13px]">{{ formatMac(s.mac) }}</td>
                <td>
                  @if (s.customer) {
                    <a class="font-semibold text-primary hover:underline" [routerLink]="['/customers', s.customer.id]">{{ s.customer.name }}</a>
                    <div class="text-xs text-on-surface-variant">{{ s.branch?.name }}</div>
                  } @else { <span class="pill-info">In stock</span> }
                </td>
                <td>
                  <span [class]="s.online ? 'pill-success' : 'pill-neutral'">
                    <span class="h-1.5 w-1.5 rounded-full bg-current"></span>{{ s.online ? 'Online' : 'Offline' }}
                  </span>
                  <div class="mt-0.5 text-xs text-on-surface-variant">Seen {{ since(s.lastSeenAt) }}</div>
                </td>
                <td class="text-right">{{ s.pendingCommands || '–' }}</td>
                <td class="whitespace-nowrap text-right">
                  <button class="icon-btn" (click)="open(s)" title="Edit"><span class="material-symbols-rounded">edit</span></button>
                  <button class="icon-btn hover:!text-error" (click)="remove(s)" title="Delete"><span class="material-symbols-rounded">delete</span></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <app-empty-state icon="scale" [title]="search || filter() ? 'No scales found' : 'No scales yet'"
                         [message]="search || filter() ? 'Try another search or filter.' : 'Register a scale with the MAC address from its network settings.'">
          @if (!search && !filter()) { <button class="btn-filled" (click)="open()"><span class="material-symbols-rounded">add_link</span>Register scale</button> }
        </app-empty-state>
      }
    </div>

    <app-fab icon="add_link" label="Register scale" (pressed)="open()" />

    @if (dialog(); as d) {
      <app-scale-dialog [scale]="d.scale" [removable]="true" (close)="dialog.set(null)" (saved)="dialog.set(null); load()"
                        (remove)="dialog.set(null); remove($event)" />
    }
  `,
})
export class ScalesPage implements OnInit {
  /// ?status=offline|online|unassigned from the dashboard
  status = input<string>();
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  scales = signal<Scale[]>([]);
  dialog = signal<{ scale: Scale | null } | null>(null);
  filter = signal('');
  search = '';
  filters = [
    { value: '', label: 'All' },
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline' },
    { value: 'unassigned', label: 'In stock' },
  ];
  formatMac = formatMac;
  since = since;

  ngOnInit() {
    this.filter.set(this.status() ?? '');
    this.load();
  }

  async load() {
    try {
      this.scales.set(await this.api.get<Scale[]>('/admin/scales', { search: this.search, status: this.filter() }));
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  open(s?: Scale) {
    this.dialog.set({ scale: s ?? null });
  }

  async remove(s: Scale) {
    if (!(await this.confirm.ask({
      title: `Delete ${s.name}?`,
      message: `The scale ${formatMac(s.mac)} is removed from the registry. Its past sales stay in the reports.`,
      confirmLabel: 'Delete', danger: true, icon: 'delete',
    }))) return;
    try {
      await this.api.delete(`/admin/scales/${s.id}`);
      this.toast.success('Scale deleted');
      this.load();
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }
}
