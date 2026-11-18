import { useState, useEffect, useCallback } from 'react';
import { queryCache } from '../services/cacheService.js';

/**
 * Custom hook that subscribes to the QueryCacheService telemetry store
 * and provides actions to invalidate or clear cached server responses.
 */
export function useCacheInspector() {
  const [snapshot, setSnapshot] = useState(() => queryCache.getSnapshot());

  useEffect(() => {
    const unsubscribe = queryCache.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });
    // Refresh remaining TTL countdown every 2 seconds while mounted
    const interval = setInterval(() => {
      setSnapshot(queryCache.getSnapshot());
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const invalidateProductsCache = useCallback(() => {
    return queryCache.invalidateQueries(['products']);
  }, []);

  const clearAllCache = useCallback(() => {
    return queryCache.clearAll();
  }, []);

  return {
    ...snapshot,
    invalidateProductsCache,
    clearAllCache,
  };
}

export default useCacheInspector;
