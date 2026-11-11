import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * /login — Email/Password login and Google Sign-In page.
 * Redirects authenticated users to /profile (or the protected page they tried to visit).
 */
export default function Login() {
  const {
    user,
    isAuthenticated,
    login,
    loginWithGoogle,
    actionLoading,
    authError,
    clearAuthError,
    firebaseEnv,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = location.state?.from?.pathname || '/profile';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, user, navigate, redirectTarget]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your account password.');
      return;
    }

    try {
      await login(trimmedEmail, password);
      navigate(redirectTarget, { replace: true });
    } catch {
      // Error state is managed by AuthContext
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearAuthError();
    try {
      await loginWithGoogle();
      navigate(redirectTarget, { replace: true });
    } catch {
      // Error state is managed by AuthContext
    }
  };

  const handleFillDemoAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLocalError(null);
    clearAuthError();
  };

  const activeError = localError || authError;

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="eyebrow-badge">Firebase Authentication</span>
          <h1 className="auth-title">Sign In to TechVault</h1>
          <p className="auth-subtitle">
            Authenticate with Email/Password or Google OAuth. Sessions persist automatically via{' '}
            <code>onAuthStateChanged</code>.
          </p>
        </div>

        {location.state?.from?.pathname && (
          <div className="auth-alert info" role="status">
            🔒 Please sign in to access the protected route{' '}
            <code>{location.state.from.pathname}</code>.
          </div>
        )}

        {activeError && (
          <div className="auth-alert error" role="alert">
            <span>⚠️ {activeError}</span>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="auth-form" noValidate>
          <label className="form-field">
            <span>Email Address</span>
            <input
              type="email"
              placeholder="nurlan.tlek@techvault.kz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={actionLoading}
            />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={actionLoading}
            />
          </label>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={actionLoading}
          >
            {actionLoading ? 'Authenticating with Firebase...' : 'Sign In with Email'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with OAuth</span>
        </div>

        <button
          type="button"
          className="btn btn-google btn-block"
          onClick={handleGoogleSignIn}
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
          {actionLoading ? 'Connecting to Google...' : 'Continue with Google'}
        </button>

        <div className="demo-credentials-box">
          <div className="demo-box-header">
            <strong>Quick Test Credentials</strong>
            <span>Pre-seeded in Firebase Auth Adapter</span>
          </div>
          <div className="demo-buttons-row">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() =>
                handleFillDemoAccount('nurlan.tlek@techvault.kz', 'TechVault2026!')
              }
            >
              Fill Nurlan Tlek Account
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleFillDemoAccount('admin@techvault.kz', 'Admin123!')}
            >
              Fill Catalog Admin
            </button>
          </div>
        </div>

        <div className="auth-footer-links">
          <p>
            Don&apos;t have an account yet?{' '}
            <Link to="/signup" state={location.state}>
              Create an account (/signup) →
            </Link>
          </p>
          <p className="auth-env-note">
            Environment: <code>{firebaseEnv.projectId}</code> ({firebaseEnv.mode})
          </p>
        </div>
      </div>
    </div>
  );
}
