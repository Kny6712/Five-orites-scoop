// src/app/core/models/review.model.ts
// Five-orites Scoop — Product Review Data Models

import { Timestamp } from '@angular/fire/firestore';

// summarizeRatings lives in core/logic/rating.ts so the unit tests can import
// it without pulling in AngularFire. Re-exported here.
export { summarizeRatings, type RatingSummary } from '../logic/rating';

import type { RatingSummary } from '../logic/rating';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  displayName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Timestamp;
}
