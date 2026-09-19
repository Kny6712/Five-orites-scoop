// src/app/core/services/order.service.ts
// Five-orites Scoop — Order Service (Fixed)

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  addDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { DELIVERY_FEE } from '../models/cart.model';
import { Order, OrderItem, OrderStatus } from '../models/order.model';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';
import { InventoryService } from './inventory.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private inventoryService = inject(InventoryService);

  async placeOrder(deliveryAddress: string, notes?: string): Promise<string> {
    const user = this.authService.currentUserSnapshot;
    if (!user) throw new Error('User must be signed in to place an order.');

    const cart = this.cartService.currentCart;
    if (cart.items.length === 0) throw new Error('Cart is empty.');

    try {
      // Step 1: Validate and decrement stock
      const stockItems = cart.items.map((i) => ({
        productId: i.productId,
        size: i.size,
        quantity: i.quantity,
      }));
      await this.inventoryService.validateAndDecrementStock(stockItems);

      // Step 2: Build order items
      const orderItems: OrderItem[] = cart.items.map((item) => ({
        productId: item.productId,
        variantName: item.variantName,
        setName: item.setName,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
      }));

      const grandTotal = cart.totalAmount + DELIVERY_FEE;

      // ── FIX: never pass undefined to Firestore ──────────────
      // notes undefined → use null instead
      const safeNotes = (notes && notes.trim().length > 0) ? notes.trim() : null;

      const orderData = {
        customerId: user.uid,
        customerEmail: user.email,
        items: orderItems,
        totalAmount: cart.totalAmount,
        deliveryFee: DELIVERY_FEE,
        grandTotal,
        status: 'pending',
        paymentStatus: 'pending',
        deliveryAddress: deliveryAddress.trim(),
        notes: safeNotes,           // ← null instead of undefined
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        statusHistory: [
          { status: 'pending', timestamp: new Date().toISOString() },
        ],
      };

      // Step 3: Create order document
      const ordersCol = collection(this.firestore, 'orders');
      const orderRef = await addDoc(ordersCol, orderData);

      // Step 4: Clear cart ONCE after successful order
      this.cartService.clearCart();

      return orderRef.id;
    } catch (err) {
      console.error('Order placement error:', err);
      throw err;
    }
  }

  getCustomerOrders(uid: string): Observable<Order[]> {
    return new Observable<Order[]>((observer) => {
      const ordersCol = collection(this.firestore, 'orders');
      const q = query(
        ordersCol,
        where('customerId', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Order[];
          observer.next(orders);
        },
        (error) => {
          console.error('Customer orders snapshot error:', error);
          observer.error(error);
        }
      );
      return () => unsubscribe();
    });
  }

  trackOrder(orderId: string): Observable<Order> {
    return new Observable<Order>((observer) => {
      const orderRef = doc(this.firestore, `orders/${orderId}`);
      const unsubscribe = onSnapshot(
        orderRef,
        (docSnap) => {
          if (docSnap.exists()) {
            observer.next({ id: docSnap.id, ...docSnap.data() } as Order);
          } else {
            observer.error(new Error(`Order ${orderId} not found.`));
          }
        },
        (error) => {
          console.error('Order tracker snapshot error:', error);
          observer.error(error);
        }
      );
      return () => unsubscribe();
    });
  }

  getAllOrders(statusFilter?: OrderStatus): Observable<Order[]> {
    return new Observable<Order[]>((observer) => {
      const ordersCol = collection(this.firestore, 'orders');
      const q = statusFilter
        ? query(ordersCol, where('status', '==', statusFilter), orderBy('createdAt', 'desc'))
        : query(ordersCol, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Order[];
          observer.next(orders);
        },
        (error) => observer.error(error)
      );
      return () => unsubscribe();
    });
  }

  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
    const orderRef = doc(this.firestore, `orders/${orderId}`);
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
  }
}
