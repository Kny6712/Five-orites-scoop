// src/app/core/logic/stock.ts
// Five-orites Scoop — Pure stock rules
//
// Deliberately free of Angular and Firebase imports so the unit tests can
// import this module directly instead of re-implementing the rules. If the app
// and the tests ever disagree, the tests are wrong.

/**
 * Validates that `addQty` more units of a line may be added to the cart.
 * Throws a user-facing message on violation.
 *
 * @param label      Human-readable line label, e.g. "Rocky Road (pint)".
 * @param existingQty Units of this exact line already in the cart.
 * @param addQty     Units the caller wants to add. Must be >= 1.
 * @param available  Units currently in stock. Must be > 0.
 */
export function assertCanAddToCart(
  label: string,
  existingQty: number,
  addQty: number,
  available: number
): void {
  if (addQty <= 0) throw new Error('Quantity must be at least 1.');
  if (available <= 0) throw new Error(`${label} is out of stock.`);
  if (existingQty + addQty > available) {
    throw new Error(
      `Only ${available} x ${label} available. You already have ${existingQty} in cart.`
    );
  }
}

/** Clamps a requested quantity to what is actually available (never below 0). */
export function clampToStock(quantity: number, available: number | undefined): number {
  if (available === undefined) return quantity;
  return Math.min(quantity, Math.max(available, 0));
}
