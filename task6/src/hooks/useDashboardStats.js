import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchAllItemsForDashboard, PRODUCT_CATEGORIES, AVAILABILITY_STATUSES } from '../services/service.js';

/**
 * Fetches catalog telemetry via QueryCacheService and calculates 6 live KPI metrics
 * and 4 multi-dimensional breakdowns in real time.
 */
export function useDashboardStats({
  selectedCategory = 'all',
  selectedStatus = 'all',
  maxPrice = 3500,
}) {
  const [allItems, setAllItems] = useState([]);
  const [cacheMeta, setCacheMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const forceRefreshRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;
    const shouldForceRefresh = forceRefreshRef.current;
    forceRefreshRef.current = false;

    async function loadDashboardData() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAllItemsForDashboard({
          signal: controller.signal,
          forceRefresh: shouldForceRefresh,
        });
        if (!isCurrent) return;
        setAllItems(result.items || []);
        setCacheMeta(result.cacheMeta || null);
      } catch (err) {
        if (err.name === 'AbortError' || !isCurrent) return;
        setError(err.message || 'Failed to load dashboard telemetry.');
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [refreshCount]);

  const refreshDashboard = useCallback((force = true) => {
    forceRefreshRef.current = Boolean(force);
    setRefreshCount((c) => c + 1);
  }, []);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesStatus =
        selectedStatus === 'all' || item.availabilityStatus === selectedStatus;
      const matchesPrice = item.price <= Number(maxPrice);
      return matchesCategory && matchesStatus && matchesPrice;
    });
  }, [allItems, selectedCategory, selectedStatus, maxPrice]);

  const stats = useMemo(() => {
    const count = filteredItems.length;
    if (count === 0) {
      return {
        totalItems: 0,
        totalInventoryValue: 0,
        averagePrice: 0,
        averageRating: '0.00',
        lowStockCount: 0,
        averageDiscount: '0.0',
      };
    }

    const totalInventoryValue = filteredItems.reduce(
      (sum, item) => sum + item.price * Math.max(1, item.stock),
      0
    );
    const sumPrice = filteredItems.reduce((sum, item) => sum + item.price, 0);
    const sumRating = filteredItems.reduce((sum, item) => sum + item.rating, 0);
    const sumDiscount = filteredItems.reduce(
      (sum, item) => sum + (item.discountPercentage || 0),
      0
    );
    const lowStockCount = filteredItems.filter((item) => item.stock < 10).length;

    return {
      totalItems: count,
      totalInventoryValue,
      averagePrice: Math.round(sumPrice / count),
      averageRating: (sumRating / count).toFixed(2),
      lowStockCount,
      averageDiscount: (sumDiscount / count).toFixed(1),
    };
  }, [filteredItems]);

  const categoryBreakdown = useMemo(() => {
    const total = Math.max(1, filteredItems.length);
    return PRODUCT_CATEGORIES.map((category) => {
      const matching = filteredItems.filter((i) => i.category === category);
      const count = matching.length;
      const share = filteredItems.length > 0 ? Math.round((count / total) * 100) : 0;
      const avgPrice =
        count > 0
          ? Math.round(matching.reduce((s, i) => s + i.price, 0) / count)
          : 0;
      const avgRating =
        count > 0
          ? (matching.reduce((s, i) => s + i.rating, 0) / count).toFixed(2)
          : '0.00';
      return { category, count, share, avgPrice, avgRating };
    });
  }, [filteredItems]);

  const statusBreakdown = useMemo(() => {
    return AVAILABILITY_STATUSES.map((status) => {
      const matching = filteredItems.filter((i) => i.availabilityStatus === status);
      const totalUnits = matching.reduce((s, i) => s + i.stock, 0);
      return {
        status,
        count: matching.length,
        totalUnits,
      };
    });
  }, [filteredItems]);

  const priceTierBreakdown = useMemo(() => {
    const tiers = [
      { label: 'Essential (< $500)', min: 0, max: 499, count: 0 },
      { label: 'Performance ($500 – $1,299)', min: 500, max: 1299, count: 0 },
      { label: 'Flagship ($1,300+)', min: 1300, max: Infinity, count: 0 },
    ];
    filteredItems.forEach((item) => {
      const tier = tiers.find((t) => item.price >= t.min && item.price <= t.max);
      if (tier) tier.count += 1;
    });
    const total = Math.max(1, filteredItems.length);
    return tiers.map((t) => ({
      ...t,
      share: filteredItems.length > 0 ? Math.round((t.count / total) * 100) : 0,
    }));
  }, [filteredItems]);

  const topRankedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => b.rating - a.rating).slice(0, 6);
  }, [filteredItems]);

  return {
    allItemsCount: allItems.length,
    filteredItems,
    stats,
    categoryBreakdown,
    statusBreakdown,
    priceTierBreakdown,
    topRankedItems,
    cacheMeta,
    loading,
    error,
    refreshDashboard,
  };
}

export default useDashboardStats;
