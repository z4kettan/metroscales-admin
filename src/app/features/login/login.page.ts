import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PwaService } from '../../core/pwa.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="flex min-h-dvh">
      <!-- Brand panel, large screens only -->
      <section class="relative hidden flex-1 overflow-hidden bg-primary-container p-12 text-on-primary-container lg:flex lg:flex-col">
        <div class="flex items-center gap-3">
          <img src="icons/icon.svg" alt="" class="h-12 w-12 rounded-2xl ring-2 ring-on-primary-container/20" />
          <span class="text-xl font-extrabold tracking-tight">Metro Scales</span>
        </div>
        <div class="mt-auto max-w-md">
          <h2 class="text-[44px] font-extrabold leading-[1.1] tracking-[-1.2px]">Every shop, every scale, one place.</h2>
          <p class="mt-4 text-lg opacity-85">Create customer logins, register scales by MAC address and follow sales across all your shops.</p>
        </div>
        <div class="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-on-primary-container/10"></div>
        <div class="pointer-events-none absolute -bottom-32 right-24 h-72 w-72 rounded-full bg-on-primary-container/10"></div>
      </section>

      <section class="pt-safe flex flex-1 items-center justify-center bg-surface-low p-5 lg:max-w-[560px] lg:bg-surface">
        <div class="w-full max-w-[420px]">
          <div class="mb-10 flex items-center gap-3 lg:hidden">
            <img src="icons/icon.svg" alt="" class="h-12 w-12 rounded-2xl" />
            <div>
              <div class="text-lg font-extrabold tracking-tight">Metro Scales</div>
              <div class="text-xs font-semibold text-on-surface-variant">Dealer admin</div>
            </div>
          </div>
          <h1 class="text-[34px] font-extrabold leading-tight tracking-[-1px]">Welcome back</h1>
          <p class="mt-2 text-on-surface-variant">Sign in to manage your customers and scales.</p>

          <form class="mt-8 flex flex-col gap-4 rounded-3xl bg-surface p-5 lg:bg-transparent lg:p-0" (ngSubmit)="submit()">
            <div>
              <label class="field-label" for="username">Username</label>
              <div class="relative">
                <span class="material-symbols-rounded pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">person</span>
                <input id="username" class="input pl-12" name="username" [(ngModel)]="username" required autocomplete="username"
                       autocapitalize="none" spellcheck="false" placeholder="admin" />
              </div>
            </div>
            <div>
              <label class="field-label" for="password">Password</label>
              <div class="relative">
                <span class="material-symbols-rounded pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">lock</span>
                <input id="password" class="input pl-12 pr-14" [type]="show() ? 'text' : 'password'" name="password" [(ngModel)]="password"
                       required autocomplete="current-password" />
                <button type="button" class="icon-btn absolute right-2 top-1/2 -translate-y-1/2" (click)="show.set(!show())"
                        [attr.aria-label]="show() ? 'Hide password' : 'Show password'">
                  <span class="material-symbols-rounded">{{ show() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>
            @if (error()) {
              <div class="flex items-start gap-2 rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
                <span class="material-symbols-rounded !text-xl">error</span><span>{{ error() }}</span>
              </div>
            }
            <button class="btn-filled mt-2 !h-14 w-full !text-base" [disabled]="busy() || !username || !password">
              {{ busy() ? 'Signing in…' : 'Sign in' }}
              @if (!busy()) { <span class="material-symbols-rounded !ml-0 !mr-[-4px]">arrow_forward</span> }
            </button>
          </form>

          @if (!pwa.installed() && pwa.canInstall()) {
            <button class="btn-tonal mt-6 w-full" (click)="pwa.install()">
              <span class="material-symbols-rounded">install_mobile</span>Install the admin app
            </button>
          }
        </div>
      </section>
    </div>
  `,
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  pwa = inject(PwaService);
  username = '';
  password = '';
  show = signal(false);
  busy = signal(false);
  error = signal<string | null>(null);

  async submit() {
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.username, this.password);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.busy.set(false);
    }
  }
}
