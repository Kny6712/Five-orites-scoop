// src/app/admin/inventory/inventory.page.ts
// Five-orites Scoop — Admin Inventory Manager

import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton,
  IonSearchbar, IonLabel, IonInput,
  IonButton, IonIcon, IonToggle,
  IonSkeletonText, IonRefresher, IonRefresherContent,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonChip, AlertController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline, createOutline, alertCircleOutline,
} from 'ionicons/icons';
import { Subscription, catchError, of } from 'rxjs';
import { InventoryService } from '../../core/services/inventory.service';
import { Product, SizeVariant } from '../../core/models/product.model';
import { SIZE_DISPLAY_LABELS } from '../../core/config/pricing.config';

interface EditableStock { cup: number; pint: number; halfGallon: number; gallon: number; }

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonMenuButton,
    IonSearchbar, IonLabel, IonInput,
    IonButton, IonIcon, IonToggle,
    IonSkeletonText, IonRefresher, IonRefresherContent,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonChip,
  ],
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.scss'],
})
export class InventoryPage implements OnInit, OnDestroy {
  private inventoryService = inject(InventoryService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private sub?: Subscription;

  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  isLoading = signal(true);
  editingId = signal<string | null>(null);
  savingId = signal<string | null>(null);
  editStock: Record<string, EditableStock> = {};

  readonly sizes: SizeVariant[] = ['cup', 'pint', 'halfGallon', 'gallon'];
  readonly sizeLabels = SIZE_DISPLAY_LABELS;
  skeletonItems = Array(6).fill(0);

  constructor() {
    addIcons({ saveOutline, createOutline, alertCircleOutline });
  }

  ngOnInit(): void { this.loadProducts(); }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  loadProducts(): void {
    this.isLoading.set(true);
    this.sub?.unsubscribe();
    this.sub = this.inventoryService.getProducts()
      .pipe(catchError((err) => {
        console.error('Load products error:', err);
        return of([]);
      }))
      .subscribe((products) => {
        this.products.set(products);
        this.filteredProducts.set(products);
        this.isLoading.set(false);
      });
  }

  onSearch(event: CustomEvent): void {
    const q = (event.detail.value ?? '').toLowerCase();
    this.filteredProducts.set(
      q ? this.products().filter(
        (p) => p.variantName.toLowerCase().includes(q) || p.setName.toLowerCase().includes(q)
      ) : this.products()
    );
  }

  startEdit(product: Product): void {
    this.editingId.set(product.id);
    // Deep copy current stock values into editStock
    this.editStock[product.id] = {
      cup: product.stock?.cup ?? 0,
      pint: product.stock?.pint ?? 0,
      halfGallon: product.stock?.halfGallon ?? 0,
      gallon: product.stock?.gallon ?? 0,
    };
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  validateStock(productId: string, size: SizeVariant): void {
    const val = Number(this.editStock[productId]?.[size]);
    if (isNaN(val) || val < 0) {
      this.editStock[productId][size] = 0;
    } else {
      this.editStock[productId][size] = Math.floor(val);
    }
  }

  async saveStock(product: Product): Promise<void> {
    const newStock = this.editStock[product.id];
    if (!newStock) return;

    this.savingId.set(product.id);
    try {
      // Save ALL sizes at once — don't skip unchanged ones
      for (const size of this.sizes) {
        const qty = Number(newStock[size]);
        await this.inventoryService.updateStock(product.id, size, isNaN(qty) ? 0 : qty);
      }

      const toast = await this.toastCtrl.create({
        message: `✅ Stock updated for ${product.variantName}!`,
        color: 'success', duration: 2500, position: 'top',
      });
      await toast.present();
      this.editingId.set(null);
    } catch (err: any) {
      const toast = await this.toastCtrl.create({
        message: `❌ Failed to update stock: ${err?.message ?? 'Please try again.'}`,
        color: 'danger', duration: 4000, position: 'top',
      });
      await toast.present();
    } finally {
      this.savingId.set(null);
    }
  }

  async toggleActive(product: Product): Promise<void> {
    const action = product.isActive ? 'deactivate' : 'activate';
    const alert = await this.alertCtrl.create({
      header: `${product.isActive ? 'Deactivate' : 'Activate'} Product`,
      message: `Are you sure you want to ${action} "${product.variantName}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm',
          handler: async () => {
            try {
              await this.inventoryService.updateProductActive(product.id, !product.isActive);
              const toast = await this.toastCtrl.create({
                message: `Product ${action}d successfully.`,
                color: 'success', duration: 2000, position: 'top',
              });
              await toast.present();
            } catch (err: any) {
              const toast = await this.toastCtrl.create({
                message: `Failed to update product: ${err?.message ?? 'Try again.'}`,
                color: 'danger', duration: 3000, position: 'top',
              });
              await toast.present();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  handleRefresh(event: CustomEvent): void {
    this.loadProducts();
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 1000);
  }

  isLowStock(stock: number): boolean { return stock > 0 && stock < 10; }
  isOutOfStock(stock: number): boolean { return stock === 0; }
}
