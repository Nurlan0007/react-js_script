import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from './Loader.jsx';

/**
 * Protects private routes (such as /profile).
 * Waits for Firebase onAuthStateChanged to finish initializing before redirecting,
 * ensuring authenticated sessions persist cleanly across browser refreshes.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Loader
        fullPage
        message="Restoring persistent Firebase Authentication session..."
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
