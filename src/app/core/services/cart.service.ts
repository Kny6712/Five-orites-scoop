// src/app/core/services/cart.service.ts
// Five-orites Scoop — Cart State Management Service
// Author: [Developer Placeholder]

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Cart, CartItem, EMPTY_CART } from '../models/cart.model';
import { SizeVariant } from '../models/product.model';
import { Product } from '../models/product.model';

const CART_STORAGE_KEY = 'five_orites_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartSubject = new BehaviorSubject<Cart>(this.loadPersistedCart());
  readonly cart$: Observable<Cart> = this.cartSubject.asObservable();

  // ── Persistence ─────────────────────────────────────────────────────────────

  private loadPersistedCart(): Cart {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Cart;
        return this.recalculate(parsed.items);
      }
    } catch {
      console.warn('Failed to load persisted cart — starting fresh.');
    }
    return { ...EMPTY_CART };
  }

  private persist(cart: Cart): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      console.warn('Failed to persist cart to localStorage.');
    }
  }

  // ── Calculation ──────────────────────────────────────────────────────────────

  private recalculate(items: CartItem[]): Cart {
    const totalAmount = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return { items: [...items], totalAmount, itemCount };
  }

  private updateCart(items: CartItem[]): void {
    const cart = this.recalculate(items);
    this.cartSubject.next(cart);
    this.persist(cart);
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  addItem(product: Product, size: SizeVariant, quantity: number): void {
    const currentItems = [...this.cartSubject.getValue().items];
    const existingIndex = currentItems.findIndex(
      (i) => i.productId === product.id && i.size === size
    );

    const unitPrice = product.pricing[size];

    if (existingIndex >= 0) {
      currentItems[existingIndex] = {
        ...currentItems[existingIndex],
        quantity: currentItems[existingIndex].quantity + quantity,
      };
    } else {
      const newItem: CartItem = {
        productId: product.id,
        variantName: product.variantName,
        setName: product.setName,
        size,
        quantity,
        unitPrice,
        imageUrl: product.imageUrl,
      };
      currentItems.push(newItem);
    }

    this.updateCart(currentItems);
  }

  removeItem(productId: string, size: SizeVariant): void {
    const filtered = this.cartSubject
      .getValue()
      .items.filter((i) => !(i.productId === productId && i.size === size));
    this.updateCart(filtered);
  }

  updateQuantity(productId: string, size: SizeVariant, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId, size);
      return;
    }

    const updated = this.cartSubject.getValue().items.map((item) =>
      item.productId === productId && item.size === size
        ? { ...item, quantity }
        : item
    );
    this.updateCart(updated);
  }

  clearCart(): void {
    this.cartSubject.next({ ...EMPTY_CART });
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // noop
    }
  }

  get currentCart(): Cart {
    return this.cartSubject.getValue();
  }

  hasItem(productId: string, size: SizeVariant): boolean {
    return this.cartSubject
      .getValue()
      .items.some((i) => i.productId === productId && i.size === size);
  }
}
