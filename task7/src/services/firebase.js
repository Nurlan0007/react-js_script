/**
 * src/services/firebase.js
 * Re-exports the Firebase configuration and initialized Auth instances from src/firebase.js
 */
export {
  app,
  auth,
  googleProvider,
  firebaseConfig,
  hasLiveFirebaseConfig,
  default,
} from '../firebase.js';
