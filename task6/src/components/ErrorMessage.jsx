import React from 'react';
import { Link } from 'react-router-dom';

export default function ErrorMessage({
  title = 'Unable to Complete Request',
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry,
  showCatalogLink = false,
  showHomeLink = false,
}) {
  return (
    <div className="error-box" role="alert">
      <div className="error-icon" aria-hidden="true">
        ⚠️
      </div>
      <h3 className="error-title">{title}</h3>
      <p className="error-description">{message}</p>
      <div className="error-actions">
        {onRetry && (
          <button type="button" className="btn btn-primary" onClick={() => onRetry(true)}>
            Try Again
          </button>
        )}
        {showCatalogLink && (
          <Link to="/products" className="btn btn-outline">
            All Products
          </Link>
        )}
        {showHomeLink && (
          <Link to="/" className="btn btn-outline">
            Back to Home
          </Link>
        )}
      </div>
    </div>
  );
}
