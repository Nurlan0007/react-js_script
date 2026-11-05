import React from 'react';

export default function Loader({ message = 'Loading data from API...', fullPage = false }) {
  return (
    <div className={`loader-container ${fullPage ? 'loader-fullpage' : ''}`} role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p className="loader-text">{message}</p>
    </div>
  );
}
