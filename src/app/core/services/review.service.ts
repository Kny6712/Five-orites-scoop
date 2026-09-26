// src/app/core/services/review.service.ts
// Five-orites Scoop — Product Reviews (Firestore `reviews` collection)

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Review, summarizeRatings, RatingSummary } from '../models/review.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  getProductReviews(productId: string, maxResults = 50): Observable<Review[]> {
    return new Observable<Review[]>((observer) => {
      const col = collection(this.firestore, 'reviews');
      const q = query(
        col,
        where('productId', '==', productId),
        orderBy('createdAt', 'desc'),
        limit(maxResults)
      );
      const unsub = onSnapshot(
        q,
        (snap) => observer.next(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Review[]),
        (err) => observer.error(err)
      );
      return () => unsub();
    });
  }

  getRatingSummary(productId: string): Observable<RatingSummary> {
    return new Observable<RatingSummary>((observer) => {
      const sub = this.getProductReviews(productId, 200).subscribe({
        next: (reviews) => observer.next(summarizeRatings(reviews)),
        error: (e) => observer.error(e),
      });
      return () => sub.unsubscribe();
    });
  }

  async addReview(productId: string, rating: number, comment: string): Promise<string> {
    const user = this.authService.currentUserSnapshot;
    if (!user) throw new Error('Sign in to leave a review.');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('Rating must be 1–5 stars.');
    }
    if (!comment.trim()) throw new Error('Please write a short review.');
    const col = collection(this.firestore, 'reviews');
    const ref = await addDoc(col, {
      productId,
      userId: user.uid,
      displayName: user.displayName || 'Scoop Lover',
      rating,
      comment: comment.trim().slice(0, 500),
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }
}
