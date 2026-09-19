// src/app/features/cart/cart.page.ts
// Five-orites Scoop — Cart & Checkout (Fixed double-decrement bug)

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton,
  IonButton, IonIcon, IonText,
  IonTextarea, IonSpinner,
  AlertController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trashOutline, addOutline, removeOutline, cartOutline,
  arrowForwardOutline, checkmarkCircleOutline,
} from 'ionicons/icons';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { Cart, CartItem, DELIVERY_FEE } from '../../core/models/cart.model';
import { PesoPipe } from '../../shared/pipes/peso.pipe';
import { SIZE_DISPLAY_LABELS } from '../../core/config/pricing.config';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type CheckoutStep = 1 | 2 | 3;

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonMenuButton,
    IonButton, IonIcon, IonText,
    IonTextarea, IonSpinner,
    PesoPipe,
  ],
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
})
export class CartPage implements OnInit {
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  cart = signal<Cart>({ items: [], totalAmount: 0, itemCount: 0 });
  checkoutStep = signal<CheckoutStep>(1);
  deliveryAddress = '';
  notes = '';
  isPlacingOrder = signal(false);
  errorMessage = signal('');

  readonly deliveryFee = DELIVERY_FEE;
  readonly sizeLabels = SIZE_DISPLAY_LABELS;

  grandTotal = computed(() => this.cart().totalAmount + this.deliveryFee);

  constructor() {
    addIcons({
      trashOutline, addOutline, removeOutline, cartOutline,
      arrowForwardOutline, checkmarkCircleOutline,
    });

    this.cartService.cart$
      .pipe(takeUntilDestroyed())
      .subscribe((c) => this.cart.set(c));
  }

  ngOnInit(): void {}

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.productId, item.size);
  }

  incrementQty(item: CartItem): void {
    this.cartService.updateQuantity(item.productId, item.size, item.quantity + 1);
  }

  decrementQty(item: CartItem): void {
    this.cartService.updateQuantity(item.productId, item.size, item.quantity - 1);
  }

  async clearCart(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Clear Cart',
      message: 'Remove all items from your cart?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Clear', role: 'destructive', handler: () => this.cartService.clearCart() },
      ],
    });
    await alert.present();
  }

  // Step 1 → Step 2: Validate address then show review
  proceedToReview(): void {
    if (!this.deliveryAddress.trim()) {
      this.errorMessage.set('Please enter your delivery address.');
      return;
    }
    this.errorMessage.set('');
    this.checkoutStep.set(2);
  }

  backToCart(): void {
    this.checkoutStep.set(1);
    this.errorMessage.set('');
  }

  // Step 2 → Place Order (called ONCE only from the Review screen)
  async placeOrder(): Promise<void> {
    if (this.isPlacingOrder()) return; // ← prevents double-tap double-call
    this.isPlacingOrder.set(true);
    this.errorMessage.set('');

    try {
      // Pass null for empty notes — never undefined
      const notesValue = this.notes.trim().length > 0 ? this.notes.trim() : undefined;

      const orderId = await this.orderService.placeOrder(
        this.deliveryAddress.trim(),
        notesValue,
      );

      this.checkoutStep.set(3);
      setTimeout(() => this.router.navigate(['/orders', orderId]), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to place order. Please try again.';
      this.errorMessage.set(message);
      const toast = await this.toastCtrl.create({
        message,
        color: 'danger',
        duration: 4000,
        position: 'top',
      });
      await toast.present();
    } finally {
      this.isPlacingOrder.set(false);
    }
  }

  trackItem(_: number, item: CartItem): string {
    return `${item.productId}-${item.size}`;
  }
}
