import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastsComponent } from './shared/toasts.component';
import { ConfirmHostComponent } from './shared/confirm-host.component';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastsComponent, ConfirmHostComponent],
  template: `<router-outlet /><app-toasts /><app-confirm-host />`,
})
export class App {
  // Created here so the theme follows the device from the start
  private theme = inject(ThemeService);
}
