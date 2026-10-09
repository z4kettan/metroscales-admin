import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Customer, CustomerDetail } from '../../core/models';
import { cleanUsername, generatePassword, PASSWORD_MIN, suggestUsername, USERNAME_RE } from '../../core/credentials';
import { ModalComponent } from '../../shared/modal.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { FabComponent } from '../../shared/fab.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { CredentialsDialogComponent } from '../../shared/credentials-dialog.component';

@Component({
  selector: 'app-customers',
  imports: [FormsModule, RouterLink, ModalComponent, PageHeaderComponent, FabComponent, EmptyStateComponent, CredentialsDialogComponent],
  template: `
    <app-page-header title="Customers" subtitle="Shops that use your scales">
      <button class="btn-filled" (click)="openCreate()"><span class="material-symbols-rounded">add</span>New customer</button>
    </app-page-header>

    <div class="relative mb-4 max-w-md">
      <span class="material-symbols-rounded pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
      <input class="search" placeholder="Search name, phone or email" [(ngModel)]="search" (ngModelChange)="load()" />
    </div>

    <div class="card overflow-hidden">
      @if (customers().length) {
        <!-- Phones: list -->
        <div class="py-2 md:hidden">
          @for (c of customers(); track c.id) {
            <a class="row-item" [routerLink]="['/customers', c.id]">
              <span class="avatar">{{ c.name[0] }}</span>
              <span class="min-w-0 flex-1">
                <span class="block truncate font-bold">{{ c.name }}</span>
                <span class="block truncate text-sm text-on-surface-variant">
                  {{ c._count?.branches }} {{ c._count?.branches === 1 ? 'branch' : 'branches' }} · {{ c.onlineScaleCount }}/{{ c.scaleCount }} scales online
                </span>
              </span>
              @if (!c.isActive) { <span class="pill-neutral">Disabled</span> }
              <span class="material-symbols-rounded text-on-surface-variant">chevron_right</span>
            </a>
          }
        </div>
        <!-- Tablets and desktops: table -->
        <table class="data-table hidden md:table">
          <thead>
            <tr><th>Customer</th><th>Contact</th><th>Branches</th><th>Scales online</th><th>Subscription</th><th>Status</th></tr>
          </thead>
          <tbody>
            @for (c of customers(); track c.id) {
              <tr class="cursor-pointer transition hover:bg-on-surface/[0.04]" [routerLink]="['/customers', c.id]">
                <td>
                  <div class="flex items-center gap-3"><span class="avatar !h-9 !w-9">{{ c.name[0] }}</span><span class="font-bold">{{ c.name }}</span></div>
                </td>
                <td class="text-on-surface-variant">{{ c.contactName || '—' }}<div class="text-xs">{{ c.phone }}</div></td>
                <td>{{ c._count?.branches }}</td>
                <td>
                  <span [class]="c.onlineScaleCount ? 'pill-success' : 'pill-neutral'">{{ c.onlineScaleCount }} / {{ c.scaleCount }}</span>
                </td>
                <td class="text-on-surface-variant">{{ c.subscriptionEndsAt ? c.subscriptionEndsAt.slice(0, 10) : '—' }}</td>
                <td><span [class]="c.isActive ? 'pill-success' : 'pill-neutral'">{{ c.isActive ? 'Active' : 'Disabled' }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      } @else if (loading()) {
        <div class="p-10 text-center text-sm text-on-surface-variant">Loading…</div>
      } @else {
        <app-empty-state icon="storefront" [title]="search ? 'No matches' : 'No customers yet'"
                         [message]="search ? 'Try another name or phone number.' : 'Add a shop to give it a login and register its scales.'">
          @if (!search) { <button class="btn-filled" (click)="openCreate()"><span class="material-symbols-rounded">add</span>New customer</button> }
        </app-empty-state>
      }
    </div>

    <app-fab label="New customer" (pressed)="openCreate()" />

    @if (creating()) {
      <app-modal title="New customer" icon="add_business" [width]="640" (close)="creating.set(false)">
        <form class="grid grid-cols-1 gap-4 sm:grid-cols-2" (ngSubmit)="create()" autocomplete="off">
          <div class="sm:col-span-2">
            <label class="field-label" for="cname">Shop name</label>
            <input id="cname" class="input" name="name" [(ngModel)]="form.name" (ngModelChange)="onShopName()" required placeholder="e.g. Metro Vegetables" />
          </div>
          <div><label class="field-label" for="ccontact">Contact person</label><input id="ccontact" class="input" name="contactName" [(ngModel)]="form.contactName" (ngModelChange)="onContact()" /></div>
          <div><label class="field-label" for="cphone">Phone</label><input id="cphone" class="input" type="tel" name="phone" [(ngModel)]="form.phone" /></div>
          <div class="sm:col-span-2"><label class="field-label" for="caddr">Address</label><input id="caddr" class="input" name="address" [(ngModel)]="form.address" /></div>
          <div><label class="field-label" for="cbranch">First branch</label><input id="cbranch" class="input" name="branchName" [(ngModel)]="form.branchName" placeholder="Same as shop name" /></div>
          <div><label class="field-label" for="csub">Subscription ends</label><input id="csub" class="input" type="date" name="sub" [(ngModel)]="form.subscriptionEndsAt" /></div>

          <div class="mt-2 flex items-center gap-3 sm:col-span-2">
            <span class="icon-box !h-9 !w-9 !rounded-xl !bg-tertiary-container !text-on-tertiary-container"><span class="material-symbols-rounded !text-xl">key</span></span>
            <div><div class="font-bold">Owner login</div><div class="text-xs text-on-surface-variant">The shop owner signs in to the app with this</div></div>
          </div>
          <div class="sm:col-span-2"><label class="field-label" for="oname">Owner name</label><input id="oname" class="input" name="ownerName" [(ngModel)]="form.ownerName" required /></div>
          <div>
            <label class="field-label" for="ouser">Username</label>
            <input id="ouser" class="input font-mono" name="username" [ngModel]="form.username" (ngModelChange)="form.username = clean($event); userTouched = true"
                   autocapitalize="none" spellcheck="false" required />
            <span class="field-hint">Letters, digits, dot, dash or underscore</span>
          </div>
          <div>
            <label class="field-label" for="opass">Password</label>
            <div class="relative">
              <input id="opass" class="input pr-12 font-mono" name="password" [(ngModel)]="form.password" autocapitalize="none" spellcheck="false" required />
              <button type="button" class="icon-btn absolute right-2 top-1/2 -translate-y-1/2" (click)="form.password = generatePassword()" title="New random password">
                <span class="material-symbols-rounded">casino</span>
              </button>
            </div>
            <span class="field-hint">At least {{ PASSWORD_MIN }} characters</span>
          </div>
          <div class="mt-2 flex justify-end gap-2 sm:col-span-2">
            <button type="button" class="btn-text" (click)="creating.set(false)">Cancel</button>
            <button class="btn-filled" [disabled]="busy()">{{ busy() ? 'Creating…' : 'Create customer' }}</button>
          </div>
        </form>
      </app-modal>
    }

    @if (created(); as c) {
      <app-credentials-dialog title="Customer created" [name]="c.name" [username]="c.username" [password]="c.password"
                              (close)="router.navigate(['/customers', c.id])" />
    }
  `,
})
export class CustomersPage implements OnInit {
  /// ?new=1 opens the form straight away (from the dashboard)
  new = input<string>();
  private api = inject(ApiService);
  private toast = inject(ToastService);
  router = inject(Router);
  customers = signal<Customer[]>([]);
  loading = signal(true);
  creating = signal(false);
  busy = signal(false);
  created = signal<{ id: string; name: string; username: string; password: string } | null>(null);
  search = '';
  form = this.emptyForm();
  userTouched = false;
  clean = cleanUsername;
  generatePassword = generatePassword;
  PASSWORD_MIN = PASSWORD_MIN;

  ngOnInit() {
    this.load();
    if (this.new()) this.openCreate();
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
    this.userTouched = false;
    this.creating.set(true);
  }

  onShopName() {
    if (!this.userTouched) this.form.username = suggestUsername(this.form.name);
  }

  onContact() {
    if (!this.form.ownerName || this.form.ownerName === this.lastContact) this.form.ownerName = this.form.contactName;
    this.lastContact = this.form.contactName;
  }
  private lastContact = '';

  async create() {
    const f = this.form;
    if (!f.name.trim() || !f.ownerName.trim()) return this.toast.error('Fill in the shop name and the owner name');
    if (!USERNAME_RE.test(f.username)) return this.toast.error('Username must be 3 to 30 letters, digits, dots, dashes or underscores');
    if (f.password.length < PASSWORD_MIN) return this.toast.error(`Password must be at least ${PASSWORD_MIN} characters`);
    this.busy.set(true);
    try {
      const c = await this.api.post<CustomerDetail>('/admin/customers', {
        name: f.name.trim(),
        contactName: f.contactName || undefined,
        phone: f.phone || undefined,
        address: f.address || undefined,
        branchName: f.branchName || undefined,
        subscriptionEndsAt: f.subscriptionEndsAt || undefined,
        owner: { name: f.ownerName.trim(), username: f.username, password: f.password },
      });
      this.creating.set(false);
      this.created.set({ id: c.id, name: c.name, username: c.users[0]?.username ?? f.username, password: f.password });
    } catch (e: any) {
      this.toast.error(e.message);
    } finally {
      this.busy.set(false);
    }
  }

  private emptyForm() {
    return {
      name: '', contactName: '', phone: '', address: '', branchName: '', subscriptionEndsAt: '',
      ownerName: '', username: '', password: generatePassword(),
    };
  }
}
