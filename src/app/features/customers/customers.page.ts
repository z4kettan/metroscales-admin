import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Customer, CustomerDetail } from '../../core/models';
import { ModalComponent } from '../../shared/modal.component';

@Component({
  selector: 'app-customers',
  imports: [FormsModule, RouterLink, ModalComponent],
  template: `
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">Customers</h1>
        <p class="text-sm text-muted">Shops that use your scales</p>
      </div>
      <button class="btn-primary" (click)="openCreate()"><span class="material-symbols-outlined">add</span>New customer</button>
    </div>

    <div class="card">
      <div class="border-b border-line p-4">
        <input class="input max-w-xs" placeholder="Search name, phone or email" [(ngModel)]="search" (ngModelChange)="load()" />
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr><th>Customer</th><th>Contact</th><th>Branches</th><th>Scales online</th><th>Subscription</th><th>Status</th></tr>
          </thead>
          <tbody>
            @for (c of customers(); track c.id) {
              <tr class="cursor-pointer hover:bg-slate-50" [routerLink]="['/customers', c.id]">
                <td class="font-medium">{{ c.name }}</td>
                <td class="text-muted">{{ c.contactName || '—' }}<br /><span class="text-xs">{{ c.phone }}</span></td>
                <td>{{ c._count?.branches }}</td>
                <td>{{ c.onlineScaleCount }} / {{ c.scaleCount }}</td>
                <td class="text-muted">{{ c.subscriptionEndsAt ? c.subscriptionEndsAt.slice(0, 10) : '—' }}</td>
                <td><span [class]="c.isActive ? 'badge-green' : 'badge-gray'">{{ c.isActive ? 'Active' : 'Disabled' }}</span></td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="py-10 text-center text-muted">{{ loading() ? 'Loading…' : 'No customers yet' }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (creating()) {
      <app-modal title="New customer" (close)="creating.set(false)">
        <form class="grid grid-cols-2 gap-4" (ngSubmit)="create()">
          <div class="col-span-2"><label class="label">Shop name *</label><input class="input" name="name" [(ngModel)]="form.name" required /></div>
          <div><label class="label">Contact person</label><input class="input" name="contactName" [(ngModel)]="form.contactName" /></div>
          <div><label class="label">Phone</label><input class="input" name="phone" [(ngModel)]="form.phone" /></div>
          <div class="col-span-2"><label class="label">Address</label><input class="input" name="address" [(ngModel)]="form.address" /></div>
          <div><label class="label">First branch name</label><input class="input" name="branchName" [(ngModel)]="form.branchName" placeholder="Same as shop name" /></div>
          <div><label class="label">Subscription ends</label><input class="input" type="date" name="sub" [(ngModel)]="form.subscriptionEndsAt" /></div>
          <div class="col-span-2 mt-2 border-t border-line pt-4 text-sm font-semibold">Owner login for the app</div>
          <div><label class="label">Owner name *</label><input class="input" name="ownerName" [(ngModel)]="form.ownerName" required /></div>
          <div><label class="label">Owner email *</label><input class="input" type="email" name="ownerEmail" [(ngModel)]="form.ownerEmail" required /></div>
          <div><label class="label">PIN (4 to 8 digits) *</label><input class="input" name="pin" inputmode="numeric" [(ngModel)]="form.pin" required pattern="\\d{4,8}" /></div>
          <div class="col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" class="btn-outline" (click)="creating.set(false)">Cancel</button>
            <button class="btn-primary" [disabled]="busy()">Create customer</button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class CustomersPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  customers = signal<Customer[]>([]);
  loading = signal(true);
  creating = signal(false);
  busy = signal(false);
  search = '';
  form = this.emptyForm();

  ngOnInit() {
    this.load();
  }

  async load() {
    try {
      this.customers.set(await this.api.get<Customer[]>('/admin/customers', { search: this.search }));
    } catch (e: any) {
      this.toast.error(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  openCreate() {
    this.form = this.emptyForm();
    this.creating.set(true);
  }

  async create() {
    const f = this.form;
    if (!f.name || !f.ownerName || !f.ownerEmail || !/^\d{4,8}$/.test(f.pin)) {
      this.toast.error('Fill in the shop name, owner name, owner email and a 4 to 8 digit PIN');
      return;
    }
    this.busy.set(true);
    try {
      const created = await this.api.post<CustomerDetail>('/admin/customers', {
        name: f.name,
        contactName: f.contactName || undefined,
        phone: f.phone || undefined,
        address: f.address || undefined,
        branchName: f.branchName || undefined,
        subscriptionEndsAt: f.subscriptionEndsAt || undefined,
        owner: { name: f.ownerName, email: f.ownerEmail, pin: f.pin },
      });
      this.toast.success(`${created.name} created. The owner can now log in to the app.`);
      this.router.navigate(['/customers', created.id]);
    } catch (e: any) {
      this.toast.error(e.message);
    } finally {
      this.busy.set(false);
    }
  }

  private emptyForm() {
    return { name: '', contactName: '', phone: '', address: '', branchName: '', subscriptionEndsAt: '', ownerName: '', ownerEmail: '', pin: '' };
  }
}
