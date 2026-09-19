// src/app/core/guards/auth.guard.ts
// Five-orites Scoop — Authentication Route Guard
// Author: [Developer Placeholder]

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map((user) => {
      if (user) return true;
      router.navigate(['/auth']);
      return false;
    })
  );
};
