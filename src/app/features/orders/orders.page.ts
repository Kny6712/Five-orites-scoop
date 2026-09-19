// src/app/features/orders/orders.page.ts
// Five-orites Scoop — Customer Order History Page
// Author: [Developer Placeholder]

import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton,
  IonList, IonItem, IonLabel, IonIcon, IonText,
  IonSkeletonText, IonRefresher, IonRefresherContent,
  IonNote, IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { receiptOutline, chevronForwardOutline, sadOutline } from 'ionicons/icons';
import { Subscription, catchError, of } from 'rxjs';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { Order } from '../../core/models/order.model';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge/order-status-badge.component';
import { PesoPipe } from '../../shared/pipes/peso.pipe';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonMenuButton,
    IonList, IonItem, IonLabel, IonIcon, IonText,
    IonSkeletonText, IonRefresher, IonRefresherContent,
    IonNote, IonBadge,
    OrderStatusBadgeComponent, PesoPipe,
  ],
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private sub?: Subscription;

  orders = signal<Order[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  skeletonItems = Array(5).fill(0);

  constructor() {
    addIcons({ receiptOutline, chevronForwardOutline, sadOutline });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadOrders(): void {
    const uid = this.authService.currentUserSnapshot?.uid;
    if (!uid) {
      this.router.navigate(['/auth']);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.sub?.unsubscribe();

    this.sub = this.orderService
      .getCustomerOrders(uid)
      .pipe(catchError(() => {
        this.errorMessage.set('Failed to load orders. Pull to refresh.');
        return of([]);
      }))
      .subscribe((orders) => {
        this.orders.set(orders);
        this.isLoading.set(false);
      });
  }

  handleRefresh(event: CustomEvent): void {
    this.loadOrders();
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 1000);
  }

  formatDate(timestamp: unknown): string {
    try {
      const ts = timestamp as { toDate(): Date };
      const date = ts?.toDate ? ts.toDate() : new Date(timestamp as string);
      return date.toLocaleDateString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return '—';
    }
  }

  trackOrder(_: number, order: Order): string {
    return order.id;
  }
}
