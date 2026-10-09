import { Component, inject, input, output } from '@angular/core';
import { ToastService } from '../core/toast.service';
import { ModalComponent } from './modal.component';

/// Shows a username and password once, so the dealer can hand them to the shop.
@Component({
  selector: 'app-credentials-dialog',
  imports: [ModalComponent],
  template: `
    <app-modal [title]="title()" icon="key" [width]="440" (close)="close.emit()"
               subtitle="Give these to the user. The password is not shown again; you can reset it any time.">
      <div class="overflow-hidden rounded-2xl bg-surface-lowest">
        <div class="flex items-center gap-3 px-4 py-3">
          <div class="min-w-0 flex-1">
            <div class="text-xs font-semibold text-on-surface-variant">Username</div>
            <div class="truncate font-mono text-[17px] font-semibold">{{ username() }}</div>
          </div>
          <button class="icon-btn" (click)="copy(username(), 'Username')" aria-label="Copy username">
            <span class="material-symbols-rounded">content_copy</span>
          </button>
        </div>
        @if (password()) {
          <div class="flex items-center gap-3 border-t border-outline-variant/60 px-4 py-3">
            <div class="min-w-0 flex-1">
              <div class="text-xs font-semibold text-on-surface-variant">Password</div>
              <div class="truncate font-mono text-[17px] font-semibold">{{ password() }}</div>
            </div>
            <button class="icon-btn" (click)="copy(password()!, 'Password')" aria-label="Copy password">
              <span class="material-symbols-rounded">content_copy</span>
            </button>
          </div>
        }
      </div>
      <p class="mt-3 px-1 text-xs text-on-surface-variant">They sign in to the Metro Scales app with these.</p>
      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <button class="btn-outline" (click)="share()">
          <span class="material-symbols-rounded">{{ canShare ? 'share' : 'content_copy' }}</span>{{ canShare ? 'Share' : 'Copy both' }}
        </button>
        <button class="btn-filled" (click)="close.emit()">Done</button>
      </div>
    </app-modal>
  `,
})
export class CredentialsDialogComponent {
  title = input('Login details');
  name = input<string>('');
  username = input.required<string>();
  password = input<string | null>(null);
  close = output<void>();
  private toast = inject(ToastService);
  canShare = typeof navigator.share === 'function';

  private text() {
    const lines = [`Metro Scales app login${this.name() ? ' for ' + this.name() : ''}`, `Username: ${this.username()}`];
    if (this.password()) lines.push(`Password: ${this.password()}`);
    return lines.join('\n');
  }

  async copy(value: string, what: string) {
    try {
      await navigator.clipboard.writeText(value);
      this.toast.success(`${what} copied`);
    } catch {
      this.toast.error('Could not copy. Select the text and copy it instead.');
    }
  }

  async share() {
    if (this.canShare) {
      try {
        await navigator.share({ title: 'Metro Scales login', text: this.text() });
      } catch {}
    } else {
      this.copy(this.text(), 'Login details');
    }
  }
}
