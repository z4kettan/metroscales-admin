import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/// Install-to-home-screen and new-version handling for the PWA.
@Injectable({ providedIn: 'root' })
export class PwaService {
  private sw = inject(SwUpdate);
  private deferred: InstallPromptEvent | null = null;

  /// Chrome / Edge / Android: the browser offered an install prompt
  readonly canInstall = signal(false);
  /// iPhone / iPad Safari has no prompt; people use Share → Add to Home Screen
  readonly isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  readonly installed = signal(
    window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true,
  );
  readonly updateReady = signal(false);

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferred = e as InstallPromptEvent;
      this.canInstall.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.deferred = null;
      this.canInstall.set(false);
      this.installed.set(true);
    });
    if (this.sw.isEnabled) {
      this.sw.versionUpdates.pipe(filter((e) => e.type === 'VERSION_READY')).subscribe(() => this.updateReady.set(true));
      // Check for a new version when the app comes back to the foreground
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.sw.checkForUpdate().catch(() => {});
      });
    }
  }

  async install() {
    if (!this.deferred) return false;
    await this.deferred.prompt();
    const { outcome } = await this.deferred.userChoice;
    this.deferred = null;
    this.canInstall.set(false);
    return outcome === 'accepted';
  }

  reload() {
    document.location.reload();
  }
}
