import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center p-4">
      <form class="card w-full max-w-sm p-8" (ngSubmit)="submit()">
        <div class="mb-6 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
            <span class="material-symbols-outlined">scale</span>
          </div>
          <div>
            <h1 class="text-lg font-semibold">Metro Scales</h1>
            <p class="text-sm text-muted">Dealer admin</p>
          </div>
        </div>
        <label class="label" for="email">Email</label>
        <input id="email" class="input mb-4" type="email" name="email" [(ngModel)]="email" required autocomplete="username" />
        <label class="label" for="password">Password</label>
        <input id="password" class="input mb-4" type="password" name="password" [(ngModel)]="password" required autocomplete="current-password" />
        @if (error()) { <p class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p> }
        <button class="btn-primary w-full" [disabled]="busy() || !email || !password">
          {{ busy() ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  `,
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  email = '';
  password = '';
  busy = signal(false);
  error = signal<string | null>(null);

  async submit() {
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.busy.set(false);
    }
  }
}
