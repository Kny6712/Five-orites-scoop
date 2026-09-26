// src/app/app.component.ts
// Five-orites Scoop — Root App Shell with ion-split-pane + ion-menu
// Author: Five-orites Scoop team (see README)

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
  IonAvatar,
  IonButton,
  IonRouterOutlet,
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
    IonAvatar,
    IonButton,
    IonRouterOutlet,
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

  /**
   * Nav items the current user may actually see.
   *
   * `role` used to be declared on NavItem but never read, so signed-out guests
   * were shown "My Cart" / "My Orders" and got redirected to /auth on tap.
   *
   * Admins also get the customer items. They are signed in, the cart and orders
   * routes are behind authGuard only, and an admin has to be able to walk the
   * buying flow to check a price or photo edit they just made. Guests still see
   * neither, which is the case that bug was actually about.
   */
  visibleCustomerNavItems = computed(() => {
    const user = this.currentUser();
    const role = user?.role ?? 'guest';
    return this.customerNavItems.filter(
      (item) =>
        item.role === 'all' ||
        item.role === role ||
        (role === 'admin' && item.role === 'customer')
    );
  });

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
    });

    this.authService.currentUser$
      .pipe(takeUntilDestroyed())
      .subscribe((user) => this.currentUser.set(user));

    this.cartService.cart$
      .pipe(takeUntilDestroyed())
      .subscribe((cart) => this.cartItemCount.set(cart.itemCount));
  }

  ngOnInit(): void {}

  /**
   * Accessible name for a nav row.
   *
   * The count bubble is `aria-hidden` decoration now that it overlaps the icon
   * instead of sitting in the end slot, so the item count would otherwise drop
   * out of the accessible name entirely. Folding it in here keeps "My Cart, 2
   * items" as one announcement rather than a bare "My Cart".
   */
  navItemLabel(item: NavItem): string {
    const n = this.cartItemCount();
    if (!item.badge || n <= 0) return item.title;
    return `${item.title}, ${n} item${n === 1 ? '' : 's'}`;
  }

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
