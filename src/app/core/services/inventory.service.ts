// src/app/core/services/inventory.service.ts
// Five-orites Scoop — Real-Time Inventory Service

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  limit,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
  QueryConstraint,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Product, FlavorSet, SizeVariant, StockLevel, ProductFilter } from '../models/product.model';
import { LOW_STOCK_THRESHOLD } from '../config/stock.config';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private firestore = inject(Firestore);

  // ── Real-time product stream ──────────────────────────────────────────────────
  /**
   * @param includeInactive Return deactivated products too. Defaults to false,
   *   which is what the storefront wants. The admin inventory page must pass
   *   true — see getAllProducts().
   */
  getProducts(filters?: ProductFilter, maxResults = 200, includeInactive = false): Observable<Product[]> {
    return new Observable<Product[]>((observer) => {
      const productsCol = collection(this.firestore, 'products');

      // Simple query — no composite index needed.
      // The isActive filter is applied here rather than client-side on purpose:
      // a storefront query must never even fetch deactivated products.
      const constraints: QueryConstraint[] = [limit(maxResults)];
      if (!includeInactive) constraints.unshift(where('isActive', '==', true));
      const q = query(productsCol, ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          let products = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })) as Product[];

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

  /**
   * Every product, deactivated ones included.
   *
   * The admin inventory page needs this. getProducts() filters to
   * `isActive == true` in the query, so a deactivated product vanished from the
   * admin list along with its card — which made deactivation a one-way door:
   * no card meant no way to edit that flavor's stock, no Details modal, and no
   * pill to switch it back on. The Add Product modal then inherited the same
   * gap, because its variant dropdown is built from this same stream.
   */
  getAllProducts(maxResults = 200): Observable<Product[]> {
    return this.getProducts(undefined, maxResults, true);
  }

  getProductById(productId: string): Observable<Product> {
    return new Observable<Product>((observer) => {
      const productDocRef = doc(this.firestore, `products/${productId}`);

      const unsubscribe = onSnapshot(
        productDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            observer.next({ id: docSnap.id, ...docSnap.data() } as Product);
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

  subscribeToLowStock(threshold = LOW_STOCK_THRESHOLD): Observable<Product[]> {
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
  // Transactional so concurrent checkouts cannot clobber admin edits.
  async updateStock(productId: string, size: SizeVariant, newQuantity: number): Promise<void> {
    if (!Number.isInteger(newQuantity) || newQuantity < 0) throw new Error('Stock cannot be negative.');
    const productRef = doc(this.firestore, `products/${productId}`);
    await runTransaction(this.firestore, async (transaction) => {
      const snap = await transaction.get(productRef);
      if (!snap.exists()) throw new Error(`Product ${productId} not found.`);
      transaction.update(productRef, {
        [`stock.${size}`]: newQuantity,
        updatedAt: serverTimestamp(),
      });
    });
  }

  async updateProductActive(productId: string, isActive: boolean): Promise<void> {
    const productRef = doc(this.firestore, `products/${productId}`);
    await updateDoc(productRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });
  }

  // ── Replace ALL size quantities at once (Edit Details modal) ──────────────
  async updateStocks(productId: string, stock: StockLevel): Promise<void> {
    for (const size of Object.keys(stock) as SizeVariant[]) {
      const qty = stock[size];
      if (!Number.isInteger(qty) || qty < 0) throw new Error('Stock cannot be negative.');
    }
    const productRef = doc(this.firestore, `products/${productId}`);
    await updateDoc(productRef, {
      stock: { ...stock },
      updatedAt: serverTimestamp(),
    });
  }

  // ── Admin Product CRUD ────────────────────────────────────────────────────
  async createProduct(input: {
    setNumber: FlavorSet;
    setName: string;
    variantName: string;
    description: string;
    imageUrl?: string;
    pricing: { cup: number; pint: number; halfGallon: number; gallon: number };
    stock: { cup: number; pint: number; halfGallon: number; gallon: number };
  }): Promise<string> {
    if (!input.variantName.trim()) throw new Error('Variant name is required.');
    const productsCol = collection(this.firestore, 'products');
    const ref = await addDoc(productsCol, {
      setNumber: input.setNumber,
      setName: input.setName.trim(),
      variantName: input.variantName.trim(),
      description: (input.description || '').trim(),
      imageUrl: (input.imageUrl || '').trim(),
      pricing: input.pricing,
      stock: input.stock,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  async updateProductDetails(
    productId: string,
    patch: Partial<Pick<Product, 'variantName' | 'description' | 'imageUrl' | 'pricing' | 'setName' | 'setNumber'>>
  ): Promise<void> {
    const productRef = doc(this.firestore, `products/${productId}`);
    await updateDoc(productRef, { ...patch, updatedAt: serverTimestamp() });
  }

  // ── Bulk restock: add `amount` to EVERY size of EVERY active product ──────
  async bulkRestock(amount: number): Promise<number> {
    if (!Number.isInteger(amount) || amount <= 0) throw new Error('Restock amount must be a positive whole number.');
    const { getDocs } = await import('@angular/fire/firestore');
    const productsCol = collection(this.firestore, 'products');
    const snap = await getDocs(query(productsCol, where('isActive', '==', true), limit(200)));
    let updated = 0;
    for (const d of snap.docs) {
      const data = d.data() as Product;
      await updateDoc(doc(this.firestore, `products/${d.id}`), {
        'stock.cup': (data.stock?.cup ?? 0) + amount,
        'stock.pint': (data.stock?.pint ?? 0) + amount,
        'stock.halfGallon': (data.stock?.halfGallon ?? 0) + amount,
        'stock.gallon': (data.stock?.gallon ?? 0) + amount,
        updatedAt: serverTimestamp(),
      });
      updated++;
    }
    return updated;
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

  // ── Restock (e.g. order cancelled) ──────────────────────────────────────────
  async restockItems(
    items: { productId: string; size: SizeVariant; quantity: number }[]
  ): Promise<void> {
    if (items.length === 0) return;
    await runTransaction(this.firestore, async (transaction) => {
      for (const item of items) {
        const ref = doc(this.firestore, `products/${item.productId}`);
        const snap = await transaction.get(ref);
        if (!snap.exists()) continue;
        const product = { id: snap.id, ...snap.data() } as Product;
        const current = product.stock?.[item.size] ?? 0;
        transaction.update(ref, {
          [`stock.${item.size}`]: current + item.quantity,
          updatedAt: serverTimestamp(),
        });
      }
    });
  }
}
