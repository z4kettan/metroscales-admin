import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { ToastService } from '../core/toast.service';
import { Customer, CustomerDetail, Scale } from '../core/models';
import { formatMac } from '../core/format';
import { ModalComponent } from './modal.component';

/// Register a scale by its MAC address, or edit one. Used on the Scales page
/// and on a customer's Scales tab (where the customer is preset).
@Component({
  selector: 'app-scale-dialog',
  imports: [FormsModule, ModalComponent],
  template: `
    <app-modal [title]="scale() ? 'Edit scale' : 'Register a scale'" icon="scale" (close)="close.emit()"
               [subtitle]="scale() ? null : 'Type the MAC address shown in the scale\\'s network settings.'">
      <form class="grid grid-cols-1 gap-4 sm:grid-cols-2" (ngSubmit)="save()" autocomplete="off">
        <div class="sm:col-span-2">
          <label class="field-label" for="mac">MAC address</label>
          <div class="relative">
            <input id="mac" class="input pr-12 font-mono !text-[17px] tracking-wider" name="mac" [ngModel]="mac()" (ngModelChange)="onMac($event)"
                   placeholder="00:23:F0:1A:97:40" autocapitalize="characters" spellcheck="false" inputmode="text" required />
            @if (macValid()) {
              <span class="material-symbols-rounded icon-fill absolute right-4 top-1/2 -translate-y-1/2 text-success">check_circle</span>
            }
          </div>
          <span class="field-hint">{{ macValid() ? 'Looks good' : '12 characters, 0–9 and A–F. Colons are added for you.' }}</span>
        </div>
        <div>
          <label class="field-label" for="sname">Scale name</label>
          <input id="sname" class="input" name="name" [(ngModel)]="form.name" placeholder="e.g. Counter 1" required />
        </div>
        <div>
          <label class="field-label" for="snum">Scale number</label>
          <input id="snum" class="input" type="number" min="1" max="99" name="number" [(ngModel)]="form.number" placeholder="Next free number" />
        </div>
        <div class="sm:col-span-2">
          <label class="field-label" for="smodel">Model</label>
          <input id="smodel" class="input" name="model" [(ngModel)]="form.model" placeholder="MRTT-PR/Y202" />
        </div>
        @if (!lockCustomer()) {
          <div>
            <label class="field-label" for="scust">Customer</label>
            <select id="scust" class="select" name="customer" [(ngModel)]="form.customerId" (ngModelChange)="loadBranches()">
              <option value="">In stock (not assigned)</option>
              @for (c of customers(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
            </select>
          </div>
        }
        <div [class.sm:col-span-2]="lockCustomer()">
          <label class="field-label" for="sbranch">Branch</label>
          <select id="sbranch" class="select" name="branch" [(ngModel)]="form.branchId" [disabled]="!form.customerId">
            @if (!form.customerId) { <option value="">Pick a customer first</option> }
            @for (b of branches(); track b.id) { <option [value]="b.id">{{ b.name }}</option> }
          </select>
        </div>
        <div class="mt-2 flex justify-end gap-2 sm:col-span-2">
          @if (scale() && removable()) {
            <button type="button" class="btn-danger-text mr-auto" (click)="remove.emit(scale()!)"><span class="material-symbols-rounded">delete</span>Delete</button>
          }
          <button type="button" class="btn-text" (click)="close.emit()">Cancel</button>
          <button class="btn-filled" [disabled]="busy() || !macValid() || !form.name">
            <span class="material-symbols-rounded">{{ scale() ? 'save' : 'add_link' }}</span>{{ scale() ? 'Save' : 'Register scale' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class ScaleDialogComponent implements OnInit {
  scale = input<Scale | null>(null);
  customerId = input<string | null>(null);
  lockCustomer = input(false);
  /// Shows a Delete button when editing
  removable = input(false);
  close = output<void>();
  saved = output<Scale>();
  remove = output<Scale>();

  private api = inject(ApiService);
  private toast = inject(ToastService);
  customers = signal<Customer[]>([]);
  branches = signal<{ id: string; name: string }[]>([]);
  busy = signal(false);
  mac = signal('');
  macValid = computed(() => this.mac().replace(/:/g, '').length === 12);
  form = { name: '', model: '', customerId: '', branchId: '', number: null as number | null };

  async ngOnInit() {
    const s = this.scale();
    if (s) {
      this.mac.set(formatMac(s.mac));
      this.form = { name: s.name, model: s.model ?? '', customerId: s.customerId ?? '', branchId: s.branchId ?? '', number: s.number };
    } else {
      this.form.customerId = this.customerId() ?? '';
    }
    try {
      if (!this.lockCustomer()) this.customers.set(await this.api.get<Customer[]>('/admin/customers'));
      await this.loadBranches(true);
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  onMac(v: string) {
    const hex = v.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 12);
    this.mac.set(hex.match(/.{1,2}/g)?.join(':') ?? '');
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
    const body: any = { mac: this.mac(), name: f.name.trim(), model: f.model || undefined, number: f.number || undefined };
    this.busy.set(true);
    try {
      const s = this.scale();
      const saved = s
        ? await this.api.patch<Scale>(`/admin/scales/${s.id}`, { ...body, branchId: f.branchId || null })
        : await this.api.post<Scale>('/admin/scales', { ...body, branchId: f.branchId || undefined });
      this.toast.success(s ? 'Scale saved' : `Scale ${formatMac(saved.mac)} registered`);
      this.saved.emit(saved);
    } catch (e: any) {
      this.toast.error(e.message);
    } finally {
      this.busy.set(false);
    }
  }
}
