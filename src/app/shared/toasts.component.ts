import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-toasts',
  template: `
    <!-- Above the bottom navigation bar on phones -->
    <div class="fixed inset-x-4 bottom-24 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end lg:bottom-4">
      @for (t of toasts.toasts(); track t.id) {
        <div class="card flex items-center gap-2 px-4 py-3 text-sm shadow-lg"
             [class.border-emerald-200]="t.kind === 'success'" [class.border-red-200]="t.kind === 'error'">
          <span class="material-symbols-outlined" [class.text-emerald-600]="t.kind === 'success'" [class.text-red-600]="t.kind === 'error'">
            {{ t.kind === 'success' ? 'check_circle' : 'error' }}
          </span>
          <span class="max-w-sm">{{ t.text }}</span>
          <button class="ml-2 text-muted hover:text-ink" (click)="toasts.dismiss(t.id)">
            <span class="material-symbols-outlined !text-base">close</span>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastsComponent {
  toasts = inject(ToastService);
}
