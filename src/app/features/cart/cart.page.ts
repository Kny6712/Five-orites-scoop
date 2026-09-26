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
import { catchError, of } from 'rxjs';
import {
  trashOutline, addOutline, removeOutline, cartOutline,
  arrowForwardOutline, checkmarkCircleOutline,
} from 'ionicons/icons';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AddressService } from '../../core/services/address.service';
import { VoucherService } from '../../core/services/voucher.service';
import { InventoryService } from '../../core/services/inventory.service';
import { Cart, CartItem, getDeliveryFee, FREE_DELIVERY_THRESHOLD } from '../../core/models/cart.model';
import { SizeVariant } from '../../core/models/product.model';
import { PesoPipe } from '../../shared/pipes/peso.pipe';
import { CloudinaryPipe } from '../../shared/pipes/cloudinary.pipe';
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
    PesoPipe, CloudinaryPipe,
  ],
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
})
export class CartPage implements OnInit {
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private addressService = inject(AddressService);
  private voucherService = inject(VoucherService);
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  cart = signal<Cart>({ items: [], totalAmount: 0, itemCount: 0 });
  checkoutStep = signal<CheckoutStep>(1);
  deliveryAddress = '';
  notes = '';
  isPlacingOrder = signal(false);
  errorMessage = signal('');
  lastOrderId = signal<string | null>(null);
  savedAddresses = signal<string[]>([]);
  voucherCode = '';
  voucherDiscount = signal(0);
  appliedVoucher = signal<string | null>(null);
  voucherMessage = signal('');

  /** Live stock per `${productId}|${size}` so the stepper cannot oversell. */
  private stockMap = new Map<string, number>();

  readonly sizeLabels = SIZE_DISPLAY_LABELS;
  readonly freeDeliveryThreshold = FREE_DELIVERY_THRESHOLD;

  deliveryFee = computed(() => getDeliveryFee(this.cart().totalAmount));
  isFreeDelivery = computed(() => this.deliveryFee() === 0 && this.cart().items.length > 0);
  amountAwayFromFreeDelivery = computed(() =>
    Math.max(this.freeDeliveryThreshold - this.cart().totalAmount, 0)
  );
  grandTotal = computed(() => this.cart().totalAmount - this.voucherDiscount() + this.deliveryFee());

  constructor() {
    addIcons({
      trashOutline, addOutline, removeOutline, cartOutline,
      arrowForwardOutline, checkmarkCircleOutline,
    });

    this.cartService.cart$
      .pipe(takeUntilDestroyed())
      .subscribe((c) => {
        this.cart.set(c);
        // Re-validate voucher when cart changes.
        if (this.appliedVoucher()) {
          this.voucherService.validateVoucher(this.appliedVoucher()!, c.totalAmount)
            .then(({ discount }) => this.voucherDiscount.set(discount))
            .catch(() => {
              this.voucherDiscount.set(0);
              this.appliedVoucher.set(null);
              this.voucherMessage.set('Voucher no longer valid for this cart total.');
            });
        }
      });
    this.addressService.addresses$
      .pipe(takeUntilDestroyed())
      .subscribe((a) => this.savedAddresses.set(a));

    // Track live stock so quantity changes are capped at what's actually
    // available, instead of failing at checkout.
    this.inventoryService
      .getProducts()
      .pipe(takeUntilDestroyed(), catchError(() => of([])))
      .subscribe((products) => {
        const map = new Map<string, number>();
        for (const p of products) {
          for (const size of Object.keys(p.stock ?? {}) as SizeVariant[]) {
            map.set(`${p.id}|${size}`, p.stock[size] ?? 0);
          }
        }
        this.stockMap = map;
      });
  }

  ngOnInit(): void {}

  /** Stock available for this line, or undefined when unknown. */
  availableFor(item: CartItem): number | undefined {
    return this.stockMap.get(`${item.productId}|${item.size}`);
  }

  atStockLimit(item: CartItem): boolean {
    const available = this.availableFor(item);
    return available !== undefined && item.quantity >= available;
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.productId, item.size);
  }

  incrementQty(item: CartItem): void {
    this.cartService.updateQuantity(
      item.productId,
      item.size,
      item.quantity + 1,
      this.availableFor(item)
    );
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
    this.addressService.saveAddress(this.deliveryAddress);
    this.checkoutStep.set(2);
  }

  useSavedAddress(address: string): void {
    this.deliveryAddress = address;
  }

  async applyVoucher(): Promise<void> {
    this.voucherMessage.set('');
    try {
      const { voucher, discount } = await this.voucherService.validateVoucher(
        this.voucherCode, this.cart().totalAmount
      );
      this.appliedVoucher.set(voucher.code);
      this.voucherDiscount.set(discount);
      this.voucherMessage.set(`✅ ${voucher.code} applied — you save ₱${discount}!`);
    } catch (err) {
      this.voucherDiscount.set(0);
      this.appliedVoucher.set(null);
      this.voucherMessage.set(err instanceof Error ? err.message : 'Invalid voucher.');
    }
  }

  removeVoucher(): void {
    this.voucherCode = '';
    this.voucherDiscount.set(0);
    this.appliedVoucher.set(null);
    this.voucherMessage.set('');
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

      // Pass only the voucher CODE. OrderService re-resolves the discount from
      // Firestore so the charged amount can never be dictated by the client.
      const orderId = await this.orderService.placeOrder(
        this.deliveryAddress.trim(),
        notesValue,
        this.appliedVoucher(),
      );

      this.lastOrderId.set(orderId);
      this.notes = '';
      this.removeVoucher();
      this.checkoutStep.set(3);
      setTimeout(() => this.router.navigate(['/orders', orderId]), 4000);
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

  orderMore(): void {
    this.checkoutStep.set(1);
    this.errorMessage.set('');
    void this.router.navigate(['/products']);
  }

  viewTracker(): void {
    const id = this.lastOrderId();
    if (id) void this.router.navigate(['/orders', id]);
    else void this.router.navigate(['/orders']);
  }
}
