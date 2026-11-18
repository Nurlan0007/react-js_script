import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';

/** Online / offline indicator shown in the navigation bar. */
export default function NetworkStatus() {
  const isOnline = useOnlineStatus();

  return (
    <span className={`network-status ${isOnline ? 'online' : 'offline'}`} role="status">
      <span className="network-status-dot" aria-hidden="true" />
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
}
