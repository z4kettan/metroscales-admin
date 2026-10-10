import { Component, inject } from '@angular/core';
import { ConfirmService } from '../core/confirm.service';

@Component({
  selector: 'app-confirm-host',
  host: { '(document:keydown.escape)': 'confirm.current() && confirm.answer(false)' },
  template: `
    @if (confirm.current(); as c) {
      <div class="fixed inset-0 z-[70] flex items-center justify-center p-6" role="alertdialog" aria-modal="true">
        <div class="animate-fade absolute inset-0 bg-black/40" (click)="confirm.answer(false)"></div>
        <div class="relative w-full max-w-[400px] rounded-[28px] bg-surface-high p-6 shadow-2xl [animation:dialog-in_.2s_cubic-bezier(.2,0,0,1)]">
          <div class="flex flex-col items-center text-center">
            <span class="material-symbols-rounded mb-3 !text-[28px]" [class]="c.danger ? 'text-error' : 'text-secondary'">{{ c.icon || (c.danger ? 'warning' : 'help') }}</span>
            <h2 class="title-lg">{{ c.title }}</h2>
            <p class="mt-3 text-sm text-on-surface-variant">{{ c.message }}</p>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button class="btn-text" (click)="confirm.answer(false)">Cancel</button>
            <button [class]="c.danger ? 'btn-danger' : 'btn-filled'" (click)="confirm.answer(true)">{{ c.confirmLabel || 'OK' }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmHostComponent {
  confirm = inject(ConfirmService);
}
