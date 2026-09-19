// src/app/core/services/auth.service.ts
// Five-orites Scoop — Authentication Service
// Author: [Developer Placeholder]

import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  User,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppUser, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  readonly currentUser$: Observable<AppUser | null> =
    this.currentUserSubject.asObservable();

  constructor() {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = await this.buildAppUser(firebaseUser);
        this.currentUserSubject.next(appUser);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  private async buildAppUser(firebaseUser: User): Promise<AppUser> {
    try {
      const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        // User doc already exists — return it
        return userSnap.data() as AppUser;
      }

      // ── New user — create Firestore document ──────────────────
      const newUser: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? '',
        displayName: firebaseUser.displayName ?? 'Scoop Lover',
        photoURL: firebaseUser.photoURL ?? undefined,
        role: 'customer',   // default role
        createdAt: new Date() as never,
      };

      await setDoc(userDocRef, {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayName,
        photoURL: newUser.photoURL ?? null,
        role: newUser.role,
        createdAt: new Date().toISOString(),
      });

      return newUser;
    } catch (err) {
      console.error('Error building AppUser:', err);
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? '',
        displayName: firebaseUser.displayName ?? 'Guest',
        role: 'customer',
        createdAt: null as never,
      };
    }
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async registerWithEmail(
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'customer'
  ): Promise<void> {
    const credential = await createUserWithEmailAndPassword(
      this.auth, email, password
    );
    await updateProfile(credential.user, { displayName });

    // Write Firestore doc immediately after registration
    const userDocRef = doc(this.firestore, `users/${credential.user.uid}`);
    await setDoc(userDocRef, {
      uid: credential.user.uid,
      email: credential.user.email ?? '',
      displayName,
      photoURL: null,
      role,   // 'customer' or 'admin'
      createdAt: new Date().toISOString(),
    });
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  get currentUserSnapshot(): AppUser | null {
    return this.currentUserSubject.getValue();
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.getValue() !== null;
  }
}
