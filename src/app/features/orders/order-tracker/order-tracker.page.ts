// src/app/features/orders/order-tracker/order-tracker.page.ts
// Five-orites Scoop — Real-Time Order Status Tracker
// Author: [Developer Placeholder]

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonIcon, IonText,
  IonSkeletonText, IonChip, IonLabel, IonCard, IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  timeOutline, checkmarkCircleOutline, iceCreamOutline,
  bicycleOutline, checkmarkDoneCircleOutline, closeCircleOutline,
} from 'ionicons/icons';
import { Subscription, catchError, of } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { Order, OrderStatus, ORDER_STATUS_META } from '../../../core/models/order.model';
import { OrderStatusBadgeComponent } from '../../../shared/components/order-status-badge/order-status-badge.component';
import { PesoPipe } from '../../../shared/pipes/peso.pipe';
import { SIZE_DISPLAY_LABELS } from '../../../core/config/pricing.config';

const STATUS_SEQUENCE: OrderStatus[] = [
  'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered',
];

@Component({
  selector: 'app-order-tracker',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonBackButton,
    IonIcon, IonText, IonSkeletonText,
    IonChip, IonLabel, IonCard, IonCardContent,
    OrderStatusBadgeComponent, PesoPipe,
  ],
  templateUrl: './order-tracker.page.html',
  styleUrls: ['./order-tracker.page.scss'],
})
export class OrderTrackerPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private sub?: Subscription;

  order = signal<Order | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');

  readonly sizeLabels = SIZE_DISPLAY_LABELS;
  readonly statusSequence = STATUS_SEQUENCE;
  readonly statusMeta = ORDER_STATUS_META;

  isCancelled = computed(() => this.order()?.status === 'cancelled');

  constructor() {
    addIcons({
      timeOutline, checkmarkCircleOutline, iceCreamOutline,
      bicycleOutline, checkmarkDoneCircleOutline, closeCircleOutline,
    });
  }

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (!orderId) {
      this.errorMessage.set('Order not found.');
      this.isLoading.set(false);
      return;
    }

    this.sub = this.orderService
      .trackOrder(orderId)
      .pipe(catchError(() => {
        this.errorMessage.set('Could not load order. Please try again.');
        return of(null);
      }))
      .subscribe((order) => {
        if (order) this.order.set(order);
        this.isLoading.set(false);
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  getStepState(step: OrderStatus): 'completed' | 'active' | 'upcoming' {
    const current = this.order()?.status;
    if (!current || current === 'cancelled') return 'upcoming';
    const currentIdx = STATUS_SEQUENCE.indexOf(current);
    const stepIdx = STATUS_SEQUENCE.indexOf(step);
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'upcoming';
  }

  getStepTimestamp(step: OrderStatus): string {
    const history = this.order()?.statusHistory ?? [];
    const entry = history.find((h) => h.status === step);
    if (!entry) return '';
    try {
      const ts = entry.timestamp as { toDate(): Date };
      return ts.toDate().toLocaleTimeString('en-PH', {
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  formatDate(timestamp: unknown): string {
    try {
      const ts = timestamp as { toDate(): Date };
      return ts.toDate().toLocaleDateString('en-PH', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return '—';
    }
  }
}
