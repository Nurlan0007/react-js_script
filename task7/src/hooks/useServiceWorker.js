import { useCallback, useEffect, useState } from 'react';

let updateRequested = false; // set when the user clicks "Update"

/**
 * Registers public/sw.js (production build only) and tracks when a new version
 * of the app has been installed and is waiting to be activated.
 */
export function useServiceWorker() {
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return undefined;

    // On the very first install the SW also takes control (clients.claim), which must NOT
    // reload the page. Any later controller change means a new version is active -> reload.
    const hadController = Boolean(navigator.serviceWorker.controller);
    const handleControllerChange = () => {
      if (hadController || updateRequested) window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        // A new version may already be waiting from a previous visit.
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
        }
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            // "installed" + an existing controller = an update (not the first install)
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
            }
          });
        });
      })
      .catch(() => {
        // The app still works without a Service Worker.
      });

    return () =>
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
  }, []);

  // Tells the waiting SW to activate -> "controllerchange" -> page reloads.
  const applyUpdate = useCallback(() => {
    updateRequested = true;
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
  }, [waitingWorker]);

  return { updateAvailable: Boolean(waitingWorker), applyUpdate };
}
