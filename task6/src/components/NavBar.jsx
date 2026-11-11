import React, { useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCacheInspector } from '../hooks/useCacheInspector.js';

/**
 * Sticky top navigation bar.
 * Dynamically displays Login / Sign Up when unauthenticated,
 * or Profile (with user email badge) / Logout when authenticated.
 */
export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, actionLoading } = useAuth();
  const { stats, activeEntriesCount } = useCacheInspector();

  const isCatalogActive =
    location.pathname.startsWith('/products') || location.pathname.startsWith('/items');

  const closeMenu = () => setMobileMenuOpen(false);

  const handleLogoutClick = async () => {
    closeMenu();
    try {
      await logout();
      navigate('/login');
    } catch {
      // Handled by AuthContext
    }
  };

  return (
    <header className="navbar-header">
      <div className="container navbar-inner">
        <Link to="/" className="brand-logo" onClick={closeMenu}>
          <span className="brand-icon" aria-hidden="true">
            ⚡
          </span>
          <div className="brand-text">
            <span className="brand-name">TechVault</span>
            <span className="brand-tag">Firebase Auth &amp; Cache v2.0</span>
          </div>
        </Link>

        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <nav className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Home
          </NavLink>

          <NavLink
            to="/products"
            className={`nav-item ${isCatalogActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Products
            <span className="nav-cache-pill" title="Cached query entries">
              {activeEntriesCount} cached · {stats.hits} hits
            </span>
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            About
          </NavLink>

          <div className="navbar-auth-group">
            {isAuthenticated && user ? (
              <>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `nav-item nav-profile-pill ${isActive ? 'active' : ''}`
                  }
                  onClick={closeMenu}
                >
                  <span className="status-dot online" aria-hidden="true" />
                  <span className="nav-profile-email">{user.email}</span>
                  <span className="nav-profile-label">Profile</span>
                </NavLink>

                <button
                  type="button"
                  className="btn btn-outline btn-sm nav-logout-btn"
                  onClick={handleLogoutClick}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Signing out...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `nav-item nav-login-link ${isActive ? 'active' : ''}`
                  }
                  onClick={closeMenu}
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  className={({ isActive }) =>
                    `nav-item nav-cta ${isActive ? 'active' : ''}`
                  }
                  onClick={closeMenu}
                >
                  Sign Up
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
