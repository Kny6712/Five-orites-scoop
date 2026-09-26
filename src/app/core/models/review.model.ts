// src/app/core/models/review.model.ts
// Five-orites Scoop — Product Review Data Models

import { Timestamp } from '@angular/fire/firestore';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  displayName: string;
  rating: number; // 1–5
  comment: string;
  createdAt: Timestamp;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export function summarizeRatings(reviews: Pick<Review, 'rating'>[]): RatingSummary {
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}
