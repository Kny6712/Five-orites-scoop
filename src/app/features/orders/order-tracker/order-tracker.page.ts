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
  IonButton, AlertController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  timeOutline, checkmarkCircleOutline, iceCreamOutline,
  bicycleOutline, checkmarkDoneCircleOutline, closeCircleOutline,
} from 'ionicons/icons';
import { Subscription, catchError, of } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { NotificationService } from '../../../core/services/notification.service';
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
    IonChip, IonLabel, IonCard, IonCardContent, IonButton,
    OrderStatusBadgeComponent, PesoPipe,
  ],
  templateUrl: './order-tracker.page.html',
  styleUrls: ['./order-tracker.page.scss'],
})
export class OrderTrackerPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private notificationService = inject(NotificationService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private sub?: Subscription;
  private lastStatus: OrderStatus | null = null;

  order = signal<Order | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');
  isCancelling = signal(false);

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
        if (order) {
          if (this.lastStatus && this.lastStatus !== order.status) {
            void this.notificationService.notifyOrderStatusChange(order.id, order.status);
          }
          this.lastStatus = order.status;
          this.order.set(order);
        }
        this.isLoading.set(false);
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  canCancel(): boolean {
    return this.order()?.status === 'pending' && !this.isCancelling();
  }

  async cancelOrder(): Promise<void> {
    const order = this.order();
    if (!order || order.status !== 'pending') return;
    const alert = await this.alertCtrl.create({
      header: 'Cancel Order',
      message: 'Cancel this order? Stock will be restored.',
      inputs: [{ name: 'reason', type: 'text', placeholder: 'Reason (optional)' }],
      buttons: [
        { text: 'Back', role: 'cancel' },
        {
          text: 'Cancel Order',
          role: 'destructive',
          handler: async (data) => {
            this.isCancelling.set(true);
            try {
              await this.orderService.cancelOrder(order.id, data?.reason);
              const toast = await this.toastCtrl.create({
                message: 'Order cancelled. Stock restored.',
                color: 'warning', duration: 2500, position: 'top',
              });
              await toast.present();
            } catch (err) {
              const toast = await this.toastCtrl.create({
                message: err instanceof Error ? err.message : 'Failed to cancel order.',
                color: 'danger', duration: 3000, position: 'top',
              });
              await toast.present();
            } finally {
              this.isCancelling.set(false);
            }
          },
        },
      ],
    });
    await alert.present();
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
      const ts = entry.timestamp as unknown as { toDate(): Date } | string;
      const date = typeof ts === 'string' ? new Date(ts) : ts.toDate();
      return date.toLocaleTimeString('en-PH', {
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  formatDate(timestamp: unknown): string {
    try {
      if (timestamp === null || timestamp === undefined) return '—';
      const ts = timestamp as { toDate(): Date } | string;
      const date = typeof ts === 'string' ? new Date(ts) : ts.toDate();
      return date.toLocaleDateString('en-PH', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return '—';
    }
  }
}
