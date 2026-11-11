import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PRODUCT_CATEGORIES, AVAILABILITY_STATUSES } from '../services/service.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useProducts } from '../hooks/useProducts.js';
import Card from '../components/Card.jsx';
import Pagination from '../components/Pagination.jsx';
import Loader from '../components/Loader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import CacheInspectorBar from '../components/CacheInspectorBar.jsx';
import ProductFormModal from '../components/ProductFormModal.jsx';

/**
 * /products & /items — Interactive Hardware Catalog with:
 * - Two-way URL query string synchronization via useSearchParams
 * - Server-data caching with structured query keys and 60s TTL expiration
 * - Create / Edit / Delete SKU mutations that automatically invalidate the cache
 * - Stale request protection via AbortController + sequence IDs
 */
export default function ProductsList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const status = searchParams.get('status') || 'all';
  const minRating = searchParams.get('minRating') || '0';
  const sort = searchParams.get('sort') || 'featured';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.max(1, parseInt(searchParams.get('limit') || '6', 10) || 6);

  const [searchInput, setSearchInput] = useState(urlQuery);
  const [simulateError, setSimulateError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [mutationBanner, setMutationBanner] = useState(null);

  const debouncedSearch = useDebounce(searchInput, 220);

  // Keep search input synchronized when user clicks browser Back/Forward
  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

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

  // Push debounced search query to URL
  useEffect(() => {
    if (debouncedSearch !== urlQuery) {
      updateUrlParams({ q: debouncedSearch }, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const {
    items,
    total,
    totalPages,
    cacheMeta,
    loading,
    mutating,
    error,
    retry,
    createProduct,
    updateProduct,
    deleteProduct,
    resetCatalog,
  } = useProducts({
    q: urlQuery,
    category,
    status,
    minRating,
    sort,
    page,
    limit,
    simulateError,
  });

  const handleResetFilters = () => {
    setSearchInput('');
    setSimulateError(false);
    setSearchParams({}, { replace: false });
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSaveModal = async (payload) => {
    if (editingItem) {
      const updated = await updateProduct(editingItem.id, payload);
      setMutationBanner(
        `Updated "${updated.title}" (#${updated.id}) → Invalidated ['products'] cache & refetched fresh catalog.`
      );
    } else {
      const created = await createProduct(payload);
      setMutationBanner(
        `Created new SKU "${created.title}" (#${created.id}) → Invalidated ['products'] cache & refetched fresh catalog.`
      );
    }
  };

  const handleDeleteClick = async (item) => {
    const res = await deleteProduct(item.id);
    setMutationBanner(
      `Deleted "${item.title}" (#${res.deletedId}) → Invalidated ['products'] cache (${res.remainingCount} SKUs remaining).`
    );
  };

  const handleResetCatalogClick = async () => {
    await resetCatalog();
    setMutationBanner(
      'Restored all 24 default hardware SKUs and invalidated all cached ["products"] queries.'
    );
  };

  return (
    <div className="catalog-page">
      <header className="page-header-banner">
        <div>
          <span className="eyebrow-badge">Server Data &amp; Query Caching</span>
          <h1 className="page-title">Hardware Inventory Catalog</h1>
          <p className="page-subtitle">
            Filter, sort, paginate, or mutate SKUs. Repeated filter combinations resolve
            instantly from cache; Create/Update/Delete operations invalidate the cache.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className={`btn btn-sm ${simulateError ? 'btn-danger' : 'btn-outline'}`}
            onClick={() => setSimulateError((prev) => !prev)}
          >
            {simulateError ? 'Disable Simulated Error' : 'Test API Error State'}
          </button>
        </div>
      </header>

      <CacheInspectorBar
        cacheMeta={cacheMeta}
        onForceRefresh={() => retry(true)}
        onOpenCreateModal={handleOpenCreate}
        onResetCatalog={handleResetCatalogClick}
        mutating={mutating}
      />

      {mutationBanner && (
        <div className="mutation-toast" role="status">
          <span>✅ {mutationBanner}</span>
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => setMutationBanner(null)}
          >
            ✕
          </button>
        </div>
      )}

      <section className="filters-panel" aria-label="Catalog filters">
        <div className="filters-grid">
          <label className="filter-control search-control">
            <span>Keyword Search (Title, Brand, SKU, Specs)</span>
            <input
              type="search"
              placeholder="Search e.g. OLED, M3 Max, Titanium, Sony..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>

          <label className="filter-control">
            <span>Category</span>
            <select
              value={category}
              onChange={(e) => updateUrlParams({ category: e.target.value })}
            >
              <option value="all">All Categories (6)</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-control">
            <span>Availability Status</span>
            <select
              value={status}
              onChange={(e) => updateUrlParams({ status: e.target.value })}
            >
              <option value="all">All Statuses</option>
              {AVAILABILITY_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-control">
            <span>Minimum Rating</span>
            <select
              value={minRating}
              onChange={(e) => updateUrlParams({ minRating: e.target.value })}
            >
              <option value="0">Any Rating</option>
              <option value="4.7">★ 4.70 &amp; above</option>
              <option value="4.8">★ 4.80 &amp; above</option>
              <option value="4.9">★ 4.90 &amp; above</option>
            </select>
          </label>

          <label className="filter-control">
            <span>Sort Order</span>
            <select
              value={sort}
              onChange={(e) => updateUrlParams({ sort: e.target.value }, false)}
            >
              <option value="featured">Featured (Default ID)</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Rating: Highest First</option>
              <option value="rating-asc">Rating: Lowest First</option>
              <option value="title-asc">Title: A → Z</option>
              <option value="title-desc">Title: Z → A</option>
              <option value="stock-desc">Stock: High to Low</option>
            </select>
          </label>

          <label className="filter-control">
            <span>Items Per Page</span>
            <select
              value={String(limit)}
              onChange={(e) => updateUrlParams({ limit: e.target.value }, true)}
            >
              <option value="6">6 per page</option>
              <option value="9">9 per page</option>
              <option value="12">12 per page</option>
              <option value="24">24 per page</option>
            </select>
          </label>
        </div>

        <div className="filters-footer-bar">
          <span className="results-counter">
            Found <strong>{total}</strong> matching hardware SKU{total === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleResetFilters}
          >
            Reset All Filters
          </button>
        </div>
      </section>

      {loading ? (
        <Loader message="Querying hardware catalog service..." />
      ) : error ? (
        <ErrorMessage
          title="Catalog Fetch Error"
          message={error}
          onRetry={() => {
            setSimulateError(false);
            retry(true);
          }}
          showHomeLink
        />
      ) : items.length === 0 ? (
        <div className="empty-state-box">
          <h3>No Matching Hardware SKUs Found</h3>
          <p>
            No products matched your current filter combination. Try clearing your search
            query or resetting filters.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleResetFilters}>
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {items.map((item) => (
              <Card
                key={item.id}
                item={item}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteClick}
              />
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

      <ProductFormModal
        isOpen={modalOpen}
        initialItem={editingItem}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveModal}
        submitting={mutating}
      />
    </div>
  );
}
