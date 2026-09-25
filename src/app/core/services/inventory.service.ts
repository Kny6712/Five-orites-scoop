// src/app/core/services/inventory.service.ts
// Five-orites Scoop — Real-Time Inventory Service

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  runTransaction,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Product, FlavorSet, SizeVariant, ProductFilter } from '../models/product.model';
import { getProductImageUrl } from '../config/product-images.config';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private firestore = inject(Firestore);

  // ── Real-time product stream ──────────────────────────────────────────────────
  getProducts(filters?: ProductFilter): Observable<Product[]> {
    return new Observable<Product[]>((observer) => {
      const productsCol = collection(this.firestore, 'products');

      // Simple query — no composite index needed
      const q = query(productsCol, where('isActive', '==', true));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          let products = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as Product;
            return {
              ...data,
              id: docSnap.id,
              imageUrl: getProductImageUrl(data.variantName, data.imageUrl),
            };
          });

          // Sort client-side to avoid needing Firestore composite indexes
          products.sort((a, b) => {
            if (a.setNumber !== b.setNumber) return a.setNumber - b.setNumber;
            return a.variantName.localeCompare(b.variantName);
          });

          // Client-side filters
          if (filters?.setNumber) {
            products = products.filter((p) => p.setNumber === filters.setNumber);
          }
          if (filters?.searchQuery) {
            const search = filters.searchQuery.toLowerCase();
            products = products.filter(
              (p) =>
                p.variantName.toLowerCase().includes(search) ||
                p.setName.toLowerCase().includes(search)
            );
          }
          if (filters?.inStockOnly && filters?.size) {
            products = products.filter((p) => p.stock[filters.size!] > 0);
          }

          observer.next(products);
        },
        (error) => {
          console.error('Inventory snapshot error:', error);
          observer.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  getProductsBySet(setNumber: FlavorSet): Observable<Product[]> {
    return this.getProducts({ setNumber });
  }

  getProductById(productId: string): Observable<Product> {
    return new Observable<Product>((observer) => {
      const productDocRef = doc(this.firestore, `products/${productId}`);

      const unsubscribe = onSnapshot(
        productDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Product;
            observer.next({
              ...data,
              id: docSnap.id,
              imageUrl: getProductImageUrl(data.variantName, data.imageUrl),
            });
          } else {
            observer.error(new Error(`Product ${productId} not found`));
          }
        },
        (error) => {
          console.error('Product snapshot error:', error);
          observer.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  subscribeToLowStock(threshold = 10): Observable<Product[]> {
    return new Observable<Product[]>((observer) => {
      const productsCol = collection(this.firestore, 'products');
      const q = query(productsCol, where('isActive', '==', true));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const lowStock = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Product)
            .filter(
              (p) =>
                p.stock.cup < threshold ||
                p.stock.pint < threshold ||
                p.stock.halfGallon < threshold ||
                p.stock.gallon < threshold
            );
          observer.next(lowStock);
        },
        (error) => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  // ── Admin Stock Update ────────────────────────────────────────────────────────
  async updateStock(productId: string, size: SizeVariant, newQuantity: number): Promise<void> {
    if (newQuantity < 0) throw new Error('Stock cannot be negative.');
    const productRef = doc(this.firestore, `products/${productId}`);
    await updateDoc(productRef, {
      [`stock.${size}`]: newQuantity,
      updatedAt: serverTimestamp(),
    });
  }

  async updateProductActive(productId: string, isActive: boolean): Promise<void> {
    const productRef = doc(this.firestore, `products/${productId}`);
    await updateDoc(productRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });
  }

  // ── Firestore Transaction: Stock Validation ────────────────────────────────────
  async validateAndDecrementStock(
    items: { productId: string; size: SizeVariant; quantity: number }[]
  ): Promise<void> {
    await runTransaction(this.firestore, async (transaction) => {
      const stockChecks: {
        ref: ReturnType<typeof doc>;
        data: Product;
        size: SizeVariant;
        quantity: number;
      }[] = [];

      for (const item of items) {
        const ref = doc(this.firestore, `products/${item.productId}`);
        const snap = await transaction.get(ref);
        if (!snap.exists()) {
          throw new Error(`Product ${item.productId} no longer exists.`);
        }
        const product = { id: snap.id, ...snap.data() } as Product;
        const availableStock = product.stock[item.size];
        if (availableStock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.variantName} (${item.size}). Available: ${availableStock}`
          );
        }
        stockChecks.push({ ref, data: product, size: item.size, quantity: item.quantity });
      }

      for (const check of stockChecks) {
        const newStock = check.data.stock[check.size] - check.quantity;
        transaction.update(check.ref, {
          [`stock.${check.size}`]: newStock,
          updatedAt: serverTimestamp(),
        });
      }
    });
  }
}
