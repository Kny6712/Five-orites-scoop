// src/app/features/products/product-detail/product-detail.page.ts
// Five-orites Scoop — Product Detail Page
// Author: Five-orites Scoop team (see README)

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  IonTextarea,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cartOutline, addOutline, removeOutline, heartOutline, heart } from 'ionicons/icons';
import { Subscription, catchError, of } from 'rxjs';
import { InventoryService } from '../../../core/services/inventory.service';
import { CartService } from '../../../core/services/cart.service';
import { ReviewService } from '../../../core/services/review.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { Product, SizeVariant } from '../../../core/models/product.model';
import { PesoPipe } from '../../../shared/pipes/peso.pipe';
import { CloudinaryPipe } from '../../../shared/pipes/cloudinary.pipe';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { CartButtonComponent } from '../../../shared/components/cart-button/cart-button.component';
import { SIZE_DISPLAY_LABELS } from '../../../core/config/pricing.config';
import { LOW_STOCK_THRESHOLD } from '../../../core/config/stock.config';

interface SizeOption {
  key: SizeVariant;
  label: string;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonBackButton,
    IonButton, IonIcon, IonSkeletonText, IonBadge,
    IonChip, IonLabel, IonText, IonItem, IonNote, IonTextarea,
    PesoPipe, StarRatingComponent, CloudinaryPipe, CartButtonComponent,
  ],
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss'],
})
export class ProductDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private inventoryService = inject(InventoryService);
  private cartService = inject(CartService);
  private reviewService = inject(ReviewService);
  private wishlistService = inject(WishlistService);
  private toastCtrl = inject(ToastController);
  private sub?: Subscription;
  private reviewSub?: Subscription;

  product = signal<Product | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');
  selectedSize = signal<SizeVariant>('cup');
  quantity = signal(1);
  isAdding = signal(false);
  isWished = signal(false);
  reviews = signal<import('../../../core/models/review.model').Review[]>([]);
  avgRating = signal(0);
  reviewCount = signal(0);
  newRating = signal(5);
  newComment = '';
  isSubmittingReview = signal(false);

  readonly sizeOptions: SizeOption[] = [
    { key: 'cup', label: SIZE_DISPLAY_LABELS.cup },
    { key: 'pint', label: SIZE_DISPLAY_LABELS.pint },
    { key: 'halfGallon', label: SIZE_DISPLAY_LABELS.halfGallon },
    { key: 'gallon', label: SIZE_DISPLAY_LABELS.gallon },
  ];

  readonly lowStockThreshold = LOW_STOCK_THRESHOLD;

  currentPrice = computed(() => this.product()?.pricing[this.selectedSize()] ?? 0);
  currentStock = computed(() => this.product()?.stock[this.selectedSize()] ?? 0);
  isOutOfStock = computed(() => this.currentStock() === 0);
  lineTotal = computed(() => this.currentPrice() * this.quantity());

  constructor() {
    addIcons({ cartOutline, addOutline, removeOutline, heartOutline, heart });
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
        if (product) {
          this.product.set(product);
          this.isWished.set(this.wishlistService.isWished(product.id));
          this.loadReviews(product.id);
        }
        this.isLoading.set(false);
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.reviewSub?.unsubscribe();
  }

  loadReviews(productId: string): void {
    this.reviewSub?.unsubscribe();
    this.reviewSub = this.reviewService.getProductReviews(productId).subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.reviewCount.set(reviews.length);
        this.avgRating.set(
          reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0
        );
      },
      error: () => this.reviews.set([]),
    });
  }

  async toggleWishlist(): Promise<void> {
    const product = this.product();
    if (!product) return;
    try {
      this.isWished.set(this.wishlistService.toggle(product.id));
    } catch (err) {
      const toast = await this.toastCtrl.create({
        message: err instanceof Error ? err.message : 'Sign in to use wishlist.',
        duration: 2500, color: 'warning', position: 'bottom',
      });
      await toast.present();
    }
  }

  async submitReview(): Promise<void> {
    const product = this.product();
    if (!product || this.isSubmittingReview()) return;
    this.isSubmittingReview.set(true);
    try {
      await this.reviewService.addReview(product.id, this.newRating(), this.newComment);
      this.newComment = '';
      this.newRating.set(5);
      const toast = await this.toastCtrl.create({
        message: 'Thanks for your review! 💖', duration: 2000, color: 'success', position: 'bottom',
      });
      await toast.present();
    } catch (err) {
      const toast = await this.toastCtrl.create({
        message: err instanceof Error ? err.message : 'Could not submit review.',
        duration: 3000, color: 'warning', position: 'bottom',
      });
      await toast.present();
    } finally {
      this.isSubmittingReview.set(false);
    }
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
    if (!product || this.isOutOfStock() || this.isAdding()) return;

    this.isAdding.set(true);
    try {
      this.cartService.addItem(product, this.selectedSize(), this.quantity());
      const toast = await this.toastCtrl.create({
        message: `${product.variantName} added to your cart!`,
        duration: 2000,
        color: 'success',
        position: 'bottom',
      });
      await toast.present();
    } catch (err) {
      console.error('Add to cart error:', err);
      const toast = await this.toastCtrl.create({
        message: err instanceof Error ? err.message : 'Could not add to cart.',
        duration: 3000,
        color: 'warning',
        position: 'bottom',
      });
      await toast.present();
    } finally {
      setTimeout(() => this.isAdding.set(false), 500);
    }
  }
}
