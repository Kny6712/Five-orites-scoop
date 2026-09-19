// src/app/features/dashboard/dashboard.page.ts
// Five-orites Scoop — Role-Aware Dashboard Hub
// Author: [Developer Placeholder]

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton,
  IonGrid, IonRow, IonCol,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonButton, IonIcon, IonText, IonSkeletonText,
  IonChip, IonLabel, IonBadge, IonRefresher, IonRefresherContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cashOutline, timeOutline, alertCircleOutline, receiptOutline,
  iceCreamOutline, cartOutline, layersOutline, clipboardOutline,
  refreshOutline, notificationsOutline,
} from 'ionicons/icons';
import { Subscription, combineLatest, catchError, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { InventoryService } from '../../core/services/inventory.service';
import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { Product } from '../../core/models/product.model';
import { Order } from '../../core/models/order.model';
import { AppUser } from '../../core/models/user.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge/order-status-badge.component';
import { PesoPipe } from '../../shared/pipes/peso.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonMenuButton,
    IonGrid, IonRow, IonCol,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonButton, IonIcon, IonText, IonSkeletonText,
    IonChip, IonLabel, IonBadge,
    IonRefresher, IonRefresherContent,
    ProductCardComponent, OrderStatusBadgeComponent, PesoPipe,
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private inventoryService = inject(InventoryService);
  private orderService = inject(OrderService);
  private cartService = inject(CartService);
  private notifService = inject(NotificationService);
  private router = inject(Router);
  private subs: Subscription[] = [];

  currentUser = signal<AppUser | null>(null);
  isAdmin = computed(() => this.currentUser()?.role === 'admin');
  isLoading = signal(true);

  // Customer data
  featuredProducts = signal<Product[]>([]);
  recentOrders = signal<Order[]>([]);
  cartItemCount = signal(0);

  // Admin KPIs
  todayRevenue = signal(0);
  pendingOrderCount = signal(0);
  lowStockCount = signal(0);
  totalOrderCount = signal(0);
  adminRecentOrders = signal<Order[]>([]);
  lowStockProducts = signal<Product[]>([]);

  constructor() {
    addIcons({
      cashOutline, timeOutline, alertCircleOutline, receiptOutline,
      iceCreamOutline, cartOutline, layersOutline, clipboardOutline,
      refreshOutline, notificationsOutline,
    });

    this.authService.currentUser$
      .pipe(takeUntilDestroyed())
      .subscribe((user) => this.currentUser.set(user));

    this.cartService.cart$
      .pipe(takeUntilDestroyed())
      .subscribe((c) => this.cartItemCount.set(c.itemCount));
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];

    if (this.isAdmin()) {
      this.loadAdminDashboard();
    } else {
      this.loadCustomerDashboard();
    }
  }

  private loadCustomerDashboard(): void {
    // Featured products — random 4 from catalog
    const s1 = this.inventoryService
      .getProducts()
      .pipe(catchError(() => of([])))
      .subscribe((products) => {
        const shuffled = [...products].sort(() => Math.random() - 0.5);
        this.featuredProducts.set(shuffled.slice(0, 4));
        this.isLoading.set(false);
      });
    this.subs.push(s1);

    // Recent orders
    const uid = this.currentUser()?.uid;
    if (uid) {
      const s2 = this.orderService
        .getCustomerOrders(uid)
        .pipe(catchError(() => of([])))
        .subscribe((orders) => this.recentOrders.set(orders.slice(0, 3)));
      this.subs.push(s2);
    }
  }

  private loadAdminDashboard(): void {
    // All orders for KPIs
    const s1 = this.orderService
      .getAllOrders()
      .pipe(catchError(() => of([])))
      .subscribe((orders) => {
        this.totalOrderCount.set(orders.length);
        this.pendingOrderCount.set(
          orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length
        );

        // Today's revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter((o) => {
          try {
            const ts = o.createdAt as { toDate(): Date };
            return ts.toDate() >= today && o.paymentStatus === 'paid';
          } catch { return false; }
        });
        this.todayRevenue.set(todayOrders.reduce((sum, o) => sum + (o.grandTotal ?? 0), 0));

        this.adminRecentOrders.set(orders.slice(0, 10));
        this.isLoading.set(false);
      });
    this.subs.push(s1);

    // Low stock
    const s2 = this.inventoryService
      .subscribeToLowStock()
      .pipe(catchError(() => of([])))
      .subscribe((products) => {
        this.lowStockProducts.set(products.slice(0, 5));
        this.lowStockCount.set(products.length);
      });
    this.subs.push(s2);
  }

  async requestNotifications(): Promise<void> {
    const granted = await this.notifService.requestPermission();
    if (granted) {
      await this.notifService.showToast('Notifications enabled! 🔔', 'success');
    } else {
      await this.notifService.showToast('Notification permission denied.', 'warning');
    }
  }

  handleRefresh(event: CustomEvent): void {
    this.loadDashboard();
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 1200);
  }

  formatDate(timestamp: unknown): string {
    try {
      const ts = timestamp as { toDate(): Date };
      return ts.toDate().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return '—'; }
  }

  trackProduct(_: number, p: Product): string { return p.id; }
  trackOrder(_: number, o: Order): string { return o.id; }
}
