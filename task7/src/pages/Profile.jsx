import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCacheInspector } from '../hooks/useCacheInspector.js';

/**
 * /profile — Protected User Profile Page.
 * Displays the authenticated user's Email, Firebase UID, authentication provider,
 * session persistence details, environment variables status, and Logout action.
 * Unauthenticated visitors are automatically redirected to /login by <ProtectedRoute>.
 */
export default function Profile() {
  const { user, logout, actionLoading, firebaseEnv } = useAuth();
  const { stats, activeEntriesCount, invalidateProductsCache, clearAllCache } =
    useCacheInspector();
  const navigate = useNavigate();
  const [copiedUid, setCopiedUid] = useState(false);

  if (!user) return null;

  const handleCopyUid = async () => {
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    } catch {
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="profile-page">
      <header className="page-header-banner">
        <div>
          <span className="eyebrow-badge">Protected Route · /profile</span>
          <h1 className="page-title">Authenticated Firebase Profile</h1>
          <p className="page-subtitle">
            Verified session managed by <code>AuthContext</code> and{' '}
            <code>onAuthStateChanged</code>. Refresh this browser tab (F5) to verify
            session persistence.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/products" className="btn btn-outline">
            Manage Catalog
          </Link>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleLogout}
            disabled={actionLoading}
          >
            {actionLoading ? 'Signing out...' : 'Sign Out of Session'}
          </button>
        </div>
      </header>

      <div className="profile-grid">
        <section className="profile-card primary-identity-card">
          <div className="identity-avatar-row">
            <div className="identity-avatar" aria-hidden="true">
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="status-pill verified">● Active Firebase Session</span>
              <h2>{user.displayName || 'TechVault Engineer'}</h2>
              <p className="identity-role">
                Provider: <code>{user.providerId || 'password'}</code>
              </p>
            </div>
          </div>

          <div className="identity-fields">
            <div className="identity-field-box">
              <span className="field-label">Authenticated Email Address</span>
              <strong className="field-value mono">{user.email}</strong>
            </div>

            <div className="identity-field-box">
              <div className="field-label-row">
                <span className="field-label">Firebase User UID</span>
                <button
                  type="button"
                  className="btn-copy-chip"
                  onClick={handleCopyUid}
                >
                  {copiedUid ? '✓ Copied UID' : 'Copy UID'}
                </button>
              </div>
              <strong className="field-value mono uid-highlight">{user.uid}</strong>
            </div>

            <div className="identity-field-box">
              <span className="field-label">Session Persistence Mode</span>
              <strong className="field-value">
                {firebaseEnv.persistenceType}
              </strong>
            </div>

            <div className="identity-field-box">
              <span className="field-label">Last Authenticated Timestamp</span>
              <strong className="field-value">
                {new Date(user.lastLoginAt).toLocaleString()}
              </strong>
            </div>
          </div>
        </section>

        <section className="profile-card env-cache-card">
          <h3>Environment Variables &amp; Cache Telemetry</h3>
          <p className="card-desc">
            Configuration loaded from <code>.env.local</code> via{' '}
            <code>import.meta.env.VITE_FIREBASE_*</code> in <code>src/firebase.js</code>.
          </p>

          <div className="telemetry-kv-list">
            <div className="telemetry-kv">
              <span>VITE_FIREBASE_PROJECT_ID</span>
              <code>{firebaseEnv.projectId}</code>
            </div>
            <div className="telemetry-kv">
              <span>VITE_FIREBASE_AUTH_DOMAIN</span>
              <code>{firebaseEnv.authDomain}</code>
            </div>
            <div className="telemetry-kv">
              <span>VITE_FIREBASE_API_KEY Configured</span>
              <code>{firebaseEnv.hasApiKey ? 'Yes (Loaded)' : 'Fallback Mode'}</code>
            </div>
            <div className="telemetry-kv">
              <span>Active Cached Query Keys</span>
              <code>{activeEntriesCount} entries</code>
            </div>
            <div className="telemetry-kv">
              <span>Cache Hits / Misses / Invalidations</span>
              <code>
                {stats.hits} hits · {stats.misses} misses · {stats.invalidations} invalidations
              </code>
            </div>
          </div>

          <div className="profile-cache-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={invalidateProductsCache}
            >
              Invalidate [&apos;products&apos;] Cache
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={clearAllCache}
            >
              Purge Entire Cache Store
            </button>
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              Open Analytics →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
