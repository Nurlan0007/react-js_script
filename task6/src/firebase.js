/**
 * src/firebase.js
 * Initializes Firebase using VITE_ environment variables from .env.local.
 * Supports Email/Password and Google Authentication with browserLocalPersistence.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

/**
 * Checks whether real Firebase Console credentials have been provided in .env.local
 */
export const hasLiveFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'your_firebase_api_key_here' &&
    !firebaseConfig.apiKey.startsWith('AIzaSyDemo') &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'your-project-id'
);

let app = null;
let auth = null;
let googleProvider = null;

try {
  const effectiveConfig = firebaseConfig.apiKey
    ? firebaseConfig
    : {
        apiKey: 'AIzaSyDemoTechVaultLocalKey0007KBTU',
        authDomain: 'techvault-kbtu-auth.firebaseapp.com',
        projectId: 'techvault-kbtu-auth',
        storageBucket: 'techvault-kbtu-auth.appspot.com',
        messagingSenderId: '849201749201',
        appId: '1:849201749201:web:9f8e7d6c5b4a3210',
      };

  app = getApps().length > 0 ? getApp() : initializeApp(effectiveConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  // Configure persistent sessions across browser refreshes
  if (hasLiveFirebaseConfig && auth) {
    setPersistence(auth, browserLocalPersistence).catch(() => {
      // Ignore persistence setup warnings in restricted environments
    });
  }
} catch (err) {
  console.warn('[Firebase Init] Falling back to local Firebase Auth adapter:', err?.message);
}

export { app, auth, googleProvider };
export default app;
