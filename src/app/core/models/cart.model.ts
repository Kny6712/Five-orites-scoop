// src/app/core/models/cart.model.ts
// Five-orites Scoop — Cart Data Models
// Author: [Developer Placeholder]

import { SizeVariant } from './product.model';

export interface CartItem {
  productId: string;
  variantName: string;
  setName: string;
  size: SizeVariant;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

export interface Cart {
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
}

export const DELIVERY_FEE = 50; // ₱50 flat rate — Metro Manila
export const FREE_DELIVERY_THRESHOLD = 500; // Free delivery over ₱500

export function getDeliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

export const EMPTY_CART: Cart = {
  items: [],
  totalAmount: 0,
  itemCount: 0,
};
