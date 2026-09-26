// src/app/core/models/user.model.ts
// Five-orites Scoop — User Data Models
// Author: Five-orites Scoop team (see README)

import { Timestamp } from '@angular/fire/firestore';

export type UserRole = 'customer' | 'admin';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Timestamp;
}
