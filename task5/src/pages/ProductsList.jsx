import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { CATEGORIES, AVAILABILITY_STATUSES } from '../services/service.js';
import Card from '../components/Card.jsx';
import Pagination from '../components/Pagination.jsx';
import Loader from '../components/Loader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function ProductsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [simulateError, setSimulateError] = useState(false);

  // Read current filter, sort, and pagination state from URL search params
  const urlQuery = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const status = searchParams.get('status') || 'all';
  const minRating = searchParams.get('minRating') || '0';
  const sort = searchParams.get('sort') || 'featured';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.max(1, parseInt(searchParams.get('limit') || '6', 10) || 6);

  // Controlled search input with debounce for smooth URL synchronization
  const [searchInput, setSearchInput] = useState(urlQuery);
  const debouncedSearch = useDebounce(searchInput, 220);

  // Sync local search input when URL changes via browser Back/Forward or external links
  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  // Helper to update URL search parameters cleanly
  const updateUrlParams = (updates, resetPage = true) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      const strVal = String(value ?? '').trim();
      if (
        !strVal ||
        strVal === 'all' ||
        (key === 'minRating' && strVal === '0') ||
        (key === 'sort' && strVal === 'featured') ||
        (key === 'page' && strVal === '1') ||
        (key === 'limit' && strVal === '6')
      ) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, strVal);
      }
    });

    if (resetPage && !('page' in updates)) {
      nextParams.delete('page');
    }

    setSearchParams(nextParams, { replace: false });
  };

  // Push debounced search input to URL searchParams
  useEffect(() => {
    if (debouncedSearch !== urlQuery) {
      updateUrlParams({ q: debouncedSearch }, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Fetch filtered, sorted, paginated items from services/service.js
  const { items, total, totalPages, loading, error, retry } = useProducts({
    q: urlQuery,
    category,
    status,
    minRating,
    sort,
    page,
    limit,
    simulateError
  });

  const handleResetFilters = () => {
    setSearchInput('');
    setSimulateError(false);
    setSearchParams({});
  };

  const hasActiveFilters =
    Boolean(urlQuery) ||
    category !== 'all' ||
    status !== 'all' ||
    minRating !== '0' ||
    sort !== 'featured';

  return (
    <div className="page-products">
      <div className="page-header-bar">
        <div>
          <span className="hero-eyebrow">🛍️ Dynamic URL-Synchronized Catalog</span>
          <h1>Hardware &amp; Electronics Catalog</h1>
          <p className="page-subtitle">
            Search, filter, sort, and paginate items. Every control synchronizes with the URL via{' '}
            <code>useSearchParams</code> for shareable links and browser Back/Forward navigation.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/dashboard" className="btn btn-secondary btn-sm">
            📊 View Analytics
          </Link>
          <button
            type="button"
            className={`btn btn-sm ${simulateError ? 'btn-danger' : 'btn-outline'}`}
            onClick={() => setSimulateError((prev) => !prev)}
            title="Toggle simulated API failure to verify error state handling"
          >
            {simulateError ? '⚡ Disable Error Test' : '🧪 Test API Error State'}
          </button>
        </div>
      </div>

      {/* Filter, Search & Sort Control Panel */}
      <section className="filter-panel" aria-label="Catalog filters and sorting">
        <div className="filter-grid">
          {/* Search Input */}
          <div className="filter-field filter-field-search">
            <label htmlFor="catalog-search">Search Hardware</label>
            <div className="search-input-wrap">
              <input
                id="catalog-search"
                type="search"
                className="form-input"
                placeholder="Search by title, brand, SKU, or specs (e.g., OLED, M3, Sony)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  type="button"
                  className="search-clear-btn"
                  aria-label="Clear search query"
                  onClick={() => {
                    setSearchInput('');
                    updateUrlParams({ q: '' }, true);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter 1: Category */}
          <div className="filter-field">
            <label htmlFor="filter-category">Category</label>
            <select
              id="filter-category"
              className="form-select"
              value={category}
              onChange={(e) => updateUrlParams({ category: e.target.value }, true)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Availability Status */}
          <div className="filter-field">
            <label htmlFor="filter-status">Availability Status</label>
            <select
              id="filter-status"
              className="form-select"
              value={status}
              onChange={(e) => updateUrlParams({ status: e.target.value }, true)}
            >
              <option value="all">All Statuses</option>
              {AVAILABILITY_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Minimum Rating */}
          <div className="filter-field">
            <label htmlFor="filter-rating">Minimum Rating</label>
            <select
              id="filter-rating"
              className="form-select"
              value={minRating}
              onChange={(e) => updateUrlParams({ minRating: e.target.value }, true)}
            >
              <option value="0">Any Rating</option>
              <option value="4.8">★ 4.8 &amp; Up</option>
              <option value="4.7">★ 4.7 &amp; Up</option>
              <option value="4.5">★ 4.5 &amp; Up</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="filter-field">
            <label htmlFor="filter-sort">Sort By</label>
            <select
              id="filter-sort"
              className="form-select"
              value={sort}
              onChange={(e) => updateUrlParams({ sort: e.target.value }, false)}
            >
              <option value="featured">Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="discount-desc">Biggest Discount</option>
              <option value="stock-desc">Most Stock Available</option>
              <option value="title-asc">Name: A → Z</option>
              <option value="title-desc">Name: Z → A</option>
            </select>
          </div>

          {/* Items Per Page */}
          <div className="filter-field">
            <label htmlFor="filter-limit">Items / Page</label>
            <select
              id="filter-limit"
              className="form-select"
              value={String(limit)}
              onChange={(e) => updateUrlParams({ limit: e.target.value }, true)}
            >
              <option value="6">6 per page</option>
              <option value="9">9 per page</option>
              <option value="12">12 per page</option>
            </select>
          </div>
        </div>

        {/* Active URL Filter Bar */}
        <div className="filter-status-bar">
          <div className="active-filters-summary">
            <span className="results-counter">
              {loading ? 'Fetching items...' : `${total} matching item${total === 1 ? '' : 's'}`}
            </span>
            {urlQuery && <span className="active-filter-chip">Search: “{urlQuery}”</span>}
            {category !== 'all' && <span className="active-filter-chip">Category: {category}</span>}
            {status !== 'all' && <span className="active-filter-chip">Status: {status}</span>}
            {minRating !== '0' && <span className="active-filter-chip">Rating ≥ {minRating}★</span>}
          </div>

          {hasActiveFilters && (
            <button type="button" className="btn btn-outline btn-sm" onClick={handleResetFilters}>
              ✕ Reset All Filters
            </button>
          )}
        </div>
      </section>

      {/* Main Content Area: Loading / Error / Empty / Cards Grid */}
      {loading ? (
        <Loader message="Fetching filtered catalog items from API..." />
      ) : error ? (
        <ErrorMessage
          title="Unable to Load Catalog Items"
          message={error}
          onRetry={() => {
            setSimulateError(false);
            retry();
          }}
          showHomeLink
        />
      ) : items.length === 0 ? (
        <div className="empty-state-box" role="status">
          <div className="empty-icon" aria-hidden="true">🔎</div>
          <h2>No Matching Hardware Found</h2>
          <p>
            No items matched your current combination of search query and filters. Try broadening
            your criteria or resetting the filters.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleResetFilters}>
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="cards-grid">
            {items.map((item) => (
              <Card key={item.id} item={item} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={(nextPage) => updateUrlParams({ page: nextPage }, false)}
          />
        </>
      )}
    </div>
  );
}
