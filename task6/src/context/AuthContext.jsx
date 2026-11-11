/**
 * src/context/AuthContext.jsx
 * Implements AuthContext, AuthProvider, and useAuth hook.
 * Tracks Firebase authentication state via onAuthStateChanged, supports persistent
 * sessions across refreshes, loading states, error formatting, and exposes
 * signup, login, loginWithGoogle, and logout.
 */
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  subscribeToAuthChanges,
  registerWithEmailPassword,
  loginWithEmailPassword,
  signInWithGoogleProvider,
  logoutCurrentUser,
  formatAuthError,
  getFirebaseEnvironmentInfo,
} from '../services/authService.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      if (!isMounted) return;
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const signup = useCallback(async (email, password, displayName = '') => {
    setActionLoading(true);
    setAuthError(null);
    try {
      const createdUser = await registerWithEmailPassword(email, password, displayName);
      setUser(createdUser);
      return createdUser;
    } catch (err) {
      const friendlyMessage = formatAuthError(err);
      setAuthError(friendlyMessage);
      const wrapped = new Error(friendlyMessage);
      wrapped.code = err?.code || 'auth/signup-error';
      throw wrapped;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setActionLoading(true);
    setAuthError(null);
    try {
      const loggedInUser = await loginWithEmailPassword(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      const friendlyMessage = formatAuthError(err);
      setAuthError(friendlyMessage);
      const wrapped = new Error(friendlyMessage);
      wrapped.code = err?.code || 'auth/login-error';
      throw wrapped;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (customGoogleProfile = null) => {
    setActionLoading(true);
    setAuthError(null);
    try {
      const googleUser = await signInWithGoogleProvider(customGoogleProfile);
      setUser(googleUser);
      return googleUser;
    } catch (err) {
      const friendlyMessage = formatAuthError(err);
      setAuthError(friendlyMessage);
      const wrapped = new Error(friendlyMessage);
      wrapped.code = err?.code || 'auth/google-error';
      throw wrapped;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setActionLoading(true);
    setAuthError(null);
    try {
      await logoutCurrentUser();
      setUser(null);
    } catch (err) {
      const friendlyMessage = formatAuthError(err);
      setAuthError(friendlyMessage);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const firebaseEnv = useMemo(() => getFirebaseEnvironmentInfo(), []);

  const value = useMemo(
    () => ({
      user,
      currentUser: user,
      isAuthenticated: Boolean(user),
      loading,
      actionLoading,
      authError,
      clearAuthError,
      signup,
      login,
      loginWithGoogle,
      googleSignIn: loginWithGoogle,
      logout,
      firebaseEnv,
    }),
    [user, loading, actionLoading, authError, clearAuthError, signup, login, loginWithGoogle, logout, firebaseEnv]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
