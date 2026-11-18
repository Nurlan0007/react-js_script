import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * /signup — Registration page with Email, Password, Confirm Password,
 * comprehensive client-side validation, and Google Sign-In support.
 */
export default function Signup() {
  const {
    user,
    isAuthenticated,
    signup,
    loginWithGoogle,
    actionLoading,
    authError,
    clearAuthError,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = location.state?.from?.pathname || '/profile';

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, user, navigate, redirectTarget]);

  const passwordChecks = useMemo(() => {
    const minLength = password.length >= 6;
    const hasLetterAndNumber = /[A-Za-z]/.test(password) && /\d/.test(password);
    const matchesConfirm =
      confirmPassword.length > 0 && password === confirmPassword;
    return { minLength, hasLetterAndNumber, matchesConfirm };
  }, [password, confirmPassword]);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);
    clearAuthError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setValidationError('Please enter a valid email address (e.g., student@kbtu.kz).');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long (Firebase requirement).');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match. Please confirm your password.');
      return;
    }

    try {
      await signup(trimmedEmail, password, displayName.trim());
      navigate(redirectTarget, { replace: true });
    } catch {
      // Handled via AuthContext authError
    }
  };

  const handleGoogleSignup = async () => {
    setValidationError(null);
    clearAuthError();
    try {
      await loginWithGoogle();
      navigate(redirectTarget, { replace: true });
    } catch {
      // Handled via AuthContext authError
    }
  };

  const activeError = validationError || authError;

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="eyebrow-badge">Firebase User Registration</span>
          <h1 className="auth-title">Create Your TechVault Account</h1>
          <p className="auth-subtitle">
            Register with Email &amp; Password or Google OAuth to unlock your protected{' '}
            <code>/profile</code> telemetry dashboard.
          </p>
        </div>

        {activeError && (
          <div className="auth-alert error" role="alert">
            <span>⚠️ {activeError}</span>
          </div>
        )}

        <form onSubmit={handleSignupSubmit} className="auth-form" noValidate>
          <label className="form-field">
            <span>Full Name (Optional)</span>
            <input
              type="text"
              placeholder="Nurlan Tlek"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              disabled={actionLoading}
            />
          </label>

          <label className="form-field">
            <span>Email Address *</span>
            <input
              type="email"
              placeholder="developer@techvault.kz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={actionLoading}
            />
          </label>

          <label className="form-field">
            <span>Password (min. 6 characters) *</span>
            <input
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={actionLoading}
            />
          </label>

          <label className="form-field">
            <span>Confirm Password *</span>
            <input
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={actionLoading}
            />
          </label>

          <div className="validation-checklist" aria-live="polite">
            <div className={`check-item ${passwordChecks.minLength ? 'valid' : ''}`}>
              {passwordChecks.minLength ? '✓' : '○'} At least 6 characters
            </div>
            <div className={`check-item ${passwordChecks.hasLetterAndNumber ? 'valid' : ''}`}>
              {passwordChecks.hasLetterAndNumber ? '✓' : '○'} Contains letters &amp; numbers
            </div>
            <div className={`check-item ${passwordChecks.matchesConfirm ? 'valid' : ''}`}>
              {passwordChecks.matchesConfirm ? '✓' : '○'} Passwords match
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={actionLoading}
          >
            {actionLoading ? 'Creating Firebase Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or sign up with Google</span>
        </div>

        <button
          type="button"
          className="btn btn-google btn-block"
          onClick={handleGoogleSignup}
          disabled={actionLoading}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{ marginRight: '8px', flexShrink: 0 }}
          >
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.4 7.4 23 12 23z"
            />
          </svg>
          Sign Up with Google
        </button>

        <div className="auth-footer-links">
          <p>
            Already have an account?{' '}
            <Link to="/login" state={location.state}>
              Sign in (/login) →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
