// src/app/features/products/products.page.ts

import {
  Component, OnInit, OnDestroy, inject, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonSearchbar, IonChip, IonLabel, IonGrid, IonRow, IonCol,
  IonSkeletonText, IonCard, IonCardContent, IonText, IonIcon,
  IonRefresher, IonRefresherContent,
  IonButtons, IonMenuButton, IonToggle, IonItem,
  IonInfiniteScroll, IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sadOutline, iceCreamOutline, filterOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { catchError, of } from 'rxjs';
import { InventoryService } from '../../core/services/inventory.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { Product, FlavorSet } from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { CartButtonComponent } from '../../shared/components/cart-button/cart-button.component';
import { SET_NAMES } from '../../core/config/pricing.config';

interface SetChip { label: string; value: FlavorSet | null; }

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonSearchbar, IonChip, IonLabel, IonGrid, IonRow, IonCol,
    IonSkeletonText, IonCard, IonCardContent, IonText, IonIcon,
    IonRefresher, IonRefresherContent,
    IonButtons, IonMenuButton, IonToggle, IonItem,
    IonInfiniteScroll, IonInfiniteScrollContent,
    ProductCardComponent, CartButtonComponent,
  ],
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit, OnDestroy {
  private inventoryService = inject(InventoryService);
  private wishlistService = inject(WishlistService);
  private sub?: Subscription;
  private wishlistSub?: Subscription;

  allProducts = signal<Product[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  searchQuery = signal('');
  selectedSet = signal<FlavorSet | null>(null);
  inStockOnly = signal(false);
  wishlistOnly = signal(false);
  wishlistIds = signal<string[]>([]);
  PAGE_SIZE = 20;
  displayedCount = signal(this.PAGE_SIZE);

  /**
   * Set filter chips, derived from the catalog this page actually loaded.
   *
   * This used to be a hand-written list built from SET_NAMES, which only ever
   * held the 8 seeded sets. A set created later saved to Firestore correctly
   * and appeared under "All", but had no chip to filter to — the row could only
   * grow by editing source and redeploying. Deriving it from allProducts() means
   * the chips can never drift from what is on screen.
   *
   * SET_NAMES survives only as a fallback label for a product with a blank
   * setName; the set list itself is no longer taken from it.
   */
  readonly setChips = computed<SetChip[]>(() => {
    const labelByNumber = new Map<number, string>();
    for (const p of this.allProducts()) {
      if (labelByNumber.has(p.setNumber)) continue;
      labelByNumber.set(
        p.setNumber,
        p.setName?.trim() || SET_NAMES[p.setNumber] || `Set ${p.setNumber}`
      );
    }
    return [
      { label: 'All', value: null },
      ...[...labelByNumber.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([value, label]) => ({ label, value: value as FlavorSet })),
    ];
  });

  /**
   * The set actually being filtered by, or null for "All".
   *
   * Now that the chips are derived, a set can stop existing while it is
   * selected — deactivating its last product removes its chip. Falling back to
   * "All" keeps the grid populated instead of stranding the user on a blank page
   * with no button highlighted and no obvious way back. Both the grid and the
   * chip highlight read this, so the two can never disagree.
   */
  readonly effectiveSet = computed<FlavorSet | null>(() => {
    const set = this.selectedSet();
    if (set === null) return null;
    return this.setChips().some((c) => c.value === set) ? set : null;
  });

  filteredProducts = computed(() => {
    let products = this.allProducts();
    const q = this.searchQuery().toLowerCase();
    const set = this.effectiveSet();
    if (set !== null) products = products.filter((p) => p.setNumber === set);
    if (q) products = products.filter(
      (p) => p.variantName.toLowerCase().includes(q) || p.setName.toLowerCase().includes(q)
    );
    if (this.inStockOnly()) products = products.filter(
      (p) => p.stock.cup > 0 || p.stock.pint > 0 || p.stock.halfGallon > 0 || p.stock.gallon > 0
    );
    if (this.wishlistOnly()) {
      const ids = new Set(this.wishlistIds());
      products = products.filter((p) => ids.has(p.id));
    }
    return products;
  });

  displayedProducts = computed(() =>
    this.filteredProducts().slice(0, this.displayedCount())
  );

  skeletonItems = Array(8).fill(0);

  constructor() {
    addIcons({ sadOutline, iceCreamOutline, filterOutline });
  }

  ngOnInit(): void { this.loadProducts(); this.wishlistSub = this.wishlistService.wishlist$.subscribe((ids) => this.wishlistIds.set(ids)); }
  ngOnDestroy(): void { this.sub?.unsubscribe(); this.wishlistSub?.unsubscribe(); }

  loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.sub?.unsubscribe();
    this.sub = this.inventoryService.getProducts()
      .pipe(catchError(() => {
        this.errorMessage.set('Failed to load products. Pull to refresh.');
        return of([]);
      }))
      .subscribe((products) => {
        this.allProducts.set(products);
        this.isLoading.set(false);
      });
  }

  onSearch(event: CustomEvent): void {
    this.searchQuery.set(event.detail.value ?? '');
    this.displayedCount.set(this.PAGE_SIZE);
  }

  selectSet(value: FlavorSet | null): void {
    this.selectedSet.set(value);
    this.displayedCount.set(this.PAGE_SIZE);
  }

  onInStockToggle(event: CustomEvent): void {
    this.inStockOnly.set(event.detail.checked);
  }

  onWishlistToggle(event: CustomEvent): void {
    this.wishlistOnly.set(event.detail.checked);
    this.displayedCount.set(this.PAGE_SIZE);
  }

  handleRefresh(event: CustomEvent): void {
    this.loadProducts();
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 1000);
  }

  loadMore(event: CustomEvent): void {
    setTimeout(() => {
      this.displayedCount.update((n) => n + this.PAGE_SIZE);
      (event.target as HTMLIonInfiniteScrollElement).complete();
    }, 500);
  }

  trackProduct(_: number, p: Product): string { return p.id; }
}
