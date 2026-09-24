// src/app/features/products/product-detail/product-detail.page.ts
// Five-orites Scoop — Product Detail Page
// Author: [Developer Placeholder]

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonSkeletonText,
  IonBadge,
  IonChip,
  IonLabel,
  IonText,
  IonItem,
  IonNote,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cartOutline, addOutline, removeOutline } from 'ionicons/icons';
import { Subscription, catchError, of } from 'rxjs';
import { InventoryService } from '../../../core/services/inventory.service';
import { CartService } from '../../../core/services/cart.service';
import { Product, SizeVariant } from '../../../core/models/product.model';
import { PesoPipe } from '../../../shared/pipes/peso.pipe';
import { StockStatusPipe } from '../../../shared/pipes/stock-status.pipe';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { SIZE_DISPLAY_LABELS } from '../../../core/config/pricing.config';

interface SizeOption {
  key: SizeVariant;
  label: string;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonBackButton,
    IonButton, IonIcon, IonSkeletonText, IonBadge,
    IonChip, IonLabel, IonText, IonItem, IonNote,
    PesoPipe, StockStatusPipe, StarRatingComponent,
  ],
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss'],
})
export class ProductDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private inventoryService = inject(InventoryService);
  private cartService = inject(CartService);
  private toastCtrl = inject(ToastController);
  private sub?: Subscription;

  product = signal<Product | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');
  selectedSize = signal<SizeVariant>('cup');
  quantity = signal(1);
  isAdding = signal(false);

  readonly sizeOptions: SizeOption[] = [
    { key: 'cup', label: SIZE_DISPLAY_LABELS.cup },
    { key: 'pint', label: SIZE_DISPLAY_LABELS.pint },
    { key: 'halfGallon', label: SIZE_DISPLAY_LABELS.halfGallon },
    { key: 'gallon', label: SIZE_DISPLAY_LABELS.gallon },
  ];

  currentPrice = computed(() => this.product()?.pricing[this.selectedSize()] ?? 0);
  currentStock = computed(() => this.product()?.stock[this.selectedSize()] ?? 0);
  isOutOfStock = computed(() => this.currentStock() === 0);
  lineTotal = computed(() => this.currentPrice() * this.quantity());

  constructor() {
    addIcons({ cartOutline, addOutline, removeOutline });
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (!productId) {
      this.errorMessage.set('Product not found.');
      this.isLoading.set(false);
      return;
    }

    this.sub = this.inventoryService
      .getProductById(productId)
      .pipe(catchError((err) => {
        this.errorMessage.set('Could not load product. Please go back and try again.');
        return of(null);
      }))
      .subscribe((product) => {
        if (product) this.product.set(product);
        this.isLoading.set(false);
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  selectSize(size: SizeVariant): void {
    this.selectedSize.set(size);
    this.quantity.set(1);
  }

  incrementQty(): void {
    const max = this.currentStock();
    if (this.quantity() < max) this.quantity.update((q) => q + 1);
  }

  decrementQty(): void {
    if (this.quantity() > 1) this.quantity.update((q) => q - 1);
  }

  async addToCart(): Promise<void> {
    const product = this.product();
    if (!product || this.isAdding()) return;

    this.isAdding.set(true);
    try {
      const added = this.cartService.addItem(product, this.selectedSize(), this.quantity());
      if (!added) {
        const toast = await this.toastCtrl.create({
          message: 'This size is out of stock or the requested quantity is unavailable.',
          duration: 2500,
          color: 'danger',
          position: 'bottom',
        });
        await toast.present();
        return;
      }

      const toast = await this.toastCtrl.create({
        message: `${product.variantName} added to your cart!`,
        duration: 2000,
        color: 'success',
        position: 'bottom',
      });
      await toast.present();
    } catch (err) {
      console.error('Add to cart error:', err);
    } finally {
      setTimeout(() => this.isAdding.set(false), 500);
    }
  }
}
