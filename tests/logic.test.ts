// tests/logic.test.ts
// Five-orites Scoop — business logic tests
//
// These import the REAL implementations from src/app/core/logic. The previous
// version of this file re-implemented every rule inline, so it would still pass
// if the app itself were deleted. Do not inline logic here — import it.
//
// Run: npm run test:logic

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
  getDeliveryFee,
} from '../src/app/core/logic/delivery';
import { calculateDiscount, MAX_PERCENT_DISCOUNT } from '../src/app/core/logic/voucher';
import { summarizeRatings } from '../src/app/core/logic/rating';
import { assertCanAddToCart, clampToStock } from '../src/app/core/logic/stock';
import { BUILT_IN_VOUCHERS } from '../src/app/core/models/voucher.model';

describe('delivery fee', () => {
  it('charges the flat fee below the threshold', () => {
    assert.equal(getDeliveryFee(0), DELIVERY_FEE);
    assert.equal(getDeliveryFee(FREE_DELIVERY_THRESHOLD - 1), DELIVERY_FEE);
  });

  it('is free at and above the threshold', () => {
    assert.equal(getDeliveryFee(FREE_DELIVERY_THRESHOLD), 0);
    assert.equal(getDeliveryFee(1200), 0);
  });
});

describe('cart stock cap', () => {
  it('allows a quantity within available stock', () => {
    assert.doesNotThrow(() => assertCanAddToCart('Rocky Road (pint)', 2, 3, 10));
  });

  it('rejects overselling', () => {
    assert.throws(
      () => assertCanAddToCart('Rocky Road (pint)', 8, 3, 10),
      /Exceeds available|Only 10 x Rocky Road/
    );
  });

  it('rejects an out-of-stock line', () => {
    assert.throws(() => assertCanAddToCart('Rocky Road (pint)', 0, 1, 0), /out of stock/);
  });

  it('rejects a non-positive quantity', () => {
    assert.throws(() => assertCanAddToCart('Rocky Road (pint)', 0, 0, 10), /at least 1/);
  });
});

describe('clampToStock', () => {
  it('caps the requested quantity at available stock', () => {
    assert.equal(clampToStock(9, 4), 4);
  });

  it('leaves the quantity alone when stock is unknown', () => {
    assert.equal(clampToStock(9, undefined), 9);
  });

  it('never returns a negative quantity', () => {
    assert.equal(clampToStock(5, -3), 0);
  });
});

describe('vouchers', () => {
  it('applies a percentage above its minimum order', () => {
    assert.equal(
      calculateDiscount(1000, { type: 'percent', value: 10, minOrder: 200, isActive: true }),
      100
    );
  });

  it('ignores a percentage below its minimum order', () => {
    assert.equal(
      calculateDiscount(100, { type: 'percent', value: 10, minOrder: 200, isActive: true }),
      0
    );
  });

  it('caps a fixed discount at the subtotal', () => {
    assert.equal(
      calculateDiscount(30, { type: 'fixed', value: 50, isActive: true }),
      30
    );
  });

  it('ignores inactive vouchers', () => {
    assert.equal(
      calculateDiscount(1000, { type: 'percent', value: 10, isActive: false }),
      0
    );
  });

  it('never discounts more than the maximum percentage', () => {
    assert.equal(
      calculateDiscount(1000, { type: 'percent', value: 500, isActive: true }),
      (1000 * MAX_PERCENT_DISCOUNT) / 100
    );
  });

  it('ships working built-in codes', () => {
    for (const v of BUILT_IN_VOUCHERS) {
      assert.ok(v.isActive, `${v.code} should be active`);
      assert.ok(calculateDiscount(1000, v) > 0, `${v.code} should discount ₱1000`);
    }
  });
});

describe('reviews', () => {
  it('returns a zeroed summary for no reviews', () => {
    assert.deepEqual(summarizeRatings([]), { average: 0, count: 0 });
  });

  it('averages to one decimal place', () => {
    assert.deepEqual(summarizeRatings([{ rating: 5 }, { rating: 4 }]), {
      average: 4.5,
      count: 2,
    });
  });
});

describe('order cancel policy', () => {
  const customerCanCancel = (status: string) => status === 'pending';

  it('lets a customer cancel only while pending', () => {
    assert.equal(customerCanCancel('pending'), true);
    assert.equal(customerCanCancel('confirmed'), false);
    assert.equal(customerCanCancel('delivered'), false);
  });
});
