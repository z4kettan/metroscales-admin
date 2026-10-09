import { Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { ThemeMode, ThemeService } from '../core/theme.service';
import { PwaService } from '../core/pwa.service';
import { ToastService } from '../core/toast.service';
import { ModalComponent } from '../shared/modal.component';

@Component({
  selector: 'app-account-menu',
  imports: [ModalComponent],
  host: { '(document:click)': 'onDocClick($event)', '(document:keydown.escape)': 'open.set(false)', class: 'relative block' },
  template: `
    <button type="button" class="flex items-center gap-3 rounded-full p-1 transition hover:bg-on-surface/5" [class.lg:w-full]="wide()" [class.lg:pr-3]="wide()"
            (click)="open.set(!open())" aria-label="Account and settings" [attr.aria-expanded]="open()">
      <span class="avatar !h-9 !w-9">{{ initials() }}</span>
      @if (wide()) {
        <span class="hidden min-w-0 flex-1 text-left lg:block">
          <span class="block truncate text-sm font-bold">{{ auth.user()?.name }}</span>
          <span class="block truncate text-xs text-on-surface-variant">&#64;{{ auth.user()?.username }}</span>
        </span>
        <span class="material-symbols-rounded hidden text-on-surface-variant lg:block">unfold_more</span>
      }
    </button>

    @if (open()) {
      <div class="animate-fade absolute z-50 w-72 rounded-3xl bg-surface-mid p-2 shadow-2xl"
           [class]="up() ? 'bottom-full left-0 mb-2' : 'right-0 top-full mt-2'">
        <div class="flex items-center gap-3 px-3 py-3">
          <span class="avatar">{{ initials() }}</span>
          <div class="min-w-0">
            <div class="truncate font-bold">{{ auth.user()?.name }}</div>
            <div class="truncate text-xs text-on-surface-variant">&#64;{{ auth.user()?.username }} · Dealer admin</div>
          </div>
        </div>
        <div class="px-3 pb-1 pt-2 text-xs font-bold text-on-surface-variant">Theme</div>
        <div class="segmented mx-2 mb-2 flex !h-9">
          @for (m of modes; track m.value) {
            <button type="button" class="segment !px-2 !text-xs" [class.segment-on]="theme.mode() === m.value" (click)="theme.set(m.value)">
              <span class="material-symbols-rounded !text-[18px]">{{ m.icon }}</span>{{ m.label }}
            </button>
          }
        </div>
        <div class="my-1 h-px bg-outline-variant/60"></div>
        @if (!pwa.installed() && (pwa.canInstall() || pwa.isIos)) {
          <button class="row-item rounded-2xl !py-2.5" (click)="install()">
            <span class="material-symbols-rounded text-on-surface-variant">install_mobile</span>
            <span class="text-sm font-semibold">Install app</span>
          </button>
        }
        <button class="row-item rounded-2xl !py-2.5" (click)="auth.logout()">
          <span class="material-symbols-rounded text-on-surface-variant">logout</span>
          <span class="text-sm font-semibold">Sign out</span>
        </button>
      </div>
    }

    @if (iosHelp()) {
      <app-modal title="Install on iPhone or iPad" icon="install_mobile" [width]="420" (close)="iosHelp.set(false)">
        <ol class="flex flex-col gap-3 text-[15px]">
          <li class="flex gap-3"><span class="avatar !h-7 !w-7 !text-xs">1</span>Open this page in Safari.</li>
          <li class="flex gap-3"><span class="avatar !h-7 !w-7 !text-xs">2</span><span>Tap the Share button <span class="material-symbols-rounded !text-lg">ios_share</span></span></li>
          <li class="flex gap-3"><span class="avatar !h-7 !w-7 !text-xs">3</span>Choose “Add to Home Screen”.</li>
        </ol>
        <div class="mt-6 flex justify-end"><button class="btn-filled" (click)="iosHelp.set(false)">Got it</button></div>
      </app-modal>
    }
  `,
})
export class AccountMenuComponent {
  /// Opens upwards (from the bottom of the side navigation)
  up = input(false);
  /// Shows the name next to the avatar on large screens
  wide = input(false);
  auth = inject(AuthService);
  theme = inject(ThemeService);
  pwa = inject(PwaService);
  private toast = inject(ToastService);
  private el = inject(ElementRef);
  open = signal(false);
  iosHelp = signal(false);
  modes: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'system', label: 'Auto', icon: 'brightness_auto' },
    { value: 'light', label: 'Light', icon: 'light_mode' },
    { value: 'dark', label: 'Dark', icon: 'dark_mode' },
  ];

  initials = computed(() =>
    (this.auth.user()?.name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join(''),
  );

  onDocClick(e: Event) {
    if (this.open() && !(this.el.nativeElement as HTMLElement).contains(e.target as Node)) this.open.set(false);
  }

  async install() {
    this.open.set(false);
    if (this.pwa.canInstall()) {
      if (await this.pwa.install()) this.toast.success('Metro Scales Admin is installed');
    } else {
      this.iosHelp.set(true);
    }
  }
}
