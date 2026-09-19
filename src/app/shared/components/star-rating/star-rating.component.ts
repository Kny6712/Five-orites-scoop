// src/app/shared/components/star-rating/star-rating.component.ts
// Five-orites Scoop — Interactive Star Rating Component
// Author: [Developer Placeholder]

import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { star, starOutline, starHalf } from 'ionicons/icons';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div class="stars-wrap" [attr.aria-label]="'Rating: ' + rating + ' out of 5'">
      @for (i of starIndices; track i) {
        <ion-icon
          [name]="getStarName(i)"
          class="star"
          [class.interactive]="interactive"
          [class.active]="i <= (hovered() || rating)"
          (mouseenter)="interactive && hovered.set(i)"
          (mouseleave)="interactive && hovered.set(0)"
          (click)="interactive && ratingChange.emit(i)"
          [attr.aria-label]="interactive ? 'Rate ' + i + ' star' + (i > 1 ? 's' : '') : null"
        ></ion-icon>
      }
      @if (showCount && reviewCount !== undefined) {
        <span class="review-count">({{ reviewCount }})</span>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-block; }
    .stars-wrap { display: flex; align-items: center; gap: 2px; }
    .star { font-size: 18px; color: #d0d0d0; transition: color 0.1s ease; }
    .star.active { color: var(--color-brand-accent); }
    .star.interactive { cursor: pointer; }
    .review-count { font-size: 13px; color: var(--ion-color-medium); margin-left: 4px; }
  `],
})
export class StarRatingComponent {
  @Input() rating: number = 0;
  @Input() interactive: boolean = false;
  @Input() showCount: boolean = false;
  @Input() reviewCount?: number;
  @Output() ratingChange = new EventEmitter<number>();

  hovered = signal(0);
  starIndices = [1, 2, 3, 4, 5];

  constructor() {
    addIcons({ star, starOutline, starHalf });
  }

  getStarName(index: number): string {
    const effective = this.hovered() || this.rating;
    if (index <= Math.floor(effective)) return 'star';
    if (index - 0.5 <= effective) return 'star-half';
    return 'star-outline';
  }
}
