import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchAllItemsForDashboard } from '../services/service.js';

/**
 * Custom hook to load catalog data for the Dashboard and compute:
 * - 6 real-time KPI statistics
 * - 3 data breakdowns (by category, by availability status, and top-ranked items)
 * dynamically filtered by interactive Dashboard controls.
 */
export function useDashboardStats({ selectedCategory = 'all', selectedStatus = 'all', maxPrice = 4000 }) {
  const [rawItems, setRawItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = useCallback(() => {
    setRefreshTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAllItemsForDashboard({ signal: controller.signal });
        if (isCurrent) {
          setRawItems(res.items);
          setCategories(res.categories);
          setStatuses(res.statuses);
        }
      } catch (err) {
        if (err.name === 'AbortError' || !isCurrent) return;
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [refreshTick]);

  // Apply interactive dashboard filters
  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      const matchesCat =
        selectedCategory === 'all' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesStatus =
        selectedStatus === 'all' ||
        item.availabilityStatus.toLowerCase() === selectedStatus.toLowerCase();
      const matchesPrice = item.price <= Number(maxPrice);
      return matchesCat && matchesStatus && matchesPrice;
    });
  }, [rawItems, selectedCategory, selectedStatus, maxPrice]);

  // Calculate 6 KPI statistics + 3 breakdowns from API data
  const analytics = useMemo(() => {
    const count = filteredItems.length;
    if (count === 0) {
      return {
        totalItems: 0,
        totalUnitsInStock: 0,
        totalInventoryValue: 0,
        averagePrice: 0,
        averageRating: 0,
        averageDiscount: 0,
        lowStockCount: 0,
        categoryBreakdown: [],
        statusBreakdown: [],
        topRankedItems: [],
        priceTierBreakdown: []
      };
    }

    const totalUnitsInStock = filteredItems.reduce((sum, item) => sum + item.stock, 0);
    const totalInventoryValue = filteredItems.reduce(
      (sum, item) => sum + item.price * Math.max(1, item.stock),
      0
    );
    const averagePrice = Math.round(
      filteredItems.reduce((sum, item) => sum + item.price, 0) / count
    );
    const averageRating = Number(
      (filteredItems.reduce((sum, item) => sum + item.rating, 0) / count).toFixed(2)
    );
    const averageDiscount = Number(
      (filteredItems.reduce((sum, item) => sum + item.discountPercentage, 0) / count).toFixed(1)
    );
    const lowStockCount = filteredItems.filter((item) => item.stock < 10).length;

    // Breakdown 1: By Category
    const categoryMap = {};
    filteredItems.forEach((item) => {
      if (!categoryMap[item.category]) {
        categoryMap[item.category] = {
          category: item.category,
          count: 0,
          totalStock: 0,
          totalPrice: 0,
          totalRating: 0
        };
      }
      categoryMap[item.category].count += 1;
      categoryMap[item.category].totalStock += item.stock;
      categoryMap[item.category].totalPrice += item.price;
      categoryMap[item.category].totalRating += item.rating;
    });

    const categoryBreakdown = Object.values(categoryMap)
      .map((entry) => ({
        category: entry.category,
        count: entry.count,
        sharePercent: Math.round((entry.count / count) * 100),
        avgPrice: Math.round(entry.totalPrice / entry.count),
        avgRating: (entry.totalRating / entry.count).toFixed(2),
        totalStock: entry.totalStock
      }))
      .sort((a, b) => b.count - a.count);

    // Breakdown 2: By Availability Status
    const statusOrder = ['In Stock', 'Low Stock', 'Pre-Order'];
    const statusBreakdown = statusOrder.map((statusLabel) => {
      const matching = filteredItems.filter((i) => i.availabilityStatus === statusLabel);
      return {
        status: statusLabel,
        count: matching.length,
        sharePercent: Math.round((matching.length / count) * 100),
        units: matching.reduce((acc, i) => acc + i.stock, 0)
      };
    });

    // Breakdown 3: Rank / Top-Rated Items Leaderboard
    const topRankedItems = [...filteredItems]
      .sort((a, b) => b.rating - a.rating || b.price - a.price)
      .slice(0, 6);

    // Breakdown 4: Price Tiers
    const tiers = [
      { label: 'Budget & Mid (< $500)', filterFn: (i) => i.price < 500 },
      { label: 'Performance ($500 – $1,299)', filterFn: (i) => i.price >= 500 && i.price < 1300 },
      { label: 'Workstation / Flagship ($1,300+)', filterFn: (i) => i.price >= 1300 }
    ];
    const priceTierBreakdown = tiers.map((t) => {
      const m = filteredItems.filter(t.filterFn);
      return {
        tier: t.label,
        count: m.length,
        sharePercent: Math.round((m.length / count) * 100)
      };
    });

    return {
      totalItems: count,
      totalUnitsInStock,
      totalInventoryValue,
      averagePrice,
      averageRating,
      averageDiscount,
      lowStockCount,
      categoryBreakdown,
      statusBreakdown,
      topRankedItems,
      priceTierBreakdown
    };
  }, [filteredItems]);

  return {
    loading,
    error,
    refresh,
    categories,
    statuses,
    totalCatalogCount: rawItems.length,
    ...analytics
  };
}
