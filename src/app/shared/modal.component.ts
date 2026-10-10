import { Component, ElementRef, OnDestroy, OnInit, inject, input, output } from '@angular/core';

/// A Material 3 dialog on larger screens and a bottom sheet on phones.
/// Put the action buttons in an element with the `actions` attribute.
@Component({
  selector: 'app-modal',
  host: { '(document:keydown.escape)': 'close.emit()' },
  template: `
    <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" [attr.aria-label]="title()">
      <div class="animate-fade absolute inset-0 bg-black/40" (click)="close.emit()"></div>
      <div
        class="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-surface-high shadow-2xl [animation:sheet-in_.3s_cubic-bezier(.2,0,0,1)] sm:max-h-[88vh] sm:rounded-[28px] sm:[animation:dialog-in_.2s_cubic-bezier(.2,0,0,1)]"
        [style.max-width.px]="width()"
      >
        <div class="mx-auto mt-3 h-1 w-8 shrink-0 rounded-full bg-on-surface-variant/40 sm:hidden"></div>
        <div class="flex shrink-0 items-start gap-3 px-6 pb-2 pt-4 sm:pt-6">
          @if (icon()) {
            <span class="material-symbols-rounded mt-0.5 text-secondary">{{ icon() }}</span>
          }
          <div class="min-w-0 flex-1">
            <h2 class="title-lg">{{ title() }}</h2>
            @if (subtitle()) { <p class="mt-1 text-sm text-on-surface-variant">{{ subtitle() }}</p> }
          </div>
          <button type="button" class="icon-btn -mr-2 -mt-1" (click)="close.emit()" aria-label="Close">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-3 sm:pb-6">
          <ng-content />
        </div>
        <div class="pb-safe shrink-0"></div>
      </div>
    </div>
  `,
})
export class ModalComponent implements OnInit, OnDestroy {
  title = input.required<string>();
  subtitle = input<string | null>(null);
  icon = input<string | null>(null);
  width = input(560);
  close = output<void>();
  private el = inject(ElementRef);

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    setTimeout(() => (this.el.nativeElement as HTMLElement).querySelector<HTMLElement>('input:not([type=checkbox]):not([disabled]),select,textarea')?.focus(), 250);
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }
}
