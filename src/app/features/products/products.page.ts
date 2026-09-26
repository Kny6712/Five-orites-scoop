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
    ProductCardComponent,
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

  readonly setChips: SetChip[] = [
    { label: 'All', value: null },
    ...Object.entries(SET_NAMES).map(([k, v]) => ({
      label: v, value: Number(k) as FlavorSet,
    })),
  ];

  filteredProducts = computed(() => {
    let products = this.allProducts();
    const q = this.searchQuery().toLowerCase();
    const set = this.selectedSet();
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
