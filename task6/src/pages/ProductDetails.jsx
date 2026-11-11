import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProductDetails } from '../hooks/useProductDetails.js';
import Card from '../components/Card.jsx';
import Loader from '../components/Loader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import ProductFormModal from '../components/ProductFormModal.jsx';

/**
 * /products/:id & /items/:id — Dynamic Hardware SKU Detail Page.
 * Uses useParams() and cached fetchItemById() with stale request cancellation
 * and supports Edit / Delete mutations that invalidate ['products'] cache keys.
 */
export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    item,
    relatedItems,
    cacheMeta,
    loading,
    mutating,
    error,
    isInvalidId,
    isNotFound,
    retry,
    updateCurrentItem,
    deleteCurrentItem,
  } = useProductDetails(id);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/products');
    }
  };

  const handleDelete = async () => {
    await deleteCurrentItem();
    navigate('/products', { replace: true });
  };

  const handleSaveEdit = async (updates) => {
    const updated = await updateCurrentItem(updates);
    if (updated) {
      setStatusMessage(
        `Updated SKU #${updated.id} and invalidated ['products'] cache entries.`
      );
    }
  };

  if (loading) {
    return <Loader fullPage message={`Loading hardware telemetry for SKU #${id}...`} />;
  }

  if (error || !item) {
    return (
      <div className="detail-error-container">
        <ErrorMessage
          title={
            isInvalidId
              ? '400 — Invalid Hardware ID Format'
              : isNotFound
              ? '404 — Hardware SKU Not Found'
              : 'Error Loading Item Details'
          }
          message={error}
          onRetry={!isInvalidId && !isNotFound ? retry : undefined}
          showCatalogLink
          showHomeLink
        />
      </div>
    );
  }

  const numericId = item.id;
  const prevId = numericId > 1 ? numericId - 1 : 24;
  const nextId = numericId < 24 ? numericId + 1 : 1;

  const originalPrice =
    item.discountPercentage > 0
      ? Math.round(item.price / (1 - item.discountPercentage / 100))
      : null;

  return (
    <div className="product-details-page">
      <div className="details-top-nav">
        <div className="details-nav-left">
          <button type="button" className="btn btn-outline btn-sm" onClick={handleGoBack}>
            ← Back
          </button>
          <Link to="/products" className="btn btn-ghost btn-sm">
            All Products
          </Link>
          {cacheMeta && (
            <span
              className={`cache-source-badge ${
                cacheMeta.source === 'cache-hit' ? 'badge-hit' : 'badge-network'
              }`}
            >
              {cacheMeta.source === 'cache-hit'
                ? `⚡ CACHE HIT: ["products","detail",{"id":${item.id}}]`
                : `🌐 NETWORK FETCH: ["products","detail",{"id":${item.id}}]`}
            </span>
          )}
        </div>

        <div className="details-nav-right">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setEditModalOpen(true)}
            disabled={mutating}
          >
            ✎ Edit SKU
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={mutating}
          >
            🗑 Delete SKU
          </button>
          <Link to={`/products/${prevId}`} className="btn btn-outline btn-sm">
            ‹ Prev (#{prevId})
          </Link>
          <Link to={`/products/${nextId}`} className="btn btn-outline btn-sm">
            Next (#{nextId}) ›
          </Link>
        </div>
      </div>

      {statusMessage && (
        <div className="mutation-toast" role="status">
          <span>✅ {statusMessage}</span>
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => setStatusMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      <section className="details-hero-card">
        <div className="details-media-col">
          <img src={item.thumbnail} alt={item.title} className="details-main-image" />
          <div className="details-tags-row">
            {(item.tags || []).map((tag) => (
              <Link
                key={tag}
                to={`/products?q=${encodeURIComponent(tag)}`}
                className="tag-chip"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>

        <div className="details-info-col">
          <div className="details-badges-row">
            <Link
              to={`/products?category=${encodeURIComponent(item.category)}`}
              className="card-category-pill"
            >
              {item.category}
            </Link>
            <span className="card-sku">SKU: {item.sku}</span>
            <span className="status-badge status-in-stock">
              {item.availabilityStatus}
            </span>
          </div>

          <p className="details-brand">{item.brand} · Release {item.releaseYear}</p>
          <h1 className="details-title">{item.title}</h1>
          <p className="details-description">{item.description}</p>

          <div className="details-price-banner">
            <div>
              <span className="details-price-current">
                ${Number(item.price).toLocaleString()}
              </span>
              {originalPrice && (
                <span className="details-price-original">
                  ${originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <div className="details-rating-pill">
              ★ {Number(item.rating).toFixed(2)} / 5.00 · {item.stock} units in vault
            </div>
          </div>

          <div className="specs-highlight-box">
            <strong>Core Hardware Configuration</strong>
            <p>{item.specs}</p>
          </div>
        </div>
      </section>

      <section className="details-attributes-section">
        <h2>Complete Technical &amp; Commercial Specifications (12 Attributes)</h2>
        <div className="attributes-grid">
          <div className="attr-cell">
            <span>1. Item ID &amp; SKU</span>
            <strong>#{item.id} · {item.sku}</strong>
          </div>
          <div className="attr-cell">
            <span>2. Manufacturer Brand</span>
            <strong>{item.brand}</strong>
          </div>
          <div className="attr-cell">
            <span>3. Hardware Category</span>
            <strong>{item.category}</strong>
          </div>
          <div className="attr-cell">
            <span>4. Unit Price &amp; Discount</span>
            <strong>${item.price.toLocaleString()} (-{item.discountPercentage}%)</strong>
          </div>
          <div className="attr-cell">
            <span>5. Telemetry Rating</span>
            <strong>★ {Number(item.rating).toFixed(2)} / 5.0</strong>
          </div>
          <div className="attr-cell">
            <span>6. Vault Stock &amp; Status</span>
            <strong>{item.stock} units ({item.availabilityStatus})</strong>
          </div>
          <div className="attr-cell">
            <span>7. Chassis Weight</span>
            <strong>{item.weight}</strong>
          </div>
          <div className="attr-cell">
            <span>8. Physical Dimensions</span>
            <strong>{item.dimensions}</strong>
          </div>
          <div className="attr-cell">
            <span>9. Warranty Protection</span>
            <strong>{item.warrantyInformation}</strong>
          </div>
          <div className="attr-cell">
            <span>10. Logistics &amp; Shipping</span>
            <strong>{item.shippingInformation}</strong>
          </div>
          <div className="attr-cell">
            <span>11. Return Policy</span>
            <strong>{item.returnPolicy}</strong>
          </div>
          <div className="attr-cell">
            <span>12. MOQ &amp; Release Year</span>
            <strong>{item.minimumOrderQuantity} unit · {item.releaseYear}</strong>
          </div>
        </div>
      </section>

      <section className="details-reviews-section">
        <h2>Verified Engineering Reviews ({(item.reviews || []).length})</h2>
        <div className="reviews-grid">
          {(item.reviews || []).map((rev, idx) => (
            <div key={idx} className="review-card">
              <div className="review-top">
                <strong>{rev.reviewer}</strong>
                <span className="review-stars">★ {rev.rating}</span>
              </div>
              <p className="review-comment">&ldquo;{rev.comment}&rdquo;</p>
              <span className="review-date">Verified Deployment · {rev.date}</span>
            </div>
          ))}
        </div>
      </section>

      {relatedItems.length > 0 && (
        <section className="related-items-section">
          <div className="section-heading-row">
            <h2>Related {item.category} Hardware</h2>
            <Link to={`/products?category=${encodeURIComponent(item.category)}`} className="text-link">
              View all {item.category} →
            </Link>
          </div>
          <div className="products-grid">
            {relatedItems.map((rel) => (
              <Card key={rel.id} item={rel} />
            ))}
          </div>
        </section>
      )}

      <ProductFormModal
        isOpen={editModalOpen}
        initialItem={item}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleSaveEdit}
        submitting={mutating}
      />
    </div>
  );
}
