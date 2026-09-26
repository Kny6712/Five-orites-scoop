// Copy to environment.ts / environment.prod.ts and fill real values.
// Do NOT commit real Firebase keys. Get them from:
// Firebase Console > Project Settings > Your Apps > SDK setup.
export const environment = {
  production: false,
  firebase: {
    apiKey: 'PASTE_YOUR_API_KEY_HERE',
    authDomain: 'PASTE_YOUR_PROJECT.firebaseapp.com',
    projectId: 'PASTE_YOUR_PROJECT_ID',
    storageBucket: 'PASTE_YOUR_PROJECT.firebasestorage.app',
    messagingSenderId: 'PASTE_YOUR_SENDER_ID',
    appId: 'PASTE_YOUR_APP_ID',
    measurementId: '',
  },
  lowStockThreshold: 10,
  // Cloudinary Console > Settings > Upload > Upload presets > Add (Signing Mode: Unsigned).
  cloudinary: {
    cloudName: 'PASTE_YOUR_CLOUDINARY_CLOUD_NAME',
    uploadPreset: 'PASTE_YOUR_UNSIGNED_PRESET',
  },
};
