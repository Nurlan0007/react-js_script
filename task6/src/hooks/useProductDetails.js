import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchItemById, updateItem, deleteItem } from '../services/service.js';

/**
 * Custom hook for fetching a single hardware item by ID with caching,
 * stale-request cancellation (AbortController + sequence ID), and mutations.
 */
export function useProductDetails(id) {
  const [item, setItem] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [cacheMeta, setCacheMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const forceRefreshRef = useRef(false);
  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;
    const requestId = ++latestRequestIdRef.current;
    const shouldForceRefresh = forceRefreshRef.current;
    forceRefreshRef.current = false;

    async function loadDetail() {
      setLoading(true);
      setError(null);
      setErrorCode(null);

      try {
        const result = await fetchItemById(id, {
          signal: controller.signal,
          forceRefresh: shouldForceRefresh,
        });

        if (!isCurrent || requestId !== latestRequestIdRef.current) return;

        setItem(result.item);
        setRelatedItems(result.relatedItems || []);
        setCacheMeta(result.cacheMeta || null);
      } catch (err) {
        if (err.name === 'AbortError' || !isCurrent || requestId !== latestRequestIdRef.current) {
          return;
        }
        setItem(null);
        setRelatedItems([]);
        setError(err.message || 'Unable to load hardware item details.');
        setErrorCode(err.code || 'ERROR');
      } finally {
        if (isCurrent && requestId === latestRequestIdRef.current) {
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

  const retry = useCallback((force = false) => {
    forceRefreshRef.current = Boolean(force);
    setRetryTrigger((prev) => prev + 1);
  }, []);

  const handleUpdate = useCallback(
    async (updates) => {
      if (!item) return null;
      setMutating(true);
      try {
        const updated = await updateItem(item.id, updates);
        setRetryTrigger((prev) => prev + 1);
        return updated;
      } finally {
        setMutating(false);
      }
    },
    [item]
  );

  const handleDelete = useCallback(async () => {
    if (!item) return null;
    setMutating(true);
    try {
      return await deleteItem(item.id);
    } finally {
      setMutating(false);
    }
  }, [item]);

  return {
    item,
    relatedItems,
    cacheMeta,
    loading,
    mutating,
    error,
    errorCode,
    isInvalidId: errorCode === 'INVALID_ID',
    isNotFound: errorCode === 'NOT_FOUND',
    retry,
    updateCurrentItem: handleUpdate,
    deleteCurrentItem: handleDelete,
  };
}

export default useProductDetails;
