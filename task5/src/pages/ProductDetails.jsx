import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProductDetails } from '../hooks/useProductDetails.js';
import Card from '../components/Card.jsx';
import Loader from '../components/Loader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    item,
    relatedItems,
    loading,
    error,
    isInvalidId,
    isNotFound,
    retry
  } = useProductDetails(id);

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/products');
    }
  };

  if (loading) {
    return <Loader message={`Fetching item #${id} details from API...`} />;
  }

  if (error || !item) {
    const errorTitle = isInvalidId
      ? 'Invalid Item ID Format'
      : isNotFound
        ? 'Hardware Item Not Found'
        : 'Error Loading Item Details';

    return (
      <div className="page-details-error">
        <div className="details-top-nav">
          <button type="button" className="btn btn-outline btn-sm" onClick={handleGoBack}>
            ← Back
          </button>
          <Link to="/products" className="btn btn-secondary btn-sm">
            🛍️ All Products
          </Link>
        </div>

        <ErrorMessage
          title={errorTitle}
          message={error || `Could not find an item with ID "${id}".`}
          onRetry={!isInvalidId && !isNotFound ? retry : undefined}
          showCatalogLink
          showHomeLink
        />
      </div>
    );
  }

  const originalPrice = Math.round(item.price / (1 - (item.discountPercentage || 0) / 100));
  const statusClass =
    item.availabilityStatus === 'In Stock'
      ? 'badge-success'
      : item.availabilityStatus === 'Low Stock'
        ? 'badge-warning'
        : 'badge-info';

  const numericId = Number(item.id);

  return (
    <div className="page-product-details">
      {/* Top Navigation Bar: Back, All Items, Breadcrumbs, and Rapid ID Switcher */}
      <div className="details-top-nav">
        <div className="nav-buttons-left">
          <button type="button" className="btn btn-outline btn-sm" onClick={handleGoBack}>
            ← Back
          </button>
          <Link to="/products" className="btn btn-secondary btn-sm">
            All Products
          </Link>
          <Link
            to={`/products?category=${encodeURIComponent(item.category)}`}
            className="btn btn-outline btn-sm"
          >
            More in {item.category}
          </Link>
        </div>

        <div className="rapid-switcher" aria-label="Switch between adjacent item IDs">
          {numericId > 1 && (
            <Link to={`/products/${numericId - 1}`} className="btn btn-outline btn-sm">
              ‹ Prev (#{numericId - 1})
            </Link>
          )}
          <span className="item-id-indicator">Item #{item.id} of 24</span>
          {numericId < 24 && (
            <Link to={`/products/${numericId + 1}`} className="btn btn-outline btn-sm">
              Next (#{numericId + 1}) ›
            </Link>
          )}
        </div>
      </div>

      {/* Main Product Showcase */}
      <section className="details-hero-card">
        <div className="details-image-col">
          <img src={item.thumbnail} alt={item.title} className="details-main-image" />
          <div className="details-tags-row">
            {item.tags?.map((tag) => (
              <Link
                key={tag}
                to={`/products?q=${encodeURIComponent(tag)}`}
                className="tag-badge"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>

        <div className="details-info-col">
          <div className="details-badges-row">
            <span className="category-pill">{item.category}</span>
            <span className={`status-badge ${statusClass}`}>{item.availabilityStatus}</span>
            <span className="sku-badge">SKU: {item.sku}</span>
          </div>

          <h1 className="details-title">{item.title}</h1>
          <p className="details-brand-line">
            Manufactured by <strong>{item.brand}</strong> · Release Year{' '}
            <strong>{item.releaseYear}</strong>
          </p>

          <div className="details-rating-banner">
            <span className="rating-big">★ {item.rating.toFixed(2)} / 5.0</span>
            <span className="rating-divider">·</span>
            <span>{item.reviews?.length || 0} Verified Customer Reviews</span>
            <span className="rating-divider">·</span>
            <span>
              {item.stock > 0 ? `${item.stock} units in warehouse` : 'Pre-Order Allocation'}
            </span>
          </div>

          <div className="details-price-box">
            <div className="details-price-main">${item.price.toLocaleString()}</div>
            {item.discountPercentage > 0 && (
              <div className="details-price-discount">
                <span className="price-original">${originalPrice.toLocaleString()}</span>
                <span className="discount-pill">Save {item.discountPercentage}%</span>
              </div>
            )}
          </div>

          <p className="details-description">{item.description}</p>

          <div className="details-highlight-specs">
            <h3>Key Hardware Configuration</h3>
            <p>{item.specs}</p>
          </div>
        </div>
      </section>

      {/* 12+ Meaningful Details Specification Table */}
      <section className="details-specs-section">
        <h2>Complete Technical &amp; Commercial Specifications (12 Attributes)</h2>
        <div className="specs-grid">
          <div className="spec-item">
            <span className="spec-label">1. Product ID &amp; SKU</span>
            <span className="spec-value">#{item.id} · {item.sku}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">2. Brand / Manufacturer</span>
            <span className="spec-value">{item.brand}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">3. Hardware Category</span>
            <span className="spec-value">{item.category}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">4. Unit Price &amp; Discount</span>
            <span className="spec-value">
              ${item.price.toLocaleString()} ({item.discountPercentage}% off MSRP)
            </span>
          </div>
          <div className="spec-item">
            <span className="spec-label">5. Customer Rating</span>
            <span className="spec-value">★ {item.rating.toFixed(2)} out of 5.00</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">6. Stock &amp; Availability</span>
            <span className="spec-value">
              {item.availabilityStatus} ({item.stock} units)
            </span>
          </div>
          <div className="spec-item">
            <span className="spec-label">7. Physical Weight</span>
            <span className="spec-value">{item.weight}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">8. Dimensions (L × W × H)</span>
            <span className="spec-value">{item.dimensions}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">9. Warranty Coverage</span>
            <span className="spec-value">{item.warrantyInformation}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">10. Shipping &amp; Fulfillment</span>
            <span className="spec-value">{item.shippingInformation}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">11. Return Policy</span>
            <span className="spec-value">{item.returnPolicy}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">12. Minimum Order &amp; Release</span>
            <span className="spec-value">
              MOQ: {item.minimumOrderQuantity} unit · Model Year {item.releaseYear}
            </span>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      {item.reviews && item.reviews.length > 0 && (
        <section className="details-reviews-section">
          <h2>Verified Customer Reviews</h2>
          <div className="reviews-grid">
            {item.reviews.map((rev, index) => (
              <div key={index} className="review-card">
                <div className="review-header">
                  <strong>{rev.reviewerName}</strong>
                  <span className="review-rating">★ {rev.rating.toFixed(1)}</span>
                </div>
                <p className="review-comment">“{rev.comment}”</p>
                <span className="review-date">Reviewed on {rev.date}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Products in the Same Category */}
      {relatedItems.length > 0 && (
        <section className="section-block">
          <div className="section-header">
            <div>
              <h2 className="section-title">More in {item.category}</h2>
              <p className="section-subtitle">Explore similar hardware from the catalog</p>
            </div>
            <Link
              to={`/products?category=${encodeURIComponent(item.category)}`}
              className="btn btn-secondary btn-sm"
            >
              See All {item.category} →
            </Link>
          </div>

          <div className="cards-grid">
            {relatedItems.map((rel) => (
              <Card key={rel.id} item={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
