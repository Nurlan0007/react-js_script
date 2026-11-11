import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <span className="eyebrow-badge">404 — Route Not Found</span>
        <h1>Page Not Found</h1>
        <p>
          No route matches <code>{location.pathname}</code> in the TechVault router tree.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
          <Link to="/products" className="btn btn-outline">
            Browse All Products
          </Link>
          <Link to="/profile" className="btn btn-outline">
            Protected Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
