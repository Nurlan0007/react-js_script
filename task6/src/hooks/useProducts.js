import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
  resetCatalogToDefault,
} from '../services/service.js';

/**
 * Custom hook for querying paginated, filtered, and cached products.
 * Prevents outdated requests from overwriting newer results via AbortController
 * and monotonically increasing requestId sequence guards.
 * Exposes CRUD mutation helpers that automatically invalidate the cache and refetch.
 */
export function useProducts({
  q = '',
  category = 'all',
  status = 'all',
  minRating = '0',
  sort = 'featured',
  page = 1,
  limit = 6,
  simulateError = false,
}) {
  const [data, setData] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: 6,
    totalPages: 1,
    cacheMeta: null,
  });
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const forceRefreshRef = useRef(false);
  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;
    const requestId = ++latestRequestIdRef.current;
    const shouldForceRefresh = forceRefreshRef.current;
    forceRefreshRef.current = false;

    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchItems(
          { q, category, status, minRating, sort, page, limit, simulateError },
          { signal: controller.signal, forceRefresh: shouldForceRefresh }
        );

        // Guard against outdated/stale requests completing out of order
        if (!isCurrent || requestId !== latestRequestIdRef.current) return;

        setData({
          items: result.items || [],
          total: result.total || 0,
          page: result.page || 1,
          limit: result.limit || limit,
          totalPages: result.totalPages || 1,
          cacheMeta: result.cacheMeta || null,
        });
      } catch (err) {
        if (err.name === 'AbortError' || !isCurrent || requestId !== latestRequestIdRef.current) {
          return;
        }
        setError(err.message || 'Failed to load products from server.');
      } finally {
        if (isCurrent && requestId === latestRequestIdRef.current) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [q, category, status, minRating, sort, page, limit, simulateError, refreshIndex]);

  const retry = useCallback((force = false) => {
    forceRefreshRef.current = Boolean(force);
    setRefreshIndex((prev) => prev + 1);
  }, []);

  const handleCreateItem = useCallback(async (payload) => {
    setMutating(true);
    try {
      const created = await createItem(payload);
      // Cache was invalidated inside createItem(); trigger refetch
      setRefreshIndex((prev) => prev + 1);
      return created;
    } finally {
      setMutating(false);
    }
  }, []);

  const handleUpdateItem = useCallback(async (id, updates) => {
    setMutating(true);
    try {
      const updated = await updateItem(id, updates);
      // Cache was invalidated inside updateItem(); trigger refetch
      setRefreshIndex((prev) => prev + 1);
      return updated;
    } finally {
      setMutating(false);
    }
  }, []);

  const handleDeleteItem = useCallback(async (id) => {
    setMutating(true);
    try {
      const res = await deleteItem(id);
      // Cache was invalidated inside deleteItem(); trigger refetch
      setRefreshIndex((prev) => prev + 1);
      return res;
    } finally {
      setMutating(false);
    }
  }, []);

  const handleResetCatalog = useCallback(async () => {
    setMutating(true);
    try {
      const res = await resetCatalogToDefault();
      setRefreshIndex((prev) => prev + 1);
      return res;
    } finally {
      setMutating(false);
    }
  }, []);

  return {
    items: data.items,
    total: data.total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
    cacheMeta: data.cacheMeta,
    loading,
    mutating,
    error,
    retry,
    createProduct: handleCreateItem,
    updateProduct: handleUpdateItem,
    deleteProduct: handleDeleteItem,
    resetCatalog: handleResetCatalog,
  };
}

export default useProducts;
