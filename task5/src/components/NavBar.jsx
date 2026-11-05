import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Highlight "Products" when visiting either /products or /items
  const isCatalogActive =
    location.pathname.startsWith('/products') || location.pathname.startsWith('/items');

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="navbar-header">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-icon" aria-hidden="true">⚡</span>
          <div className="brand-text">
            <span className="brand-title">TechVault</span>
            <span className="brand-subtitle">Hardware &amp; Analytics</span>
          </div>
        </Link>

        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <nav className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`} aria-label="Main navigation">
          <NavLink
            to="/"
            end
            onClick={closeMenu}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Home
          </NavLink>

          <NavLink
            to="/products"
            onClick={closeMenu}
            className={() => `nav-item ${isCatalogActive ? 'active' : ''}`}
          >
            Products
          </NavLink>

          <NavLink
            to="/dashboard"
            onClick={closeMenu}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/about"
            onClick={closeMenu}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            About
          </NavLink>

          <NavLink
            to="/login"
            onClick={closeMenu}
            className={({ isActive }) => `nav-item nav-item-cta ${isActive ? 'active' : ''}`}
          >
            Sign In
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
