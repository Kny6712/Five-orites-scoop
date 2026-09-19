// src/app/admin/analytics/analytics.page.ts

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton,
  IonCard, IonCardContent, IonIcon, IonText,
  IonSkeletonText, IonRefresher, IonRefresherContent,
  IonChip, IonLabel,
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
    IonChip, IonLabel, PesoPipe,
  ],
  templateUrl: './analytics.page.html',
  styleUrls: ['./analytics.page.scss'],
})
export class AnalyticsPage implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private sub?: Subscription;

  orders = signal<Order[]>([]);
  isLoading = signal(true);

  activeOrders = computed(() =>
    this.orders().filter((o) => o.status !== 'cancelled')
  );

  totalRevenue = computed(() =>
    this.activeOrders().reduce((sum, o) => sum + (o.grandTotal ?? 0), 0)
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
    this.activeOrders().length > 0
      ? this.totalRevenue() / this.activeOrders().length
      : 0
  );

  topFlavors = computed<TopFlavor[]>(() => {
    const map = new Map<string, TopFlavor>();
    this.activeOrders().forEach((o) =>
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