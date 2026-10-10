import { Component, input } from '@angular/core';

type Tone = 'primary' | 'tertiary' | 'success' | 'warning';

@Component({
  selector: 'app-stat-card',
  template: `
    <div class="card h-full p-4 md:p-5">
      <div class="flex items-center gap-3">
        <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl" [class]="toneClass()">
          <span class="material-symbols-rounded">{{ icon() }}</span>
        </span>
        <span class="text-sm font-semibold text-on-surface-variant">{{ label() }}</span>
      </div>
      <div class="mt-3 truncate text-[26px] font-extrabold leading-8 tracking-tight md:text-[28px]">{{ value() }}</div>
      @if (hint()) { <div class="mt-0.5 truncate text-xs text-on-surface-variant">{{ hint() }}</div> }
    </div>
  `,
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  icon = input('info');
  hint = input<string | null>(null);
  tone = input<Tone>('primary');

  toneClass() {
    return {
      primary: 'bg-secondary-container text-on-secondary-container',
      tertiary: 'bg-tertiary-container text-on-tertiary-container',
      success: 'bg-success-container text-on-success-container',
      warning: 'bg-warning-container text-on-warning-container',
    }[this.tone()];
  }
}
