// src/app/core/logic/delivery.ts
// Five-orites Scoop — Delivery fee rules
//
// Framework-free so the unit tests import the real implementation instead of
// re-implementing it (which is what tests/logic.test.mjs used to do).

/** Flat delivery fee in pesos, Metro Manila. */
export const DELIVERY_FEE = 50;

/** Subtotal at or above which delivery is free. */
export const FREE_DELIVERY_THRESHOLD = 500;

/** Free at and above the threshold; otherwise the flat fee. */
export function getDeliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}
