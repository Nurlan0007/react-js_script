import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import NavBar from './NavBar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCacheInspector } from '../hooks/useCacheInspector.js';

/**
 * Persistent outer frame containing NavBar, <Outlet /> for nested child routes,
 * and the application footer with route shortcuts and live status indicators.
 */
export default function RootLayout() {
  const { user, isAuthenticated, firebaseEnv } = useAuth();
  const { stats, activeEntriesCount } = useCacheInspector();

  return (
    <div className="app-shell">
      <NavBar />

      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <strong>TechVault v2.0 — Server Data, Caching &amp; Firebase Auth</strong>
            <p>
              Built with React 18, React Router v6, Firebase Authentication, and Query Cache Service ·
              KBTU School of IT &amp; Engineering
            </p>
            <div className="footer-telemetry-badges">
              <span className="telemetry-chip">
                Auth: {isAuthenticated ? `Signed in (${user?.email})` : 'Guest Session'}
              </span>
              <span className="telemetry-chip">
                Project: {firebaseEnv.projectId}
              </span>
              <span className="telemetry-chip">
                Cache: {activeEntriesCount} keys ({stats.hits} hits / {stats.invalidations} invalidations)
              </span>
            </div>
          </div>

          <nav className="footer-links" aria-label="Footer navigation">
            <Link to="/">Home</Link>
            <Link to="/products">Products</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
            <Link to="/about">About</Link>
            <Link to="/non-existent-route">Test 404</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
