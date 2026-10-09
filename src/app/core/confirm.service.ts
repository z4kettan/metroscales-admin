import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  icon?: string;
}

/// Material 3 confirmation dialog: `if (await confirm.ask({...})) ...`
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly current = signal<(ConfirmRequest & { resolve: (ok: boolean) => void }) | null>(null);

  ask(req: ConfirmRequest) {
    return new Promise<boolean>((resolve) => this.current.set({ ...req, resolve }));
  }

  answer(ok: boolean) {
    this.current()?.resolve(ok);
    this.current.set(null);
  }
}
