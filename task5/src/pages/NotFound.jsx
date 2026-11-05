import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="page-not-found">
      <div className="not-found-card">
        <div className="not-found-code">404</div>
        <h1>Page Not Found</h1>
        <p className="not-found-message">
          No route matches <code>{location.pathname}</code>. The page you requested may have been
          moved, renamed, or does not exist.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary btn-lg">
            🏠 Back to Home
          </Link>
          <Link to="/products" className="btn btn-secondary btn-lg">
            🛍️ Browse All Products
          </Link>
          <Link to="/dashboard" className="btn btn-outline btn-lg">
            📊 View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
