// src/app/admin/orders/admin-orders.page.ts
// Five-orites Scoop — Admin Order Fulfillment Dashboard
// Author: [Developer Placeholder]

import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton,
  IonSegment, IonSegmentButton, IonLabel,
  IonCard, IonCardContent, IonIcon, IonButton, IonText,
  IonSkeletonText, IonRefresher, IonRefresherContent,
  IonChip, IonBadge, AlertController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkOutline, arrowForwardOutline, closeOutline,
  receiptOutline, timeOutline,
} from 'ionicons/icons';
import { Subscription, catchError, of } from 'rxjs';
import { OrderService } from '../../core/services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { Order, OrderStatus, ORDER_STATUS_META } from '../../core/models/order.model';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge/order-status-badge.component';
import { PesoPipe } from '../../shared/pipes/peso.pipe';
import { SIZE_DISPLAY_LABELS } from '../../core/config/pricing.config';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonMenuButton,
    IonSegment, IonSegmentButton, IonLabel,
    IonCard, IonCardContent, IonIcon, IonButton, IonText,
    IonSkeletonText, IonRefresher, IonRefresherContent,
    IonChip, IonBadge,
    OrderStatusBadgeComponent, PesoPipe,
  ],
  templateUrl: './admin-orders.page.html',
  styleUrls: ['./admin-orders.page.scss'],
})
export class AdminOrdersPage implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private notificationService = inject(NotificationService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private sub?: Subscription;

  allOrders = signal<Order[]>([]);
  selectedFilter = signal<OrderStatus | 'all'>('all');
  isLoading = signal(true);
  updatingId = signal<string | null>(null);
  expandedId = signal<string | null>(null);

  readonly sizeLabels = SIZE_DISPLAY_LABELS;
  readonly statusMeta = ORDER_STATUS_META;
  readonly nextStatus = NEXT_STATUS;

  readonly filterOptions: { label: string; value: OrderStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Preparing', value: 'preparing' },
    { label: 'Delivery', value: 'out_for_delivery' },
    { label: 'Done', value: 'delivered' },
  ];

  filteredOrders = () => {
    const filter = this.selectedFilter();
    if (filter === 'all') return this.allOrders();
    return this.allOrders().filter((o) => o.status === filter);
  };

  skeletonItems = Array(5).fill(0);

  constructor() {
    addIcons({ checkmarkOutline, arrowForwardOutline, closeOutline, receiptOutline, timeOutline });
  }

  ngOnInit(): void { this.loadOrders(); }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  loadOrders(): void {
    this.isLoading.set(true);
    this.sub?.unsubscribe();
    this.sub = this.orderService.getAllOrders()
      .pipe(catchError(() => of([])))
      .subscribe((orders) => {
        this.allOrders.set(orders);
        this.isLoading.set(false);
      });
  }

  onFilterChange(event: CustomEvent): void {
    this.selectedFilter.set(event.detail.value);
    this.expandedId.set(null);
  }

  toggleExpand(orderId: string): void {
    this.expandedId.set(this.expandedId() === orderId ? null : orderId);
  }

  getNextStatusLabel(status: OrderStatus): string {
    const next = NEXT_STATUS[status];
    return next ? ORDER_STATUS_META[next].label : '';
  }

  async advanceStatus(order: Order): Promise<void> {
    const next = NEXT_STATUS[order.status];
    if (!next) return;

    const alert = await this.alertCtrl.create({
      header: 'Advance Order',
      message: `Mark order #${order.id.slice(-6).toUpperCase()} as "${ORDER_STATUS_META[next].label}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm',
          handler: async () => {
            this.updatingId.set(order.id);
            try {
              await this.orderService.updateOrderStatus(order.id, next);
              await this.notificationService.notifyOrderStatusChange(order.id, next);
              const toast = await this.toastCtrl.create({
                message: `Order updated to "${ORDER_STATUS_META[next].label}"`,
                color: 'success', duration: 2000, position: 'top',
              });
              await toast.present();
            } catch {
              const toast = await this.toastCtrl.create({
                message: 'Failed to update order status.',
                color: 'danger', duration: 3000, position: 'top',
              });
              await toast.present();
            } finally {
              this.updatingId.set(null);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async cancelOrder(order: Order): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cancel Order',
      message: `Cancel order #${order.id.slice(-6).toUpperCase()}? Stock will be restored.`,
      inputs: [{ name: 'reason', type: 'text', placeholder: 'Reason (optional)' }],
      buttons: [
        { text: 'Back', role: 'cancel' },
        {
          text: 'Cancel Order',
          role: 'destructive',
          handler: async (data) => {
            this.updatingId.set(order.id);
            try {
              await this.orderService.cancelOrder(order.id, data?.reason);
              await this.notificationService.notifyOrderStatusChange(order.id, 'cancelled');
              const toast = await this.toastCtrl.create({
                message: 'Order cancelled and stock restored.',
                color: 'warning', duration: 2500, position: 'top',
              });
              await toast.present();
            } catch (err: unknown) {
              const toast = await this.toastCtrl.create({
                message: err instanceof Error ? err.message : 'Failed to cancel order.',
                color: 'danger', duration: 3000, position: 'top',
              });
              await toast.present();
            } finally {
              this.updatingId.set(null);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  handleRefresh(event: CustomEvent): void {
    this.loadOrders();
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 1000);
  }

  formatDate(timestamp: unknown): string {
    try {
      if (timestamp === null || timestamp === undefined) return '—';
      const ts = timestamp as { toDate(): Date } | string;
      const date = typeof ts === 'string' ? new Date(ts) : ts.toDate();
      return date.toLocaleDateString('en-PH', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return '—'; }
  }

  trackOrder(_: number, o: Order): string { return o.id; }
}
