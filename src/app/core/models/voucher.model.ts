// src/app/core/models/voucher.model.ts
// Five-orites Scoop — Voucher / Promo Code Data Models

export type VoucherType = 'percent' | 'fixed';

export interface Voucher {
  id: string;
  code: string; // uppercase, e.g. SCOOP10
  type: VoucherType;
  value: number; // percent 1–90 or fixed peso amount
  minOrder?: number; // minimum subtotal to apply
  isActive: boolean;
}

export function calculateDiscount(subtotal: number, voucher: Voucher): number {
  if (!voucher.isActive) return 0;
  if ((voucher.minOrder ?? 0) > subtotal) return 0;
  if (voucher.type === 'percent') {
    const pct = Math.min(Math.max(voucher.value, 0), 90);
    return Math.floor((subtotal * pct) / 100);
  }
  return Math.min(Math.max(voucher.value, 0), subtotal);
}

// Built-in fallback so demos work even when Firestore `vouchers` is empty.
export const BUILT_IN_VOUCHERS: Voucher[] = [
  { id: 'builtin-scoop10', code: 'SCOOP10', type: 'percent', value: 10, minOrder: 200, isActive: true },
  { id: 'builtin-free50', code: 'FREE50', type: 'fixed', value: 50, minOrder: 500, isActive: true },
];
