// src/app/shared/components/product-card/product-card.component.ts
// Fixed double-add bug with isAdding lock

import {
  Component, Input, Output, EventEmitter,
  signal, computed, OnInit, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonCard, IonCardContent, IonButton, IonIcon,
  IonSkeletonText, IonChip, IonLabel, IonSegment, IonSegmentButton,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cartOutline, addOutline } from 'ionicons/icons';
import { Product, SizeVariant } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { PesoPipe } from '../../pipes/peso.pipe';
import { SIZE_DISPLAY_LABELS } from '../../../core/config/pricing.config';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonCard, IonCardContent, IonButton, IonIcon,
    IonSkeletonText, IonChip, IonLabel, IonSegment, IonSegmentButton,
    PesoPipe,
  ],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent implements OnInit {
  @Input({ required: true }) product!: Product;
  @Output() addedToCart = new EventEmitter<void>();

  private cartService = inject(CartService);
  private toastCtrl = inject(ToastController);

  selectedSize = signal<SizeVariant>('cup');
  imageLoaded = signal(false);
  isAdding = signal(false); // ← lock prevents double-add

  sizeLabels = SIZE_DISPLAY_LABELS;
  sizes: SizeVariant[] = ['cup', 'pint', 'halfGallon', 'gallon'];

  currentPrice = computed(() => this.product.pricing[this.selectedSize()]);
  currentStock = computed(() => this.product.stock?.[this.selectedSize()] ?? 0);
  isOutOfStock = computed(() => this.currentStock() === 0);

  constructor() {
    addIcons({ cartOutline, addOutline });
  }

  ngOnInit(): void {}

  onSizeChange(event: CustomEvent): void {
    this.selectedSize.set(event.detail.value as SizeVariant);
  }

  onImageLoad(): void {
    this.imageLoaded.set(true);
  }

  async addToCart(): Promise<void> {
    // Guard: if already adding, do nothing (prevents double-tap)
    if (this.isOutOfStock() || this.isAdding()) return;

    this.isAdding.set(true);
    try {
      this.cartService.addItem(this.product, this.selectedSize(), 1);
      this.addedToCart.emit();

      const toast = await this.toastCtrl.create({
        message: `${this.product.variantName} added to cart! 🍦`,
        duration: 2000,
        color: 'success',
        position: 'bottom',
      });
      await toast.present();
    } catch (err) {
      console.error('Add to cart error:', err);
    } finally {
      // Reset lock after 800ms to prevent rapid double-tap
      setTimeout(() => this.isAdding.set(false), 800);
    }
  }
}
