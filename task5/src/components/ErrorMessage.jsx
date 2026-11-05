import React from 'react';
import { Link } from 'react-router-dom';

export default function ErrorMessage({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while communicating with the API.',
  onRetry,
  showCatalogLink = false,
  showHomeLink = false
}) {
  return (
    <div className="error-box" role="alert">
      <div className="error-icon" aria-hidden="true">⚠️</div>
      <h2 className="error-title">{title}</h2>
      <p className="error-message">{message}</p>
      <div className="error-actions">
        {onRetry && (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            ↻ Try Again
          </button>
        )}
        {showCatalogLink && (
          <Link to="/products" className="btn btn-secondary">
            ← All Products
          </Link>
        )}
        {showHomeLink && (
          <Link to="/" className="btn btn-outline">
            🏠 Go Home
          </Link>
        )}
      </div>
    </div>
  );
}
