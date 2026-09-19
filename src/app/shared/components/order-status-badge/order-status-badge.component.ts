// src/app/shared/components/order-status-badge/order-status-badge.component.ts
// Five-orites Scoop — Order Status Badge Component
// Author: [Developer Placeholder]

import { Component, Input } from '@angular/core';
import { IonChip, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  checkmarkCircleOutline,
  iceCreamOutline,
  bicycleOutline,
  checkmarkDoneCircleOutline,
  closeCircleOutline,
} from 'ionicons/icons';
import { OrderStatus, ORDER_STATUS_META } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-status-badge',
  standalone: true,
  imports: [IonChip, IonIcon, IonLabel],
  template: `
    <ion-chip [color]="chipColor" class="status-chip">
      <ion-icon [name]="statusMeta.icon" class="status-icon"></ion-icon>
      <ion-label>{{ statusMeta.label }}</ion-label>
    </ion-chip>
  `,
  styles: [`
    :host { display: inline-block; }
    .status-chip { font-size: 12px; font-weight: 600; }
    .status-icon { margin-right: 4px; }
  `],
})
export class OrderStatusBadgeComponent {
  @Input({ required: true }) status!: OrderStatus;

  get statusMeta() {
    return ORDER_STATUS_META[this.status];
  }

  get chipColor(): string {
    const colorMap: Record<OrderStatus, string> = {
      pending: 'warning',
      confirmed: 'primary',
      preparing: 'secondary',
      out_for_delivery: 'tertiary',
      delivered: 'success',
      cancelled: 'danger',
    };
    return colorMap[this.status];
  }

  constructor() {
    addIcons({
      timeOutline,
      checkmarkCircleOutline,
      iceCreamOutline,
      bicycleOutline,
      checkmarkDoneCircleOutline,
      closeCircleOutline,
    });
  }
}
