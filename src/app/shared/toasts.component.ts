import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';
import { PwaService } from '../core/pwa.service';

/// Material 3 snackbars, above the bottom navigation bar on phones.
@Component({
  selector: 'app-toasts',
  template: `
    <div class="pointer-events-none fixed inset-x-0 bottom-[calc(92px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6 md:left-auto md:right-6 md:items-end">
      @if (pwa.updateReady()) {
        <div class="animate-rise pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl bg-inverse-surface py-2 pl-4 pr-2 text-sm text-inverse-on-surface shadow-xl">
          <span class="flex-1">A new version of the admin panel is ready.</span>
          <button class="btn-text !text-inverse-primary" (click)="pwa.reload()">Reload</button>
        </div>
      }
      @for (t of toasts.toasts(); track t.id) {
        <div class="animate-rise pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl bg-inverse-surface py-3 pl-4 pr-2 text-sm text-inverse-on-surface shadow-xl">
          <span class="material-symbols-rounded icon-fill" [class]="t.kind === 'error' ? 'text-[#ffb4ab]' : 'text-inverse-primary'">
            {{ t.kind === 'success' ? 'check_circle' : 'error' }}
          </span>
          <span class="flex-1">{{ t.text }}</span>
          <button class="icon-btn !h-8 !w-8 !text-inverse-on-surface" (click)="toasts.dismiss(t.id)" aria-label="Dismiss">
            <span class="material-symbols-rounded !text-lg">close</span>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastsComponent {
  toasts = inject(ToastService);
  pwa = inject(PwaService);
}
