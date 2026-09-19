// src/app/app.component.ts
// Five-orites Scoop — Root App Shell with ion-split-pane + ion-menu
// Author: [Developer Placeholder]

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonBadge,
  IonAvatar,
  IonButton,
  IonRouterOutlet,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonNote,
  MenuController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  iceCreamOutline,
  cartOutline,
  receiptOutline,
  layersOutline,
  clipboardOutline,
  barChartOutline,
  informationCircleOutline,
  peopleOutline,
  logOutOutline,
  personCircleOutline,
} from 'ionicons/icons';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface NavItem {
  title: string;
  url: string;
  icon: string;
  role: 'all' | 'customer' | 'admin';
  badge?: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle,
    IonBadge,
    IonAvatar,
    IonButton,
    IonRouterOutlet,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonNote,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private menuCtrl = inject(MenuController);

  currentUser = signal<import('./core/models/user.model').AppUser | null>(null);
  cartItemCount = signal(0);

  readonly customerNavItems: NavItem[] = [
    { title: 'Dashboard', url: '/dashboard', icon: 'home-outline', role: 'all' },
    { title: 'Our Flavors', url: '/products', icon: 'ice-cream-outline', role: 'all' },
    { title: 'My Cart', url: '/cart', icon: 'cart-outline', role: 'customer', badge: true },
    { title: 'My Orders', url: '/orders', icon: 'receipt-outline', role: 'customer' },
    { title: 'About', url: '/about', icon: 'information-circle-outline', role: 'all' },
    { title: 'Developers', url: '/developers', icon: 'people-outline', role: 'all' },
  ];

  readonly adminNavItems: NavItem[] = [
    { title: 'Inventory', url: '/admin/inventory', icon: 'layers-outline', role: 'admin' },
    { title: 'Fulfillment', url: '/admin/orders', icon: 'clipboard-outline', role: 'admin' },
    { title: 'Analytics', url: '/admin/analytics', icon: 'bar-chart-outline', role: 'admin' },
  ];

  isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor() {
    addIcons({
      homeOutline,
      iceCreamOutline,
      cartOutline,
      receiptOutline,
      layersOutline,
      clipboardOutline,
      barChartOutline,
      informationCircleOutline,
      peopleOutline,
      logOutOutline,
      personCircleOutline,
    });

    this.authService.currentUser$
      .pipe(takeUntilDestroyed())
      .subscribe((user) => this.currentUser.set(user));

    this.cartService.cart$
      .pipe(takeUntilDestroyed())
      .subscribe((cart) => this.cartItemCount.set(cart.itemCount));
  }

  ngOnInit(): void {}

  getUserInitials(): string {
    const name = this.currentUser()?.displayName ?? '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  async logout(): Promise<void> {
    try {
      await this.authService.signOut();
      await this.menuCtrl.close();
      await this.router.navigate(['/auth']);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }
}
