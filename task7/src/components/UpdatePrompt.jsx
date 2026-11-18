import React from 'react';
import { useServiceWorker } from '../hooks/useServiceWorker.js';

/** Registers the Service Worker and shows a banner when a new app version is ready. */
export default function UpdatePrompt() {
  const { updateAvailable, applyUpdate } = useServiceWorker();
  if (!updateAvailable) return null;

  return (
    <div className="update-prompt" role="alert">
      <span>A new version of TechVault is available.</span>
      <button type="button" className="btn btn-primary btn-sm" onClick={applyUpdate}>
        Update now
      </button>
    </div>
  );
}
