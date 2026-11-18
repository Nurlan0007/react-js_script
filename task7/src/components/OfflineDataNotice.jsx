import React from 'react';

/** Tells the user that the data on screen came from the Service Worker cache (offline). */
export default function OfflineDataNotice({ cacheMeta }) {
  if (!cacheMeta?.fromOfflineCache) return null;

  return (
    <div className="offline-data-notice" role="status">
      📦 You are offline — showing cached data saved during your last visit. It will refresh
      automatically when the connection returns.
    </div>
  );
}
