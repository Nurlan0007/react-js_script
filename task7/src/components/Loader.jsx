import React from 'react';

export default function Loader({ message = 'Loading data...', fullPage = false }) {
  return (
    <div
      className={`loader-wrapper ${fullPage ? 'loader-fullpage' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="spinner-ring" aria-hidden="true" />
      <p className="loader-text">{message}</p>
    </div>
  );
}
