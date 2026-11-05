import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import NavBar from './NavBar.jsx';

export default function RootLayout() {
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
            <span className="brand-logo-sm">⚡</span>
            <strong>TechVault</strong>
            <span className="footer-divider">·</span>
            <span className="footer-muted">React Router &amp; Application Architecture</span>
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            <Link to="/">Home</Link>
            <Link to="/products">Products</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/about">About</Link>
            <Link to="/login">Login</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
