// src/app/core/services/voucher.service.ts
// Five-orites Scoop — Voucher lookup (Firestore + built-in fallback codes)

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  limit,
  getDocs,
} from '@angular/fire/firestore';
import { BUILT_IN_VOUCHERS, Voucher, calculateDiscount } from '../models/voucher.model';

@Injectable({ providedIn: 'root' })
export class VoucherService {
  private firestore = inject(Firestore);

  async validateVoucher(code: string, subtotal: number): Promise<{ voucher: Voucher; discount: number }> {
    const normalized = code.trim().toUpperCase();
    if (!normalized) throw new Error('Enter a voucher code.');

    // 1) Try Firestore first.
    try {
      const col = collection(this.firestore, 'vouchers');
      const q = query(col, where('code', '==', normalized), where('isActive', '==', true), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const voucher = { id: snap.docs[0].id, ...snap.docs[0].data() } as Voucher;
        const discount = calculateDiscount(subtotal, voucher);
        if (discount <= 0) throw new Error(`Code ${normalized} needs a minimum order of ₱${voucher.minOrder ?? 0}.`);
        return { voucher, discount };
      }
    } catch (err) {
      // Firestore lookup failed (offline / rules) — fall through to built-ins.
      if (err instanceof Error && /minimum order/.test(err.message)) throw err;
    }

    // 2) Built-in fallback so SCOOP10 / FREE50 always work in demos.
    const fallback = BUILT_IN_VOUCHERS.find((v) => v.code === normalized);
    if (!fallback) throw new Error(`Voucher "${normalized}" not found.`);
    const discount = calculateDiscount(subtotal, fallback);
    if (discount <= 0) throw new Error(`Code ${normalized} needs a minimum order of ₱${fallback.minOrder ?? 0}.`);
    return { voucher: fallback, discount };
  }
}
