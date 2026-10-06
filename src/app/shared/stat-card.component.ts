import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  template: `
    <div class="card p-5">
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted">{{ label() }}</span>
        <span class="material-symbols-outlined text-brand">{{ icon() }}</span>
      </div>
      <div class="mt-2 text-2xl font-semibold">{{ value() }}</div>
      @if (hint()) { <div class="mt-1 text-xs text-muted">{{ hint() }}</div> }
    </div>
  `,
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  icon = input('info');
  hint = input<string | null>(null);
}
