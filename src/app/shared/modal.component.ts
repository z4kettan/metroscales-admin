import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    <div class="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-16" (click)="close.emit()">
      <div class="card w-full shadow-xl" [style.max-width.px]="width()" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 class="text-base font-semibold">{{ title() }}</h2>
          <button class="btn-ghost !p-1" (click)="close.emit()" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-5"><ng-content /></div>
      </div>
    </div>
  `,
})
export class ModalComponent {
  title = input.required<string>();
  width = input(520);
  close = output<void>();
}
