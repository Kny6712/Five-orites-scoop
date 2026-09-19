// src/app/app.config.ts
// Five-orites Scoop — Angular Application Configuration

import { ApplicationConfig } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
    provideIonicAngular({
      mode: 'md',
      animated: true,
      backButtonText: '',
    }),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
  ],
};
