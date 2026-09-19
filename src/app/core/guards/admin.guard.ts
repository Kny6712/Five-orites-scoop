// src/app/core/guards/admin.guard.ts
// Five-orites Scoop — Admin Role Route Guard
// Author: [Developer Placeholder]

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map((user) => {
      if (user?.role === 'admin') return true;
      router.navigate(['/dashboard']);
      return false;
    })
  );
};
