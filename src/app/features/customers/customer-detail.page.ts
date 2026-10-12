import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Branch, CustomerDetail, Item, User } from '../../core/models';
import { formatMac, money, qty, since } from '../../core/format';
import { ModalComponent } from '../../shared/modal.component';

type Tab = 'branches' | 'users' | 'scales' | 'items';

@Component({
  selector: 'app-customer-detail',
  imports: [FormsModule, RouterLink, ModalComponent],
  template: `
    <a routerLink="/customers" class="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
      <span class="material-symbols-outlined !text-base">arrow_back</span>Customers
    </a>

    @if (c(); as c) {
      <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-semibold">{{ c.name }}</h1>
            <span [class]="c.isActive ? 'badge-green' : 'badge-gray'">{{ c.isActive ? 'Active' : 'Disabled' }}</span>
          </div>
          <p class="text-sm text-muted">
            {{ c.contactName || 'No contact' }} · {{ c.phone || 'No phone' }} · {{ c.address || 'No address' }}
          </p>
          <p class="text-sm text-muted">
            Subscription: {{ c.subscriptionEndsAt ? 'ends ' + c.subscriptionEndsAt.slice(0, 10) : 'not set' }}
          </p>
        </div>
        <div class="flex gap-2">
          <a class="btn-outline" routerLink="/sales" [queryParams]="{ customerId: c.id }">
            <span class="material-symbols-outlined">receipt_long</span>Sales
          </a>
          <button class="btn-outline" (click)="openEdit()"><span class="material-symbols-outlined">edit</span>Edit</button>
          <button [class]="c.isActive ? 'btn-danger' : 'btn-primary'" (click)="toggleActive()">
            {{ c.isActive ? 'Disable' : 'Enable' }}
          </button>
        </div>
      </div>

      <div class="mb-4 flex gap-2 overflow-x-auto border-b border-line">
        @for (t of tabs; track t.key) {
          <button class="tab shrink-0 whitespace-nowrap" [class.tab-active]="tab() === t.key" (click)="setTab(t.key)">{{ t.label }}</button>
        }
      </div>

      @switch (tab()) {
        @case ('branches') {
          <div class="card">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
              <span class="text-sm text-muted">Prices and stock are kept per branch</span>
              <button class="btn-primary" (click)="branchForm = { id: '', name: '', address: '', phone: '' }; editingBranch.set(true)">
                <span class="material-symbols-outlined">add</span>Add branch
              </button>
            </div>
            <div class="divide-y divide-line md:hidden">
              @for (b of c.branches; track b.id) {
                <div class="flex items-center justify-between gap-3 px-4 py-3">
                  <div class="min-w-0">
                    <div class="font-medium">{{ b.name }}</div>
                    <div class="text-xs text-muted">{{ b.address || 'No address' }} · {{ b.phone || 'No phone' }}</div>
                  </div>
                  <button class="btn-ghost shrink-0" (click)="editBranch(b)" aria-label="Edit branch"><span class="material-symbols-outlined">edit</span></button>
                </div>
              }
            </div>
            <div class="hidden md:block">
              <table class="table">
                <thead><tr><th>Branch</th><th>Address</th><th>Phone</th><th></th></tr></thead>
                <tbody>
                  @for (b of c.branches; track b.id) {
                    <tr>
                      <td class="font-medium">{{ b.name }}</td>
                      <td class="text-muted">{{ b.address || '—' }}</td>
                      <td class="text-muted">{{ b.phone || '—' }}</td>
                      <td class="text-right">
                        <button class="btn-ghost" (click)="editBranch(b)"><span class="material-symbols-outlined">edit</span></button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
        @case ('users') {
          <div class="card">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
              <span class="text-sm text-muted">These people log in to the mobile app with email and PIN</span>
              <button class="btn-primary" (click)="openUser()"><span class="material-symbols-outlined">person_add</span>Add user</button>
            </div>
            <div class="divide-y divide-line md:hidden">
              @for (u of users(); track u.id) {
                <div class="flex items-center justify-between gap-3 px-4 py-3">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="truncate font-medium">{{ u.name }}</span>
                      <span [class]="u.isActive ? 'badge-green' : 'badge-gray'">{{ u.isActive ? 'Active' : 'Disabled' }}</span>
                    </div>
                    <div class="truncate text-xs text-muted">{{ u.email }}</div>
                    <div class="text-xs text-muted">
                      {{ u.role === 'OWNER' ? 'Owner' : 'Staff' }}{{ u.role === 'STAFF' && u.branches?.length ? ' · ' + branchNames(u) : '' }}
                    </div>
                  </div>
                  <button class="btn-ghost shrink-0" (click)="openUser(u)" aria-label="Edit user"><span class="material-symbols-outlined">edit</span></button>
                </div>
              }
            </div>
            <div class="hidden md:block">
            <table class="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
              <tbody>
                @for (u of users(); track u.id) {
                  <tr>
                    <td class="font-medium">{{ u.name }}</td>
                    <td class="text-muted">{{ u.email }}</td>
                    <td>
                      {{ u.role === 'OWNER' ? 'Owner' : 'Staff' }}
                      @if (u.role === 'STAFF' && u.branches?.length) {
                        <div class="text-xs text-muted">{{ branchNames(u) }}</div>
                      }
                    </td>
                    <td><span [class]="u.isActive ? 'badge-green' : 'badge-gray'">{{ u.isActive ? 'Active' : 'Disabled' }}</span></td>
                    <td class="text-right">
                      <button class="btn-ghost" (click)="openUser(u)"><span class="material-symbols-outlined">edit</span></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            </div>
          </div>
        }
        @case ('scales') {
          <div class="card">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
              <span class="text-sm text-muted">Register new scales on the Scales page</span>
              <a class="btn-outline" routerLink="/scales"><span class="material-symbols-outlined">scale</span>Scales</a>
            </div>
            <div class="divide-y divide-line md:hidden">
              @for (s of c.scales; track s.id) {
                <div class="flex items-start justify-between gap-3 px-4 py-3">
                  <div class="min-w-0">
                    <div class="font-medium">{{ s.name }} ({{ s.number }})</div>
                    <div class="font-mono text-xs text-muted">{{ formatMac(s.mac) }}</div>
                    <div class="text-xs text-muted">{{ s.branch?.name || 'No branch' }} · Seen {{ since(s.lastSeenAt) }} · {{ s.pendingCommands }} pending</div>
                  </div>
                  <span class="shrink-0" [class]="s.online ? 'badge-green' : 'badge-gray'">● {{ s.online ? 'Online' : 'Offline' }}</span>
                </div>
              } @empty {
                <p class="py-8 text-center text-sm text-muted">No scales assigned</p>
              }
            </div>
            <div class="hidden md:block">
            <table class="table">
              <thead><tr><th>Scale</th><th>MAC</th><th>Branch</th><th>Status</th><th>Pending</th></tr></thead>
              <tbody>
                @for (s of c.scales; track s.id) {
                  <tr>
                    <td class="font-medium">{{ s.name }} ({{ s.number }})</td>
                    <td class="font-mono text-xs">{{ formatMac(s.mac) }}</td>
                    <td>{{ s.branch?.name || '—' }}</td>
                    <td>
                      <span [class]="s.online ? 'badge-green' : 'badge-gray'">● {{ s.online ? 'Online' : 'Offline' }}</span>
                      <div class="text-xs text-muted">Seen {{ since(s.lastSeenAt) }}</div>
                    </td>
                    <td>{{ s.pendingCommands }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="py-8 text-center text-muted">No scales assigned</td></tr>
                }
              </tbody>
            </table>
            </div>
          </div>
        }
        @case ('items') {
          <div class="card">
            <div class="flex flex-wrap items-center gap-3 border-b border-line p-4">
              <select class="input max-w-xs" [(ngModel)]="itemBranch" (ngModelChange)="loadItems()">
                @for (b of c.branches; track b.id) { <option [value]="b.id">{{ b.name }}</option> }
              </select>
              <input class="input max-w-xs" placeholder="Search name or PLU" [(ngModel)]="itemSearch" (ngModelChange)="loadItems()" />
              <span class="text-sm text-muted">{{ items().length }} items · shop owners edit these in the app</span>
            </div>
            <div class="divide-y divide-line md:hidden">
              @for (i of items(); track i.id) {
                <div class="flex items-center justify-between gap-3 px-4 py-3">
                  <div class="min-w-0">
                    <div class="truncate font-medium">{{ i.name }}</div>
                    <div class="text-xs text-muted">
                      PLU {{ i.plu }} · {{ i.category?.name || 'No category' }} · GST {{ i.gstPercent }}% {{ i.gstMode === 'INCLUDED' ? 'incl.' : 'extra' }}
                    </div>
                  </div>
                  <div class="shrink-0 text-right">
                    <div class="font-medium">{{ money(i.price) }} / {{ i.unit === 'KG' ? 'kg' : 'pack' }}</div>
                    <div class="text-xs" [class.text-red-600]="(i.stock ?? 0) < 0" [class.text-muted]="(i.stock ?? 0) >= 0">
                      Stock {{ qty(i.stock, i.unit) }}
                    </div>
                  </div>
                </div>
              } @empty {
                <p class="py-8 text-center text-sm text-muted">No items</p>
              }
            </div>
            <div class="hidden overflow-x-auto md:block">
              <table class="table">
                <thead><tr><th>PLU</th><th>Item</th><th>Category</th><th class="text-right">Price</th><th class="text-right">Stock</th><th>GST</th></tr></thead>
                <tbody>
                  @for (i of items(); track i.id) {
                    <tr>
                      <td class="font-mono">{{ i.plu }}</td>
                      <td class="font-medium">{{ i.name }}</td>
                      <td class="text-muted">{{ i.category?.name || '—' }}</td>
                      <td class="text-right">{{ money(i.price) }} / {{ i.unit === 'KG' ? 'kg' : 'pack' }}</td>
                      <td class="text-right" [class.text-red-600]="(i.stock ?? 0) < 0">{{ qty(i.stock, i.unit) }}</td>
                      <td class="text-muted">{{ i.gstPercent }}% {{ i.gstMode === 'INCLUDED' ? 'incl.' : 'extra' }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="6" class="py-8 text-center text-muted">No items</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }

      @if (editing()) {
        <app-modal title="Edit customer" (close)="editing.set(false)">
          <form class="grid grid-cols-2 gap-4" (ngSubmit)="saveCustomer()">
            <div class="col-span-2"><label class="label">Shop name</label><input class="input" name="name" [(ngModel)]="editForm.name" required /></div>
            <div><label class="label">Contact person</label><input class="input" name="contactName" [(ngModel)]="editForm.contactName" /></div>
            <div><label class="label">Phone</label><input class="input" name="phone" [(ngModel)]="editForm.phone" /></div>
            <div><label class="label">Email</label><input class="input" type="email" name="email" [(ngModel)]="editForm.email" /></div>
            <div><label class="label">Subscription ends</label><input class="input" type="date" name="sub" [(ngModel)]="editForm.subscriptionEndsAt" /></div>
            <div class="col-span-2"><label class="label">Address</label><input class="input" name="address" [(ngModel)]="editForm.address" /></div>
            <div class="col-span-2"><label class="label">Notes</label><textarea class="input" rows="3" name="notes" [(ngModel)]="editForm.notes"></textarea></div>
            <div class="col-span-2 flex justify-end gap-2">
              <button type="button" class="btn-outline" (click)="editing.set(false)">Cancel</button>
              <button class="btn-primary">Save</button>
            </div>
          </form>
        </app-modal>
      }

      @if (editingBranch()) {
        <app-modal [title]="branchForm.id ? 'Edit branch' : 'Add branch'" (close)="editingBranch.set(false)">
          <form class="flex flex-col gap-4" (ngSubmit)="saveBranch()">
            <div><label class="label">Branch name</label><input class="input" name="name" [(ngModel)]="branchForm.name" required /></div>
            <div><label class="label">Address</label><input class="input" name="address" [(ngModel)]="branchForm.address" /></div>
            <div><label class="label">Phone</label><input class="input" name="phone" [(ngModel)]="branchForm.phone" /></div>
            <div class="flex justify-end gap-2">
              <button type="button" class="btn-outline" (click)="editingBranch.set(false)">Cancel</button>
              <button class="btn-primary">Save</button>
            </div>
          </form>
        </app-modal>
      }

      @if (editingUser()) {
        <app-modal [title]="userForm.id ? 'Edit user' : 'Add user'" (close)="editingUser.set(false)">
          <form class="flex flex-col gap-4" (ngSubmit)="saveUser()">
            <div><label class="label">Name</label><input class="input" name="name" [(ngModel)]="userForm.name" required /></div>
            <div><label class="label">Email</label><input class="input" type="email" name="email" [(ngModel)]="userForm.email" required /></div>
            <div>
              <label class="label">{{ userForm.id ? 'New PIN (leave empty to keep)' : 'PIN (4 to 8 digits)' }}</label>
              <input class="input" name="pin" inputmode="numeric" [(ngModel)]="userForm.pin" />
            </div>
            <div>
              <label class="label">Role</label>
              <select class="input" name="role" [(ngModel)]="userForm.role">
                <option value="OWNER">Owner: everything in this shop</option>
                <option value="STAFF">Staff: selected branches, no price changes</option>
              </select>
            </div>
            @if (userForm.role === 'STAFF') {
              <div>
                <label class="label">Branches</label>
                @for (b of c.branches; track b.id) {
                  <label class="flex items-center gap-2 py-1 text-sm">
                    <input type="checkbox" [checked]="userForm.branchIds.includes(b.id)" (change)="toggleBranch(b.id)" />{{ b.name }}
                  </label>
                }
              </div>
            }
            @if (userForm.id) {
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" [(ngModel)]="userForm.isActive" />Can log in
              </label>
            }
            <div class="flex justify-end gap-2">
              <button type="button" class="btn-outline" (click)="editingUser.set(false)">Cancel</button>
              <button class="btn-primary">Save</button>
            </div>
          </form>
        </app-modal>
      }
    } @else {
      <p class="text-sm text-muted">Loading…</p>
    }
  `,
})
export class CustomerDetailPage implements OnInit {
  id = input.required<string>();
  private api = inject(ApiService);
  private toast = inject(ToastService);

  c = signal<CustomerDetail | null>(null);
  users = signal<User[]>([]);
  items = signal<Item[]>([]);
  tab = signal<Tab>('branches');
  editing = signal(false);
  editingBranch = signal(false);
  editingUser = signal(false);

  tabs: { key: Tab; label: string }[] = [
    { key: 'branches', label: 'Branches' },
    { key: 'users', label: 'App users' },
    { key: 'scales', label: 'Scales' },
    { key: 'items', label: 'Items & prices' },
  ];
  editForm: any = {};
  branchForm = { id: '', name: '', address: '', phone: '' };
  userForm = { id: '', name: '', email: '', pin: '', role: 'STAFF', branchIds: [] as string[], isActive: true };
  itemBranch = '';
  itemSearch = '';

  money = money;
  qty = qty;
  since = since;
  formatMac = formatMac;

  ngOnInit() {
    this.load();
  }

  async load() {
    try {
      const c = await this.api.get<CustomerDetail>(`/admin/customers/${this.id()}`);
      this.c.set(c);
      if (!this.itemBranch && c.branches.length) this.itemBranch = c.branches[0].id;
      this.users.set(await this.api.get<User[]>('/users', { customerId: c.id }));
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  setTab(t: Tab) {
    this.tab.set(t);
    if (t === 'items') this.loadItems();
  }

  async loadItems() {
    if (!this.itemBranch) return;
    try {
      this.items.set(
        await this.api.get<Item[]>('/items', { customerId: this.id(), branchId: this.itemBranch, search: this.itemSearch }),
      );
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  openEdit() {
    const c = this.c()!;
    this.editForm = {
      name: c.name, contactName: c.contactName ?? '', phone: c.phone ?? '', email: c.email ?? '',
      address: c.address ?? '', notes: c.notes ?? '', subscriptionEndsAt: c.subscriptionEndsAt?.slice(0, 10) ?? '',
    };
    this.editing.set(true);
  }

  async saveCustomer() {
    const f = this.editForm;
    try {
      await this.api.patch(`/admin/customers/${this.id()}`, {
        name: f.name, contactName: f.contactName, phone: f.phone, email: f.email || undefined,
        address: f.address, notes: f.notes, subscriptionEndsAt: f.subscriptionEndsAt || null,
      });
      this.editing.set(false);
      this.toast.success('Customer saved');
      this.load();
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  async toggleActive() {
    const c = this.c()!;
    if (c.isActive && !confirm(`Disable ${c.name}? Their users will be logged out of the app.`)) return;
    try {
      await this.api.patch(`/admin/customers/${c.id}`, { isActive: !c.isActive });
      this.toast.success(c.isActive ? 'Customer disabled' : 'Customer enabled');
      this.load();
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  editBranch(b: Branch) {
    this.branchForm = { id: b.id, name: b.name, address: b.address ?? '', phone: b.phone ?? '' };
    this.editingBranch.set(true);
  }

  async saveBranch() {
    const f = this.branchForm;
    const body = { name: f.name, address: f.address || undefined, phone: f.phone || undefined };
    try {
      if (f.id) await this.api.patch(`/branches/${f.id}`, body);
      else await this.api.post('/branches', { ...body, customerId: this.id() });
      this.editingBranch.set(false);
      this.toast.success('Branch saved');
      this.load();
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  branchNames(u: User) {
    return (u.branches ?? []).map((b) => b.name).join(', ');
  }

  openUser(u?: User) {
    this.userForm = u
      ? { id: u.id, name: u.name, email: u.email, pin: '', role: u.role, branchIds: (u.branches ?? []).map((b) => b.id), isActive: !!u.isActive }
      : { id: '', name: '', email: '', pin: '', role: 'STAFF', branchIds: [], isActive: true };
    this.editingUser.set(true);
  }

  toggleBranch(id: string) {
    const ids = this.userForm.branchIds;
    this.userForm.branchIds = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  }

  async saveUser() {
    const f = this.userForm;
    if (f.pin && !/^\d{4,8}$/.test(f.pin)) return this.toast.error('PIN must be 4 to 8 digits');
    if (!f.id && !f.pin) return this.toast.error('Set a PIN for the new user');
    const body: any = { name: f.name, email: f.email, role: f.role, branchIds: f.role === 'STAFF' ? f.branchIds : [] };
    if (f.pin) body.pin = f.pin;
    try {
      if (f.id) await this.api.patch(`/users/${f.id}?customerId=${this.id()}`, { ...body, isActive: f.isActive });
      else await this.api.post('/users', { ...body, customerId: this.id() });
      this.editingUser.set(false);
      this.toast.success('User saved');
      this.load();
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }
}
