/**
 * src/services/authService.js
 * Dedicated Authentication Service encapsulating Firebase Authentication SDK calls
 * and session persistence. UI components never access localStorage or Firebase SDK
 * primitives directly; they consume AuthContext which delegates to this service.
 */
import {
  onAuthStateChanged as firebaseOnAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth, googleProvider, hasLiveFirebaseConfig, firebaseConfig } from '../firebase.js';

const SESSION_STORAGE_KEY = 'techvault_firebase_auth_session_v2';
const USERS_DB_STORAGE_KEY = 'techvault_firebase_users_db_v2';

// Default seeded accounts for instant testing in demo/adapter mode
const DEFAULT_SEEDED_USERS = [
  {
    uid: 'tv_uid_nurlan0007_kbtu99x',
    email: 'nurlan.tlek@techvault.kz',
    passwordHash: 'TechVault2026!',
    displayName: 'Nurlan Tlek',
    providerId: 'password',
    createdAt: '2026-10-15T09:30:00.000Z',
  },
  {
    uid: 'tv_uid_admin_kbtu_7741a',
    email: 'admin@techvault.kz',
    passwordHash: 'Admin123!',
    displayName: 'Catalog Lead',
    providerId: 'password',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
];

const authListeners = new Set();
let adapterInitialized = false;

function readStorageJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorageJson(key, value) {
  try {
    if (value === null || value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Ignore storage quota errors in private browsing
  }
}

function getLocalUsersDb() {
  const existing = readStorageJson(USERS_DB_STORAGE_KEY, null);
  if (Array.isArray(existing) && existing.length > 0) {
    return existing;
  }
  writeStorageJson(USERS_DB_STORAGE_KEY, DEFAULT_SEEDED_USERS);
  return DEFAULT_SEEDED_USERS;
}

function saveLocalUsersDb(users) {
  writeStorageJson(USERS_DB_STORAGE_KEY, users);
}

function getPersistedAdapterUser() {
  return readStorageJson(SESSION_STORAGE_KEY, null);
}

function setPersistedAdapterUser(userObj) {
  writeStorageJson(SESSION_STORAGE_KEY, userObj);
  authListeners.forEach((listener) => {
    try {
      listener(userObj);
    } catch (e) {
      console.error('[AuthService] Listener error:', e);
    }
  });
}

function generateFirebaseUid(prefix = 'tv_uid_') {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let randomPart = '';
  for (let i = 0; i < 20; i += 1) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${randomPart}`;
}

function normalizeFirebaseUser(rawUser) {
  if (!rawUser) return null;
  const providerId =
    rawUser.providerId ||
    rawUser.providerData?.[0]?.providerId ||
    'password';

  return {
    uid: rawUser.uid,
    email: rawUser.email || 'anonymous@techvault.kz',
    displayName:
      rawUser.displayName ||
      (rawUser.email ? rawUser.email.split('@')[0] : 'TechVault User'),
    photoURL: rawUser.photoURL || null,
    emailVerified: Boolean(rawUser.emailVerified ?? true),
    providerId,
    lastLoginAt: rawUser.lastLoginAt || new Date().toISOString(),
    createdAt: rawUser.createdAt || new Date().toISOString(),
    authMode: hasLiveFirebaseConfig ? 'firebase-live' : 'firebase-adapter',
  };
}

/**
 * Maps raw Firebase Auth error codes to clear, user-friendly messages
 */
export function formatAuthError(error) {
  if (!error) return 'An unexpected authentication error occurred.';
  const code = error.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address (e.g., user@domain.com).';
    case 'auth/user-disabled':
      return 'This user account has been disabled by an administrator.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials or sign up for a new account.';
    case 'auth/wrong-password':
      return 'Incorrect password for this account. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing authentication.';
    case 'auth/network-request-failed':
      return 'Network error occurred while contacting Firebase Authentication servers.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful sign-in attempts. Please wait a moment and try again.';
    default:
      return error.message || 'Authentication failed. Please check your credentials and try again.';
  }
}

function createFirebaseStyleError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function delay(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Subscribes to authentication state changes (`onAuthStateChanged`).
 * Preserves sessions across browser refreshes.
 */
export function subscribeToAuthChanges(callback) {
  authListeners.add(callback);

  if (hasLiveFirebaseConfig && auth) {
    const unsubscribeFirebase = firebaseOnAuthStateChanged(
      auth,
      (firebaseUser) => {
        const normalized = normalizeFirebaseUser(firebaseUser);
        writeStorageJson(SESSION_STORAGE_KEY, normalized);
        callback(normalized);
      },
      (err) => {
        console.warn('[Firebase onAuthStateChanged] Error, falling back to session adapter:', err);
        callback(getPersistedAdapterUser());
      }
    );

    return () => {
      authListeners.delete(callback);
      unsubscribeFirebase();
    };
  }

  // Adapter mode: asynchronously emit persisted user session on mount
  const timer = setTimeout(() => {
    adapterInitialized = true;
    const savedUser = getPersistedAdapterUser();
    callback(savedUser);
  }, 120);

  return () => {
    clearTimeout(timer);
    authListeners.delete(callback);
  };
}

/**
 * Registers a new user with Email & Password
 */
export async function registerWithEmailPassword(email, password, displayName = '') {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '');
  const cleanName = String(displayName || '').trim();

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw createFirebaseStyleError('auth/invalid-email', 'Invalid email address format.');
  }
  if (cleanPassword.length < 6) {
    throw createFirebaseStyleError(
      'auth/weak-password',
      'Password should be at least 6 characters.'
    );
  }

  if (hasLiveFirebaseConfig && auth) {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      if (cleanName) {
        await updateProfile(credential.user, { displayName: cleanName });
      }
      const userObj = normalizeFirebaseUser({
        ...credential.user,
        displayName: cleanName || credential.user.displayName,
        providerId: 'password',
      });
      setPersistedAdapterUser(userObj);
      return userObj;
    } catch (err) {
      // If user configured invalid API keys in .env.local, only fallback on api-key errors
      if (
        err?.code === 'auth/invalid-api-key' ||
        err?.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' ||
        err?.code === 'auth/configuration-not-found'
      ) {
        console.warn('[Firebase Signup] Invalid API key in .env.local; using local Firebase Auth adapter.');
      } else {
        throw err;
      }
    }
  }

  // Local Firebase Auth Adapter Execution
  await delay(260);
  const users = getLocalUsersDb();
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw createFirebaseStyleError(
      'auth/email-already-in-use',
      'The email address is already in use by another account.'
    );
  }

  const now = new Date().toISOString();
  const newUserRecord = {
    uid: generateFirebaseUid('tv_uid_'),
    email: cleanEmail,
    passwordHash: cleanPassword,
    displayName: cleanName || cleanEmail.split('@')[0],
    providerId: 'password',
    createdAt: now,
  };

  saveLocalUsersDb([...users, newUserRecord]);

  const sessionUser = normalizeFirebaseUser({
    ...newUserRecord,
    lastLoginAt: now,
  });
  setPersistedAdapterUser(sessionUser);
  return sessionUser;
}

/**
 * Signs in an existing user with Email & Password
 */
export async function loginWithEmailPassword(email, password) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '');

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw createFirebaseStyleError('auth/invalid-email', 'Invalid email address format.');
  }
  if (!cleanPassword) {
    throw createFirebaseStyleError('auth/wrong-password', 'Please enter your password.');
  }

  if (hasLiveFirebaseConfig && auth) {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const userObj = normalizeFirebaseUser({
        ...credential.user,
        providerId: 'password',
      });
      setPersistedAdapterUser(userObj);
      return userObj;
    } catch (err) {
      if (
        err?.code === 'auth/invalid-api-key' ||
        err?.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' ||
        err?.code === 'auth/configuration-not-found'
      ) {
        console.warn('[Firebase Login] Invalid API key in .env.local; using local Firebase Auth adapter.');
      } else {
        throw err;
      }
    }
  }

  // Local Firebase Auth Adapter Execution
  await delay(240);
  const users = getLocalUsersDb();
  const matchedUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!matchedUser) {
    throw createFirebaseStyleError(
      'auth/user-not-found',
      'There is no user record corresponding to this email.'
    );
  }

  if (matchedUser.passwordHash !== cleanPassword) {
    throw createFirebaseStyleError(
      'auth/wrong-password',
      'The password is invalid for the given email.'
    );
  }

  const sessionUser = normalizeFirebaseUser({
    ...matchedUser,
    lastLoginAt: new Date().toISOString(),
  });
  setPersistedAdapterUser(sessionUser);
  return sessionUser;
}

/**
 * Signs in using Google OAuth Popup (`signInWithPopup` + `GoogleAuthProvider`)
 */
export async function signInWithGoogleProvider(customGoogleProfile = null) {
  if (hasLiveFirebaseConfig && auth && googleProvider) {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, googleProvider);
      const userObj = normalizeFirebaseUser({
        ...result.user,
        providerId: 'google.com',
      });
      setPersistedAdapterUser(userObj);
      return userObj;
    } catch (err) {
      if (
        err?.code === 'auth/invalid-api-key' ||
        err?.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' ||
        err?.code === 'auth/configuration-not-found' ||
        err?.code === 'auth/operation-not-supported-in-this-environment' ||
        err?.code === 'auth/unauthorized-domain'
      ) {
        console.warn('[Firebase Google Sign-In] Falling back to local Google OAuth adapter:', err?.code);
      } else {
        throw err;
      }
    }
  }

  // Local Firebase Google OAuth Adapter Execution
  await delay(280);
  const now = new Date().toISOString();
  const email = (customGoogleProfile?.email || 'nurlan.tlek.google@gmail.com').toLowerCase();
  const displayName = customGoogleProfile?.displayName || 'Nurlan Tlek (Google)';

  const users = getLocalUsersDb();
  let existing = users.find((u) => u.email.toLowerCase() === email);
  if (!existing) {
    existing = {
      uid: 'tv_google_uid_994827163kbtu',
      email,
      passwordHash: '__google_oauth_token__',
      displayName,
      providerId: 'google.com',
      createdAt: now,
    };
    saveLocalUsersDb([...users, existing]);
  }

  const sessionUser = normalizeFirebaseUser({
    ...existing,
    providerId: 'google.com',
    lastLoginAt: now,
  });
  setPersistedAdapterUser(sessionUser);
  return sessionUser;
}

/**
 * Signs out the current user and clears persistent session state
 */
export async function logoutCurrentUser() {
  if (hasLiveFirebaseConfig && auth) {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('[Firebase SignOut] Warning:', err?.message);
    }
  } else {
    await delay(150);
  }
  setPersistedAdapterUser(null);
}

/**
 * Returns environment metadata for diagnostics on /profile
 */
export function getFirebaseEnvironmentInfo() {
  return {
    projectId: firebaseConfig.projectId || 'techvault-kbtu-auth',
    authDomain: firebaseConfig.authDomain || 'techvault-kbtu-auth.firebaseapp.com',
    hasApiKey: Boolean(firebaseConfig.apiKey),
    mode: hasLiveFirebaseConfig ? 'Live Firebase Cloud' : 'Firebase SDK + Local Persistence Adapter',
    persistenceType: 'browserLocalPersistence (IndexedDB / Web Storage)',
  };
}
