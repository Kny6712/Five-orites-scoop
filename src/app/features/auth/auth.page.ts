// src/app/features/auth/auth.page.ts
// Five-orites Scoop — Login / Register / Admin Register Page

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonInput, IonButton, IonIcon,
  IonText, IonSpinner, IonSegment, IonSegmentButton, IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logoGoogle, mailOutline, lockClosedOutline,
  personOutline, eyeOutline, eyeOffOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { UserRole } from '../../core/models/user.model';

// ── SECRET ADMIN CODE ──────────────────────────────────────────
// Change this to any secret phrase your team agrees on
const ADMIN_SECRET_CODE = 'fiveorites2025admin';

type AuthMode = 'login' | 'register' | 'register-admin';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonInput, IonButton, IonIcon,
    IonText, IonSpinner, IonSegment, IonSegmentButton, IonLabel,
  ],
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  mode = signal<AuthMode>('login');
  email = '';
  password = '';
  displayName = '';
  adminCode = '';
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  constructor() {
    addIcons({
      logoGoogle, mailOutline, lockClosedOutline,
      personOutline, eyeOutline, eyeOffOutline,
      shieldCheckmarkOutline,
    });

    this.authService.currentUser$
      .pipe(takeUntilDestroyed(), filter((user) => user !== null))
      .subscribe(() => this.router.navigate(['/dashboard']));
  }

  ngOnInit(): void {}

  setMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.errorMessage.set('');
    this.adminCode = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  async submit(): Promise<void> {
    this.errorMessage.set('');
    this.isLoading.set(true);

    try {
      if (this.mode() === 'login') {
        await this.authService.signInWithEmail(this.email, this.password);

      } else if (this.mode() === 'register') {
        if (!this.displayName.trim()) {
          this.errorMessage.set('Please enter your full name.');
          return;
        }
        await this.authService.registerWithEmail(
          this.email, this.password, this.displayName, 'customer'
        );

      } else if (this.mode() === 'register-admin') {
        // ── Admin Registration ─────────────────────────────
        if (!this.displayName.trim()) {
          this.errorMessage.set('Please enter your full name.');
          return;
        }
        if (this.adminCode !== ADMIN_SECRET_CODE) {
          this.errorMessage.set('Invalid admin code. Please try again.');
          return;
        }
        await this.authService.registerWithEmail(
          this.email, this.password, this.displayName, 'admin'
        );
      }

      await this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      this.errorMessage.set(this.parseFirebaseError(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  async signInWithGoogle(): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.authService.signInWithGoogle();
      await this.router.navigate(['/dashboard']);
    } catch {
      this.errorMessage.set('Google sign-in failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private parseFirebaseError(err: unknown): string {
    if (err instanceof Error) {
      const code = (err as { code?: string }).code ?? '';
      const messages: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/invalid-credential': 'Incorrect email or password.',
      };
      return messages[code] ?? err.message ?? 'An unexpected error occurred.';
    }
    return 'An unexpected error occurred.';
  }
}
