import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import { Branch, CustomerDetail, Item, Scale, User } from '../../core/models';
import { formatMac, money, qty, since } from '../../core/format';
import { cleanUsername, generatePassword, PASSWORD_MIN, suggestUsername, USERNAME_RE } from '../../core/credentials';
import { ModalComponent } from '../../shared/modal.component';
import { FabComponent } from '../../shared/fab.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { CredentialsDialogComponent } from '../../shared/credentials-dialog.component';
import { ScaleDialogComponent } from '../../shared/scale-dialog.component';

type Tab = 'users' | 'scales' | 'branches' | 'items';

@Component({
  selector: 'app-customer-detail',
  imports: [FormsModule, RouterLink, ModalComponent, FabComponent, EmptyStateComponent, CredentialsDialogComponent, ScaleDialogComponent],
  template: `
    <a routerLink="/customers" class="btn-text -ml-3 mb-2 !text-on-surface-variant">
      <span class="material-symbols-rounded">arrow_back</span>Customers
    </a>

    @if (c(); as c) {
      <!-- Header -->
      <section class="card mb-5 p-5 md:p-6">
        <div class="flex flex-wrap items-start gap-4">
          <span class="avatar !h-14 !w-14 !rounded-2xl !text-xl">{{ c.name[0] }}</span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl font-extrabold tracking-tight md:text-[28px]">{{ c.name }}</h1>
              <span [class]="c.isActive ? 'pill-success' : 'pill-neutral'">{{ c.isActive ? 'Active' : 'Disabled' }}</span>
            </div>
            <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-on-surface-variant">
              @if (c.contactName) { <span class="inline-flex items-center gap-1"><span class="material-symbols-rounded !text-lg">person</span>{{ c.contactName }}</span> }
              @if (c.phone) { <a class="inline-flex items-center gap-1 hover:text-primary" [href]="'tel:' + c.phone"><span class="material-symbols-rounded !text-lg">call</span>{{ c.phone }}</a> }
              @if (c.address) { <span class="inline-flex items-center gap-1"><span class="material-symbols-rounded !text-lg">location_on</span>{{ c.address }}</span> }
              <span class="inline-flex items-center gap-1"><span class="material-symbols-rounded !text-lg">event</span>
                {{ c.subscriptionEndsAt ? 'Subscription ends ' + c.subscriptionEndsAt.slice(0, 10) : 'No subscription date' }}</span>
            </div>
          </div>
        </div>
        <div class="mt-5 flex flex-wrap gap-2">
          <button class="btn-tonal" (click)="openEdit()"><span class="material-symbols-rounded">edit</span>Edit</button>
          <a class="btn-tonal" routerLink="/sales" [queryParams]="{ customerId: c.id }"><span class="material-symbols-rounded">bar_chart</span>Sales</a>
          <button [class]="c.isActive ? 'btn-danger-text' : 'btn-filled'" (click)="toggleActive()">
            <span class="material-symbols-rounded">{{ c.isActive ? 'block' : 'check_circle' }}</span>{{ c.isActive ? 'Disable' : 'Enable' }}
          </button>
        </div>
      </section>

      <!-- Tabs -->
      <div class="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        @for (t of tabs(); track t.key) {
          <button class="chip !h-9 !rounded-full !px-4" [class.chip-selected]="tab() === t.key" (click)="setTab(t.key)">
            <span class="material-symbols-rounded !text-[18px]" [class.icon-fill]="tab() === t.key">{{ t.icon }}</span>{{ t.label }}
            <span class="opacity-70">{{ t.count }}</span>
          </button>
        }
      </div>

      @switch (tab()) {
        @case ('users') {
          <section class="card overflow-hidden">
            <div class="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
              <p class="text-sm text-on-surface-variant">These people sign in to the Metro Scales app with a username and password.</p>
              <button class="btn-filled hidden md:inline-flex" (click)="openUser()"><span class="material-symbols-rounded">person_add</span>Add login</button>
            </div>
            @for (u of users(); track u.id) {
              <div class="row-item">
                <span class="avatar" [class.opacity-50]="!u.isActive">{{ initials(u.name) }}</span>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="truncate font-bold">{{ u.name }}</span>
                    <span [class]="u.role === 'OWNER' ? 'pill-info' : 'pill-neutral'">{{ u.role === 'OWNER' ? 'Owner' : 'Staff' }}</span>
                    @if (!u.isActive) { <span class="pill-danger">Blocked</span> }
                  </div>
                  <div class="truncate font-mono text-sm text-on-surface-variant">&#64;{{ u.username }}</div>
                  @if (u.role === 'STAFF') {
                    <div class="truncate text-xs text-on-surface-variant">{{ u.branches?.length ? branchNames(u) : 'No branches yet' }}</div>
                  }
                </div>
                <button class="icon-btn" (click)="resetPassword(u)" title="Reset password"><span class="material-symbols-rounded">lock_reset</span></button>
                <button class="icon-btn" (click)="openUser(u)" title="Edit"><span class="material-symbols-rounded">edit</span></button>
              </div>
            } @empty {
              <app-empty-state icon="person_add" title="No logins yet" message="Add a login so the shop can use the app." />
            }
          </section>
        }

        @case ('scales') {
          <section class="card overflow-hidden">
            <div class="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
              <p class="text-sm text-on-surface-variant">Scales are added by MAC address and linked to a branch.</p>
              <button class="btn-filled hidden md:inline-flex" (click)="openScale()"><span class="material-symbols-rounded">add_link</span>Add scale</button>
            </div>
            @for (s of c.scales; track s.id) {
              <button class="row-item" (click)="openScale(s)">
                <span class="icon-box" [class]="s.online ? '!bg-success-container !text-on-success-container' : '!bg-surface-highest !text-on-surface-variant'">
                  <span class="material-symbols-rounded">scale</span>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate font-bold">{{ s.name }} <span class="font-semibold text-on-surface-variant">#{{ s.number }}</span></span>
                  <span class="block truncate font-mono text-xs text-on-surface-variant">{{ formatMac(s.mac) }}</span>
                  <span class="block truncate text-xs text-on-surface-variant">{{ s.branch?.name || 'No branch' }} · seen {{ since(s.lastSeenAt) }}</span>
                </span>
                <span [class]="s.online ? 'pill-success' : 'pill-neutral'">{{ s.online ? 'Online' : 'Offline' }}</span>
              </button>
            } @empty {
              <app-empty-state icon="scale" title="No scales yet" message="Add the shop's scales by their MAC address." />
            }
          </section>
        }

        @case ('branches') {
          <section class="card overflow-hidden">
            <div class="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
              <p class="text-sm text-on-surface-variant">Each branch keeps its own prices and stock.</p>
              <button class="btn-filled hidden md:inline-flex" (click)="openBranch()"><span class="material-symbols-rounded">add</span>Add branch</button>
            </div>
            @for (b of c.branches; track b.id) {
              <button class="row-item" (click)="openBranch(b)">
                <span class="icon-box"><span class="material-symbols-rounded">store</span></span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate font-bold">{{ b.name }}</span>
                  <span class="block truncate text-sm text-on-surface-variant">{{ branchLine(b) }}</span>
                </span>
                <span class="material-symbols-rounded text-on-surface-variant">edit</span>
              </button>
            }
          </section>
        }

        @case ('items') {
          <section class="card overflow-hidden">
            <div class="flex flex-col gap-3 p-4 sm:flex-row">
              <select class="select sm:max-w-60" [(ngModel)]="itemBranch" (ngModelChange)="loadItems()">
                @for (b of c.branches; track b.id) { <option [value]="b.id">{{ b.name }}</option> }
              </select>
              <div class="relative flex-1">
                <span class="material-symbols-rounded pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input class="search !h-14 !rounded-2xl" placeholder="Search name or PLU" [(ngModel)]="itemSearch" (ngModelChange)="loadItems()" />
              </div>
            </div>
            <p class="px-5 pb-2 text-xs text-on-surface-variant">{{ items().length }} items. Shop owners edit these in the app.</p>
            <div class="md:hidden">
              @for (i of items(); track i.id) {
                <div class="row-item">
                  <span class="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-surface-highest px-2 font-mono text-sm font-bold">{{ i.plu }}</span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate font-semibold">{{ i.name }}</span>
                    <span class="block truncate text-xs text-on-surface-variant">{{ i.category?.name || 'No category' }} · stock {{ qty(i.stock, i.unit) }}</span>
                  </span>
                  <span class="text-right font-bold">{{ money(i.price) }}<span class="block text-xs font-normal text-on-surface-variant">/{{ i.unit === 'KG' ? 'kg' : 'pack' }}</span></span>
                </div>
              }
            </div>
            <table class="data-table hidden md:table">
              <thead><tr><th>PLU</th><th>Item</th><th>Category</th><th class="text-right">Price</th><th class="text-right">Stock</th><th>GST</th></tr></thead>
              <tbody>
                @for (i of items(); track i.id) {
                  <tr>
                    <td class="font-mono">{{ i.plu }}</td>
                    <td class="font-semibold">{{ i.name }}</td>
                    <td class="text-on-surface-variant">{{ i.category?.name || '—' }}</td>
                    <td class="text-right">{{ money(i.price) }} / {{ i.unit === 'KG' ? 'kg' : 'pack' }}</td>
                    <td class="text-right" [class.text-error]="(i.stock ?? 0) < 0">{{ qty(i.stock, i.unit) }}</td>
                    <td class="text-on-surface-variant">{{ i.gstPercent }}% {{ i.gstMode === 'INCLUDED' ? 'incl.' : 'extra' }}</td>
                  </tr>
                }
              </tbody>
            </table>
            @if (!items().length) { <app-empty-state icon="nutrition" title="No items" message="The shop adds items in the app." /> }
          </section>
        }
      }

      @if (fab(); as f) { <app-fab [icon]="f.icon" [label]="f.label" (pressed)="f.run()" /> }

      <!-- Edit customer -->
      @if (editing()) {
        <app-modal title="Edit customer" icon="edit" [width]="640" (close)="editing.set(false)">
          <form class="grid grid-cols-1 gap-4 sm:grid-cols-2" (ngSubmit)="saveCustomer()">
            <div class="sm:col-span-2"><label class="field-label">Shop name</label><input class="input" name="name" [(ngModel)]="editForm.name" required /></div>
            <div><label class="field-label">Contact person</label><input class="input" name="contactName" [(ngModel)]="editForm.contactName" /></div>
            <div><label class="field-label">Phone</label><input class="input" type="tel" name="phone" [(ngModel)]="editForm.phone" /></div>
            <div><label class="field-label">Email</label><input class="input" type="email" name="email" [(ngModel)]="editForm.email" /></div>
            <div><label class="field-label">Subscription ends</label><input class="input" type="date" name="sub" [(ngModel)]="editForm.subscriptionEndsAt" /></div>
            <div class="sm:col-span-2"><label class="field-label">Address</label><input class="input" name="address" [(ngModel)]="editForm.address" /></div>
            <div class="sm:col-span-2"><label class="field-label">Notes</label><textarea class="textarea" rows="3" name="notes" [(ngModel)]="editForm.notes"></textarea></div>
            <div class="mt-2 flex justify-end gap-2 sm:col-span-2">
              <button type="button" class="btn-text" (click)="editing.set(false)">Cancel</button>
              <button class="btn-filled">Save</button>
            </div>
          </form>
        </app-modal>
      }

      <!-- Branch -->
      @if (editingBranch()) {
        <app-modal [title]="branchForm.id ? 'Edit branch' : 'Add branch'" icon="store" (close)="editingBranch.set(false)">
          <form class="flex flex-col gap-4" (ngSubmit)="saveBranch()">
            <div><label class="field-label">Branch name</label><input class="input" name="name" [(ngModel)]="branchForm.name" required /></div>
            <div><label class="field-label">Address</label><input class="input" name="address" [(ngModel)]="branchForm.address" /></div>
            <div><label class="field-label">Phone</label><input class="input" type="tel" name="phone" [(ngModel)]="branchForm.phone" /></div>
            <div class="mt-2 flex justify-end gap-2">
              <button type="button" class="btn-text" (click)="editingBranch.set(false)">Cancel</button>
              <button class="btn-filled">Save</button>
            </div>
          </form>
        </app-modal>
      }

      <!-- Login (user) -->
      @if (editingUser()) {
        <app-modal [title]="userForm.id ? 'Edit login' : 'Add login'" icon="key" (close)="editingUser.set(false)"
                   [subtitle]="userForm.id ? null : 'Create a username and password for someone at ' + c.name + '.'">
          <form class="flex flex-col gap-4" (ngSubmit)="saveUser()" autocomplete="off">
            <div><label class="field-label" for="uname">Name</label><input id="uname" class="input" name="name" [(ngModel)]="userForm.name" (ngModelChange)="onUserName()" required /></div>
            <div>
              <label class="field-label" for="uuser">Username</label>
              <input id="uuser" class="input font-mono" name="username" [ngModel]="userForm.username" (ngModelChange)="userForm.username = clean($event); userTouched = true"
                     autocapitalize="none" spellcheck="false" required />
              <span class="field-hint">Letters, digits, dot, dash or underscore. Must be unique.</span>
            </div>
            <div>
              <label class="field-label" for="upass">{{ userForm.id ? 'New password' : 'Password' }}</label>
              <div class="relative">
                <input id="upass" class="input pr-12 font-mono" name="password" [(ngModel)]="userForm.password" autocapitalize="none" spellcheck="false"
                       [placeholder]="userForm.id ? 'Leave empty to keep the current one' : ''" />
                <button type="button" class="icon-btn absolute right-2 top-1/2 -translate-y-1/2" (click)="userForm.password = generatePassword()" title="New random password">
                  <span class="material-symbols-rounded">casino</span>
                </button>
              </div>
              <span class="field-hint">At least {{ PASSWORD_MIN }} characters</span>
            </div>
            <div>
              <span class="field-label">Role</span>
              <div class="segmented flex w-full">
                <button type="button" class="segment" [class.segment-on]="userForm.role === 'OWNER'" (click)="userForm.role = 'OWNER'">
                  @if (userForm.role === 'OWNER') { <span class="material-symbols-rounded !text-lg">check</span> }Owner
                </button>
                <button type="button" class="segment" [class.segment-on]="userForm.role === 'STAFF'" (click)="userForm.role = 'STAFF'">
                  @if (userForm.role === 'STAFF') { <span class="material-symbols-rounded !text-lg">check</span> }Staff
                </button>
              </div>
              <span class="field-hint">{{ userForm.role === 'OWNER' ? 'Everything in this shop: all branches, prices, items, scales and users.' : 'Only the branches picked below. Cannot change prices.' }}</span>
            </div>
            @if (userForm.role === 'STAFF') {
              <div class="flex flex-wrap gap-2">
                @for (b of c.branches; track b.id) {
                  <button type="button" class="chip" [class.chip-selected]="userForm.branchIds.includes(b.id)" (click)="toggleBranch(b.id)">
                    @if (userForm.branchIds.includes(b.id)) { <span class="material-symbols-rounded !text-lg">check</span> }{{ b.name }}
                  </button>
                }
              </div>
            }
            @if (userForm.id) {
              <label class="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-surface-highest/60 px-4 py-3">
                <span><span class="block font-semibold">Can sign in</span><span class="text-xs text-on-surface-variant">Turn off to block this login</span></span>
                <input type="checkbox" name="active" [(ngModel)]="userForm.isActive" class="h-5 w-9 cursor-pointer accent-[var(--md-primary)]" />
              </label>
            }
            <div class="mt-2 flex justify-end gap-2">
              <button type="button" class="btn-text" (click)="editingUser.set(false)">Cancel</button>
              <button class="btn-filled" [disabled]="busy()">{{ userForm.id ? 'Save' : 'Create login' }}</button>
            </div>
          </form>
        </app-modal>
      }

      @if (credentials(); as cr) {
        <app-credentials-dialog [title]="cr.title" [name]="cr.name" [username]="cr.username" [password]="cr.password" (close)="credentials.set(null)" />
      }

      @if (scaleDialog(); as sd) {
        <app-scale-dialog [scale]="sd.scale" [customerId]="c.id" [lockCustomer]="!sd.scale" (close)="scaleDialog.set(null)"
                          (saved)="scaleDialog.set(null); load()" />
      }
    } @else {
      <div class="card h-40 animate-pulse"></div>
    }
  `,
})
export class CustomerDetailPage implements OnInit {
  id = input.required<string>();
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  c = signal<CustomerDetail | null>(null);
  users = signal<User[]>([]);
  items = signal<Item[]>([]);
  tab = signal<Tab>('users');
  editing = signal(false);
  editingBranch = signal(false);
  editingUser = signal(false);
  busy = signal(false);
  credentials = signal<{ title: string; name: string; username: string; password: string } | null>(null);
  scaleDialog = signal<{ scale: Scale | null } | null>(null);

  tabs = computed(() => {
    const c = this.c();
    return [
      { key: 'users' as Tab, label: 'Logins', icon: 'key', count: this.users().length },
      { key: 'scales' as Tab, label: 'Scales', icon: 'scale', count: c?.scales.length ?? 0 },
      { key: 'branches' as Tab, label: 'Branches', icon: 'store', count: c?.branches.length ?? 0 },
      { key: 'items' as Tab, label: 'Items', icon: 'nutrition', count: c?._count?.items ?? '' },
    ];
  });

  fab = computed(() => {
    switch (this.tab()) {
      case 'users': return { icon: 'person_add', label: 'Add login', run: () => this.openUser() };
      case 'scales': return { icon: 'add_link', label: 'Add scale', run: () => this.openScale() };
      case 'branches': return { icon: 'add', label: 'Add branch', run: () => this.openBranch() };
      default: return null;
    }
  });

  editForm: any = {};
  branchForm = { id: '', name: '', address: '', phone: '' };
  userForm = { id: '', name: '', username: '', password: '', role: 'STAFF', branchIds: [] as string[], isActive: true };
  userTouched = false;
  itemBranch = '';
  itemSearch = '';

  money = money;
  qty = qty;
  since = since;
  formatMac = formatMac;
  clean = cleanUsername;
  generatePassword = generatePassword;
  PASSWORD_MIN = PASSWORD_MIN;

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
      this.items.set(await this.api.get<Item[]>('/items', { customerId: this.id(), branchId: this.itemBranch, search: this.itemSearch }));
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  initials(name: string) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  }

  // ---- customer ----

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
    if (c.isActive && !(await this.confirm.ask({
      title: `Disable ${c.name}?`,
      message: 'All of their logins are signed out of the app and cannot sign in until you enable the shop again.',
      confirmLabel: 'Disable', danger: true, icon: 'block',
    }))) return;
    try {
      await this.api.patch(`/admin/customers/${c.id}`, { isActive: !c.isActive });
      this.toast.success(c.isActive ? 'Customer disabled' : 'Customer enabled');
      this.load();
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  // ---- branches ----

  openBranch(b?: Branch) {
    this.branchForm = b ? { id: b.id, name: b.name, address: b.address ?? '', phone: b.phone ?? '' } : { id: '', name: '', address: '', phone: '' };
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

  branchLine(b: Branch) {
    return [b.address, b.phone].filter((x) => !!x).join(' · ') || 'No address';
  }

  // ---- scales ----

  openScale(s?: Scale) {
    this.scaleDialog.set({ scale: s ?? null });
  }

  // ---- logins ----

  branchNames(u: User) {
    return (u.branches ?? []).map((b) => b.name).join(', ');
  }

  openUser(u?: User) {
    const firstBranch = this.c()?.branches.length === 1 ? [this.c()!.branches[0].id] : [];
    this.userForm = u
      ? { id: u.id, name: u.name, username: u.username, password: '', role: u.role, branchIds: (u.branches ?? []).map((b) => b.id), isActive: !!u.isActive }
      : { id: '', name: '', username: '', password: generatePassword(), role: this.users().length ? 'STAFF' : 'OWNER', branchIds: firstBranch, isActive: true };
    this.userTouched = !!u;
    this.editingUser.set(true);
  }

  onUserName() {
    if (!this.userTouched) this.userForm.username = suggestUsername(this.userForm.name);
  }

  toggleBranch(id: string) {
    const ids = this.userForm.branchIds;
    this.userForm.branchIds = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  }

  async saveUser() {
    const f = this.userForm;
    if (!f.name.trim()) return this.toast.error('Enter a name');
    if (!USERNAME_RE.test(f.username)) return this.toast.error('Username must be 3 to 30 letters, digits, dots, dashes or underscores');
    if ((!f.id || f.password) && f.password.length < PASSWORD_MIN) return this.toast.error(`Password must be at least ${PASSWORD_MIN} characters`);
    if (f.role === 'STAFF' && !f.branchIds.length) return this.toast.error('Pick at least one branch for staff');
    const body: any = { name: f.name.trim(), username: f.username, role: f.role, branchIds: f.role === 'STAFF' ? f.branchIds : [] };
    if (f.password) body.password = f.password;
    this.busy.set(true);
    try {
      if (f.id) await this.api.patch(`/users/${f.id}?customerId=${this.id()}`, { ...body, isActive: f.isActive });
      else await this.api.post('/users', { ...body, customerId: this.id() });
      this.editingUser.set(false);
      if (f.password) {
        this.credentials.set({ title: f.id ? 'Password changed' : 'Login created', name: f.name, username: f.username, password: f.password });
      } else {
        this.toast.success('Login saved');
      }
      this.load();
    } catch (e: any) {
      this.toast.error(e.message);
    } finally {
      this.busy.set(false);
    }
  }

  async resetPassword(u: User) {
    if (!(await this.confirm.ask({
      title: `Reset ${u.name}'s password?`,
      message: 'A new password is made and they are signed out of the app on every phone. You will see the new password next.',
      confirmLabel: 'Reset', icon: 'lock_reset',
    }))) return;
    const password = generatePassword();
    try {
      await this.api.patch(`/users/${u.id}?customerId=${this.id()}`, { password });
      this.credentials.set({ title: 'New password', name: u.name, username: u.username, password });
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }
}
