// src/app/core/models/order.model.ts
// Five-orites Scoop — Order Data Models
// Author: [Developer Placeholder]

import { Timestamp } from '@angular/fire/firestore';
import { SizeVariant } from './product.model';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  variantName: string;
  setName: string;
  size: SizeVariant;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  discountAmount?: number;
  voucherCode?: string | null;
  grandTotal: number;
  status: OrderStatus;
  paymentReference?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  deliveryAddress: string;
  notes?: string | null;
  cancelReason?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  statusHistory: { status: OrderStatus; timestamp: Timestamp }[];
}

export interface OrderStatusMeta {
  label: string;
  icon: string;
  description: string;
}

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  pending: {
    label: 'Order Placed',
    icon: 'time-outline',
    description: 'We received your order and are reviewing it.',
  },
  confirmed: {
    label: 'Confirmed',
    icon: 'checkmark-circle-outline',
    description: 'Your order has been confirmed!',
  },
  preparing: {
    label: 'Preparing Your Scoops',
    icon: 'ice-cream-outline',
    description: 'Our scoop artists are crafting your order.',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    icon: 'bicycle-outline',
    description: 'Your ice cream is on its way!',
  },
  delivered: {
    label: 'Delivered',
    icon: 'checkmark-done-circle-outline',
    description: 'Enjoy your scoops! 🍦',
  },
  cancelled: {
    label: 'Cancelled',
    icon: 'close-circle-outline',
    description: 'This order has been cancelled.',
  },
};
