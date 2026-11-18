import { useEffect, useRef, useSyncExternalStore } from 'react';

function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/** Returns true while the browser is online and re-renders when it changes. */
export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, () => navigator.onLine);
}

/**
 * Calls `callback` every time the connection comes back.
 * Used by data hooks to re-request fresh data after being offline.
 */
export function useOnReconnect(callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handleOnline = () => callbackRef.current();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);
}
