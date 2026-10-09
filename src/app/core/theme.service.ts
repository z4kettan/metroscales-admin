import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'system' | 'light' | 'dark';
const KEY = 'ms_theme';

/// Light, dark, or follow the device. index.html applies the saved choice
/// before the app starts; this keeps it in sync afterwards.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(this.load());
  private media = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    this.media.addEventListener('change', () => this.apply());
    this.apply();
  }

  set(mode: ThemeMode) {
    this.mode.set(mode);
    try {
      localStorage.setItem(KEY, mode);
    } catch {}
    this.apply();
  }

  private load(): ThemeMode {
    try {
      const m = localStorage.getItem(KEY);
      return m === 'light' || m === 'dark' ? m : 'system';
    } catch {
      return 'system';
    }
  }

  private apply() {
    const mode = this.mode();
    const dark = mode === 'dark' || (mode === 'system' && this.media.matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#101414' : '#f7faf8');
  }
}
