import { useState, useEffect, useCallback } from 'react';
import { fetchItemById } from '../services/service.js';

/**
 * Custom hook to fetch a single item by ID with stale request protection,
 * invalid ID detection, missing item handling, and retry support.
 */
export function useProductDetails(id) {
  const [item, setItem] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const retry = useCallback(() => {
    setRetryTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;

    async function loadDetail() {
      setLoading(true);
      setError(null);
      setErrorCode(null);

      try {
        const result = await fetchItemById(id, { signal: controller.signal });
        // Ignore stale responses if component unmounted or ID param changed
        if (isCurrent) {
          setItem(result.item);
          setRelatedItems(result.relatedItems || []);
        }
      } catch (err) {
        if (err.name === 'AbortError' || !isCurrent) {
          return;
        }
        setItem(null);
        setRelatedItems([]);
        setError(err.message || 'Unable to load item details.');
        setErrorCode(err.code || 'ERROR');
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [id, retryTrigger]);

  return {
    item,
    relatedItems,
    loading,
    error,
    errorCode,
    isInvalidId: errorCode === 'INVALID_ID',
    isNotFound: errorCode === 'NOT_FOUND',
    retry
  };
}
