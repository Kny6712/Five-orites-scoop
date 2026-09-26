// src/app/core/models/product.model.ts
// Five-orites Scoop — Product Data Models
// Author: [Developer Placeholder]

import { Timestamp } from '@angular/fire/firestore';

export type SizeVariant = 'cup' | 'pint' | 'halfGallon' | 'gallon';
// Flavor set number: 1–8 built-in, extensible (admin can add new sets).
export type FlavorSet = number;

export interface SizePricing {
  cup: number;
  pint: number;
  halfGallon: number;
  gallon: number;
}

export interface StockLevel {
  cup: number;
  pint: number;
  halfGallon: number;
  gallon: number;
}

export interface Product {
  id: string;                 // Firestore document ID
  setNumber: FlavorSet;       // >= 1 (1–8 built-in, extensible via admin)
  setName: string;            // e.g. "Chocolates"
  variantName: string;        // e.g. "Rocky Road"
  description: string;
  imageUrl: string;
  pricing: SizePricing;
  stock: StockLevel;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductFilter {
  setNumber?: FlavorSet;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  size?: SizeVariant;
}

export interface StockHistoryEntry {
  productId: string;
  size: SizeVariant;
  previousStock: number;
  newStock: number;
  changedBy: string;
  timestamp: Timestamp;
  reason?: string;
}
