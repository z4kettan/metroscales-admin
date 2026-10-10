import { Component, input, output } from '@angular/core';

/// Extended floating action button for phones, sitting above the bottom navigation bar.
@Component({
  selector: 'app-fab',
  template: `
    <button type="button" class="fab fixed right-4 z-30 md:hidden" style="bottom: calc(96px + env(safe-area-inset-bottom))" (click)="pressed.emit()">
      <span class="material-symbols-rounded">{{ icon() }}</span>{{ label() }}
    </button>
  `,
})
export class FabComponent {
  icon = input('add');
  label = input.required<string>();
  pressed = output<void>();
}
