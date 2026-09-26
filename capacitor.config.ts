// capacitor.config.ts
// Five-orites Scoop — Capacitor Configuration
// Author: [Developer Placeholder]

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fiveorites.scoop',
  appName: 'Five-orites Scoop',
  webDir: 'www/browser',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#6B3FA0',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#6B3FA0',
    },
  },
};

export default config;
