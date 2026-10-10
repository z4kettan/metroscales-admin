import { Component, input } from '@angular/core';

/// Large page title. Buttons passed as content show on tablets and desktops;
/// phones use a floating action button instead (see FabComponent).
@Component({
  selector: 'app-page-header',
  template: `
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4 md:mb-7">
      <div class="min-w-0">
        @if (eyebrow()) { <div class="label-sm mb-1 uppercase text-primary">{{ eyebrow() }}</div> }
        <h1 class="headline">{{ title() }}</h1>
        @if (subtitle()) { <p class="mt-1 text-[15px] text-on-surface-variant">{{ subtitle() }}</p> }
      </div>
      <div class="hidden items-center gap-2 md:flex"><ng-content /></div>
    </div>
  `,
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string | null>(null);
  eyebrow = input<string | null>(null);
}
