import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Customer, CustomerDetail, Scale } from '../../core/models';
import { formatMac, since } from '../../core/format';
import { ModalComponent } from '../../shared/modal.component';

@Component({
  selector: 'app-scales',
  imports: [FormsModule, RouterLink, ModalComponent],
  template: `
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">Scales</h1>
        <p class="text-sm text-muted">Every scale you have registered, by MAC address</p>
      </div>
      <button class="btn-primary" (click)="open()"><span class="material-symbols-outlined">add</span>Register scale</button>
    </div>

    <div class="card">
      <div class="flex flex-wrap gap-3 border-b border-line p-4">
        <input class="input max-w-xs" placeholder="Search name, MAC or customer" [(ngModel)]="search" (ngModelChange)="load()" />
        <select class="input max-w-[180px]" [(ngModel)]="status" (ngModelChange)="load()">
          <option value="">All scales</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="unassigned">Not assigned</option>
        </select>
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead><tr><th>Scale</th><th>MAC address</th><th>Customer / branch</th><th>Status</th><th>Pending</th><th></th></tr></thead>
          <tbody>
            @for (s of scales(); track s.id) {
              <tr>
                <td>
                  <div class="font-medium">{{ s.name }} <span class="text-muted">({{ s.number }})</span></div>
                  <div class="text-xs text-muted">{{ s.model || '' }}</div>
                </td>
                <td class="font-mono text-xs">{{ formatMac(s.mac) }}</td>
                <td>
                  @if (s.customer) {
                    <a class="text-brand hover:underline" [routerLink]="['/customers', s.customer.id]">{{ s.customer.name }}</a>
                    <div class="text-xs text-muted">{{ s.branch?.name }}</div>
                  } @else { <span class="badge-amber">Not assigned</span> }
                </td>
                <td>
                  <span [class]="s.online ? 'badge-green' : 'badge-gray'">● {{ s.online ? 'Online' : 'Offline' }}</span>
                  <div class="text-xs text-muted">Seen {{ since(s.lastSeenAt) }}</div>
                </td>
                <td>{{ s.pendingCommands }}</td>
                <td class="whitespace-nowrap text-right">
                  <button class="btn-ghost" (click)="open(s)" title="Edit"><span class="material-symbols-outlined">edit</span></button>
                  <button class="btn-danger" (click)="remove(s)" title="Delete"><span class="material-symbols-outlined">delete</span></button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="py-10 text-center text-muted">No scales found</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (editing()) {
      <app-modal [title]="form.id ? 'Edit scale' : 'Register scale'" (close)="editing.set(false)">
        <form class="grid grid-cols-2 gap-4" (ngSubmit)="save()">
          <div class="col-span-2">
            <label class="label">MAC address *</label>
            <input class="input font-mono" name="mac" [(ngModel)]="form.mac" placeholder="00:23:F0:1A:97:40" required />
            <p class="mt-1 text-xs text-muted">Shown in the scale's network settings. Any format works.</p>
          </div>
          <div><label class="label">Name *</label><input class="input" name="name" [(ngModel)]="form.name" placeholder="Y201" required /></div>
          <div><label class="label">Model</label><input class="input" name="model" [(ngModel)]="form.model" placeholder="MRTT-PR/Y202" /></div>
          <div>
            <label class="label">Customer</label>
            <select class="input" name="customer" [(ngModel)]="form.customerId" (ngModelChange)="loadBranches()">
              <option value="">Not assigned (in stock)</option>
              @for (c of customers(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
            </select>
          </div>
          <div>
            <label class="label">Branch</label>
            <select class="input" name="branch" [(ngModel)]="form.branchId" [disabled]="!form.customerId">
              @for (b of branches(); track b.id) { <option [value]="b.id">{{ b.name }}</option> }
            </select>
          </div>
          <div><label class="label">Scale number</label><input class="input" type="number" min="1" name="number" [(ngModel)]="form.number" placeholder="Auto" /></div>
          <div class="col-span-2 flex justify-end gap-2">
            <button type="button" class="btn-outline" (click)="editing.set(false)">Cancel</button>
            <button class="btn-primary">{{ form.id ? 'Save' : 'Register' }}</button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class ScalesPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  scales = signal<Scale[]>([]);
  customers = signal<Customer[]>([]);
  branches = signal<{ id: string; name: string }[]>([]);
  editing = signal(false);
  search = '';
  status = '';
  form = { id: '', mac: '', name: '', model: '', customerId: '', branchId: '', number: null as number | null };
  formatMac = formatMac;
  since = since;

  ngOnInit() {
    this.load();
  }

  async load() {
    try {
      this.scales.set(await this.api.get<Scale[]>('/admin/scales', { search: this.search, status: this.status }));
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  async open(s?: Scale) {
    this.form = s
      ? { id: s.id, mac: formatMac(s.mac), name: s.name, model: s.model ?? '', customerId: s.customerId ?? '', branchId: s.branchId ?? '', number: s.number }
      : { id: '', mac: '', name: '', model: '', customerId: '', branchId: '', number: null };
    this.customers.set(await this.api.get<Customer[]>('/admin/customers'));
    await this.loadBranches(true);
    this.editing.set(true);
  }

  async loadBranches(keep = false) {
    if (!this.form.customerId) {
      this.branches.set([]);
      this.form.branchId = '';
      return;
    }
    const c = await this.api.get<CustomerDetail>(`/admin/customers/${this.form.customerId}`);
    this.branches.set(c.branches);
    if (!keep || !c.branches.some((b) => b.id === this.form.branchId)) this.form.branchId = c.branches[0]?.id ?? '';
  }

  async save() {
    const f = this.form;
    const body: any = { mac: f.mac, name: f.name, model: f.model || undefined, number: f.number || undefined };
    try {
      if (f.id) await this.api.patch(`/admin/scales/${f.id}`, { ...body, branchId: f.branchId || null });
      else await this.api.post('/admin/scales', { ...body, branchId: f.branchId || undefined });
      this.editing.set(false);
      this.toast.success('Scale saved');
      this.load();
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  async remove(s: Scale) {
    if (!confirm(`Delete scale ${s.name} (${formatMac(s.mac)})? Its sales stay in the reports.`)) return;
    try {
      await this.api.delete(`/admin/scales/${s.id}`);
      this.toast.success('Scale deleted');
      this.load();
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }
}
