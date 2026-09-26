// src/app/admin/analytics/analytics.page.ts

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton,
  IonCard, IonCardContent, IonIcon, IonText,
  IonSkeletonText, IonRefresher, IonRefresherContent,
  IonChip, IonLabel, IonButton, IonSegment, IonSegmentButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cashOutline, receiptOutline, trendingUpOutline,
  iceCreamOutline, timeOutline, closeCircleOutline,
} from 'ionicons/icons';
import { Subscription, catchError, of } from 'rxjs';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';
import { PesoPipe } from '../../shared/pipes/peso.pipe';

interface TopFlavor { name: string; count: number; revenue: number; }

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonMenuButton,
    IonCard, IonCardContent, IonIcon, IonText,
    IonSkeletonText, IonRefresher, IonRefresherContent,
    IonChip, IonLabel, IonButton, IonSegment, IonSegmentButton, PesoPipe,
  ],
  templateUrl: './analytics.page.html',
  styleUrls: ['./analytics.page.scss'],
})
export class AnalyticsPage implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private sub?: Subscription;

  orders = signal<Order[]>([]);
  isLoading = signal(true);
  dateRange = signal<'all' | 'today' | '7d' | '30d'>('all');

  rangedOrders = computed(() => {
    const range = this.dateRange();
    if (range === 'all') return this.orders();
    const now = Date.now();
    const ms = range === 'today' ? 24 * 3600 * 1000 : range === '7d' ? 7 * 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000;
    return this.orders().filter((o) => {
      try {
        const ts = o.createdAt as unknown as { toDate(): Date } | string;
        const d = typeof ts === 'string' ? new Date(ts).getTime() : ts.toDate().getTime();
        return now - d <= ms;
      } catch {
        return true;
      }
    });
  });

  activeOrders = computed(() =>
    this.rangedOrders().filter((o) => o.status !== 'cancelled')
  );

  deliveredOnly = computed(() =>
    this.rangedOrders().filter((o) => o.status === 'delivered')
  );

  totalRevenue = computed(() =>
    this.deliveredOnly().reduce((sum, o) => sum + (o.grandTotal ?? 0), 0)
  );

  totalOrders = computed(() => this.orders().length);

  cancelledOrders = computed(() =>
    this.orders().filter((o) => o.status === 'cancelled').length
  );

  deliveredOrders = computed(() =>
    this.orders().filter((o) => o.status === 'delivered').length
  );

  pendingOrders = computed(() =>
    this.orders().filter((o) =>
      o.status === 'pending' ||
      o.status === 'confirmed' ||
      o.status === 'preparing' ||
      o.status === 'out_for_delivery'
    ).length
  );

  avgOrderValue = computed(() =>
    this.deliveredOnly().length > 0
      ? this.totalRevenue() / this.deliveredOnly().length
      : 0
  );

  topFlavors = computed<TopFlavor[]>(() => {
    const map = new Map<string, TopFlavor>();
    this.deliveredOnly().forEach((o) =>
      o.items?.forEach((item) => {
        const key = item.variantName;
        const existing = map.get(key) ?? { name: key, count: 0, revenue: 0 };
        map.set(key, {
          name: key,
          count: existing.count + item.quantity,
          revenue: existing.revenue + item.subtotal,
        });
      })
    );
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  });

  salesBySet = computed(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    this.deliveredOnly().forEach((o) =>
      o.items?.forEach((item) => {
        const key = item.setName || 'Unknown';
        const e = map.get(key) ?? { name: key, count: 0, revenue: 0 };
        map.set(key, { name: key, count: e.count + item.quantity, revenue: e.revenue + item.subtotal });
      })
    );
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  });

  salesBySize = computed(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    this.deliveredOnly().forEach((o) =>
      o.items?.forEach((item) => {
        const key = item.size;
        const e = map.get(key) ?? { name: key, count: 0, revenue: 0 };
        map.set(key, { name: key, count: e.count + item.quantity, revenue: e.revenue + item.subtotal });
      })
    );
    return [...map.values()].sort((a, b) => b.count - a.count);
  });

  setDateRange(range: 'all' | 'today' | '7d' | '30d'): void {
    this.dateRange.set(range);
  }

  exportCsv(): void {
    const rows = [
      ['order_id', 'date', 'status', 'items', 'subtotal', 'discount', 'delivery', 'grand_total'],
      ...this.rangedOrders().map((o) => [
        o.id,
        this.formatDateIso(o.createdAt),
        o.status,
        String(o.items?.reduce((s, i) => s + i.quantity, 0) ?? 0),
        String(o.totalAmount ?? 0),
        String(o.discountAmount ?? 0),
        String(o.deliveryFee ?? 0),
        String(o.grandTotal ?? 0),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `five-orites-sales-${this.dateRange()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  private formatDateIso(timestamp: unknown): string {
    try {
      const ts = timestamp as { toDate(): Date } | string;
      const d = typeof ts === 'string' ? new Date(ts) : ts.toDate();
      return d.toISOString();
    } catch {
      return '';
    }
  }

  constructor() {
    addIcons({
      cashOutline, receiptOutline, trendingUpOutline,
      iceCreamOutline, timeOutline, closeCircleOutline,
    });
  }

  ngOnInit(): void { this.loadData(); }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  loadData(): void {
    this.isLoading.set(true);
    this.sub?.unsubscribe();
    this.sub = this.orderService.getAllOrders()
      .pipe(catchError(() => of([])))
      .subscribe((orders) => {
        this.orders.set(orders);
        this.isLoading.set(false);
      });
  }

  handleRefresh(event: CustomEvent): void {
    this.loadData();
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 1000);
  }
}