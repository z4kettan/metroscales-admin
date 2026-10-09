import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="flex flex-col items-center px-6 py-12 text-center">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary-container text-on-secondary-container">
        <span class="material-symbols-rounded !text-[32px]">{{ icon() }}</span>
      </div>
      <div class="title-md">{{ title() }}</div>
      @if (message()) { <p class="mt-1 max-w-sm text-sm text-on-surface-variant">{{ message() }}</p> }
      <div class="mt-4"><ng-content /></div>
    </div>
  `,
})
export class EmptyStateComponent {
  icon = input('inbox');
  title = input.required<string>();
  message = input<string | null>(null);
}
