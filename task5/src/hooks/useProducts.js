import { useState, useEffect, useCallback } from 'react';
import { fetchItems, CATEGORIES, AVAILABILITY_STATUSES } from '../services/service.js';

/**
 * Custom hook to fetch paginated, searched, filtered, and sorted items.
 * Handles loading, errors, empty results, and stale request cancellation via AbortController.
 */
export function useProducts({ q, category, status, minRating, sort, page, limit, simulateError }) {
  const [data, setData] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: Number(limit) || 6,
    totalPages: 1,
    categories: CATEGORIES,
    statuses: AVAILABILITY_STATUSES
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;

    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchItems(
          { q, category, status, minRating, sort, page, limit, simulateError },
          { signal: controller.signal }
        );
        if (isCurrent) {
          setData(response);
        }
      } catch (err) {
        if (err.name === 'AbortError' || !isCurrent) {
          return;
        }
        setError(err.message || 'Failed to fetch catalog items.');
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [q, category, status, minRating, sort, page, limit, simulateError, retryCount]);

  return {
    ...data,
    loading,
    error,
    retry
  };
}
