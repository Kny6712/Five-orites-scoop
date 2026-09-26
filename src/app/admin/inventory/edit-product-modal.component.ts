// src/app/admin/inventory/edit-product-modal.component.ts
// Five-orites Scoop — Edit Product: Details + Edit Stocks (quantities only)

import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonList, IonItem,
  IonInput, IonTextarea, IonIcon,
  ModalController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, removeOutline } from 'ionicons/icons';
import { InventoryService } from '../../core/services/inventory.service';
import { Product, SizeVariant, StockLevel } from '../../core/models/product.model';
import { SIZE_DISPLAY_LABELS } from '../../core/config/pricing.config';

@Component({
  selector: 'app-edit-product-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonList, IonItem,
    IonInput, IonTextarea, IonIcon,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Edit Product</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cancel()">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (product) {
        <h3 class="section-title">Details</h3>
        <ion-list class="card-list">
          <ion-item>
            <ion-input
              label="Variant name"
              labelPlacement="stacked"
              [(ngModel)]="variantName"
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-textarea
              label="Description"
              labelPlacement="stacked"
              rows="3"
              [(ngModel)]="description"
            ></ion-textarea>
          </ion-item>
          <ion-item lines="none" class="total-row">
            <span class="total-label">Total quantity (all sizes)</span>
            <span class="total-value" slot="end">{{ totalStock }}</span>
          </ion-item>
        </ion-list>

        <h3 class="section-title">Edit Stocks</h3>
        <ion-list class="card-list">
          @for (size of sizes; track size) {
            <ion-item>
              <span class="stock-size">{{ sizeLabels[size] }}</span>
              <div class="stepper" slot="end">
                <button class="step-btn" (click)="adjust(size, -1)" aria-label="Decrease quantity">
                  <ion-icon name="remove-outline"></ion-icon>
                </button>
                <ion-input
                  type="number"
                  min="0"
                  [(ngModel)]="stocks[size]"
                  (ionBlur)="clamp(size)"
                  class="qty-input"
                  aria-label="Quantity"
                ></ion-input>
                <button class="step-btn" (click)="adjust(size, 1)" aria-label="Increase quantity">
                  <ion-icon name="add-outline"></ion-icon>
                </button>
              </div>
            </ion-item>
          }
        </ion-list>

        <ion-button expand="block" (click)="save()" [disabled]="isSaving" class="save-btn">
          {{ isSaving ? 'Saving…' : 'Save Changes' }}
        </ion-button>
      }
    </ion-content>
  `,
  styles: [`
    .section-title { font-size: 15px; font-weight: 800; color: var(--ion-color-dark); margin: 18px 2px 8px; }
    .section-title:first-of-type { margin-top: 2px; }
    .card-list { border-radius: 14px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
    .total-row { --background: var(--ion-color-light); font-weight: 700; }
    .total-label { font-size: 14px; }
    .total-value { font-size: 20px; font-weight: 800; color: var(--color-brand-primary); }
    .stock-size { font-size: 14px; font-weight: 600; }
    .stepper { display: flex; align-items: center; gap: 6px; }
    .step-btn {
      width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--ion-color-light-shade, #e0e0e0);
      background: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 18px; cursor: pointer; color: var(--color-brand-primary);
    }
    .qty-input { width: 64px; text-align: center; font-weight: 800; font-size: 17px; --background: var(--ion-color-light); --border-radius: 10px; }
    .save-btn { --background: var(--color-brand-primary); --border-radius: 12px; font-weight: 700; margin-top: 20px; min-height: 48px; font-size: 16px; }
  `],
})
export class EditProductModalComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  @Input() product: Product | null = null;

  variantName = '';
  description = '';
  stocks: StockLevel = { cup: 0, pint: 0, halfGallon: 0, gallon: 0 };
  isSaving = false;

  readonly sizes: SizeVariant[] = ['cup', 'pint', 'halfGallon', 'gallon'];
  readonly sizeLabels = SIZE_DISPLAY_LABELS;

  constructor() {
    addIcons({ addOutline, removeOutline });
  }

  ngOnInit(): void {
    if (this.product) {
      this.variantName = this.product.variantName;
      this.description = this.product.description ?? '';
      this.stocks = { ...this.product.stock };
    }
  }

  get totalStock(): number {
    return this.sizes.reduce((sum, s) => sum + (Number(this.stocks[s]) || 0), 0);
  }

  adjust(size: SizeVariant, delta: number): void {
    this.stocks[size] = Math.max((Number(this.stocks[size]) || 0) + delta, 0);
  }

  clamp(size: SizeVariant): void {
    const val = Math.floor(Number(this.stocks[size]));
    this.stocks[size] = Number.isFinite(val) && val > 0 ? val : 0;
  }

  cancel(): void {
    void this.modalCtrl.dismiss();
  }

  async save(): Promise<void> {
    if (!this.product || this.isSaving) return;
    const name = this.variantName.trim();
    if (!name) {
      await this.toast('Variant name is required.', 'danger');
      return;
    }
    const stocks: StockLevel = {
      cup: Math.max(Math.floor(Number(this.stocks.cup)) || 0, 0),
      pint: Math.max(Math.floor(Number(this.stocks.pint)) || 0, 0),
      halfGallon: Math.max(Math.floor(Number(this.stocks.halfGallon)) || 0, 0),
      gallon: Math.max(Math.floor(Number(this.stocks.gallon)) || 0, 0),
    };

    this.isSaving = true;
    try {
      await this.inventoryService.updateProductDetails(this.product.id, {
        variantName: name,
        description: this.description.trim(),
      });
      await this.inventoryService.updateStocks(this.product.id, stocks);
      await this.toast('✅ Product updated.', 'success');
      await this.modalCtrl.dismiss({ saved: true });
    } catch (err: unknown) {
      await this.toast(err instanceof Error ? err.message : 'Failed to update product.', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  private async toast(message: string, color: 'success' | 'danger'): Promise<void> {
    const t = await this.toastCtrl.create({ message, color, duration: 2500, position: 'top' });
    await t.present();
  }
}
