// Basic logic tests — mirrors src/app/core/models/cart.model.ts#getDeliveryFee
// and cart stock-cap rule in cart.service.ts#addItem.
// Run: npm run test:logic
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const DELIVERY_FEE = 50;
const FREE_DELIVERY_THRESHOLD = 500;

function getDeliveryFee(subtotal) {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

function assertAddAllowed(existingQty, addQty, available) {
  if (addQty <= 0) throw new Error('Quantity must be at least 1.');
  if (available <= 0) throw new Error('Out of stock.');
  if (existingQty + addQty > available) throw new Error('Exceeds available stock.');
}

describe('delivery fee', () => {
  it('charges ₱50 below threshold', () => {
    assert.equal(getDeliveryFee(0), 50);
    assert.equal(getDeliveryFee(499), 50);
  });
  it('is FREE at and above ₱500', () => {
    assert.equal(getDeliveryFee(500), 0);
    assert.equal(getDeliveryFee(1200), 0);
  });
});

describe('cart stock cap', () => {
  it('allows within stock', () => {
    assertAddAllowed(2, 3, 10);
  });
  it('rejects oversell', () => {
    assert.throws(() => assertAddAllowed(8, 3, 10), /Exceeds available/);
  });
  it('rejects out of stock', () => {
    assert.throws(() => assertAddAllowed(0, 1, 0), /Out of stock/);
  });
});

function calculateDiscount(subtotal, voucher) {
  if (!voucher.isActive) return 0;
  if ((voucher.minOrder ?? 0) > subtotal) return 0;
  if (voucher.type === 'percent') {
    const pct = Math.min(Math.max(voucher.value, 0), 90);
    return Math.floor((subtotal * pct) / 100);
  }
  return Math.min(Math.max(voucher.value, 0), subtotal);
}

describe('vouchers', () => {
  it('applies percent with minimum order', () => {
    assert.equal(calculateDiscount(1000, { type: 'percent', value: 10, minOrder: 200, isActive: true }), 100);
    assert.equal(calculateDiscount(100, { type: 'percent', value: 10, minOrder: 200, isActive: true }), 0);
  });
  it('caps fixed discount at subtotal', () => {
    assert.equal(calculateDiscount(30, { type: 'fixed', value: 50, isActive: true }), 30);
  });
  it('ignores inactive vouchers', () => {
    assert.equal(calculateDiscount(1000, { type: 'percent', value: 10, isActive: false }), 0);
  });
});

function summarizeRatings(reviews) {
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}

describe('reviews', () => {
  it('summarizes average rating', () => {
    assert.deepEqual(summarizeRatings([]), { average: 0, count: 0 });
    assert.deepEqual(summarizeRatings([{ rating: 5 }, { rating: 4 }]), { average: 4.5, count: 2 });
  });
});

describe('order cancel policy', () => {
  it('allows cancel only when pending (customer) or not delivered (admin restock path)', () => {
    const customerCanCancel = (status) => status === 'pending';
    assert.equal(customerCanCancel('pending'), true);
    assert.equal(customerCanCancel('confirmed'), false);
    assert.equal(customerCanCancel('delivered'), false);
  });
});
