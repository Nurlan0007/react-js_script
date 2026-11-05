import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable Card component for displaying catalog items on the Items List, Home, and Details pages.
 */
export default function Card({ item }) {
  if (!item) return null;

  const discountedPrice = Math.round(item.price * (1 - (item.discountPercentage || 0) / 100));

  const statusBadgeClass =
    item.availabilityStatus === 'In Stock'
      ? 'badge-success'
      : item.availabilityStatus === 'Low Stock'
        ? 'badge-warning'
        : 'badge-info';

  return (
    <article className="item-card">
      <Link to={`/products/${item.id}`} className="item-card-image-link" aria-label={`View ${item.title}`}>
        <div className="item-card-image-wrapper">
          <img
            src={item.thumbnail}
            alt={item.title}
            className="item-card-image"
            loading="lazy"
          />
          <span className={`status-badge ${statusBadgeClass}`}>{item.availabilityStatus}</span>
          {item.discountPercentage > 0 && (
            <span className="discount-badge">-{item.discountPercentage}%</span>
          )}
        </div>
      </Link>

      <div className="item-card-body">
        <div className="item-card-meta">
          <Link to={`/products?category=${encodeURIComponent(item.category)}`} className="category-pill">
            {item.category}
          </Link>
          <span className="item-brand">{item.brand}</span>
        </div>

        <h3 className="item-card-title">
          <Link to={`/products/${item.id}`}>{item.title}</Link>
        </h3>

        <p className="item-card-specs">{item.specs}</p>

        <div className="item-card-rating-row">
          <span className="rating-stars" aria-label={`Rating ${item.rating} out of 5`}>
            ★ {item.rating.toFixed(2)}
          </span>
          <span className="stock-count">
            {item.stock > 0 ? `${item.stock} units left` : 'Pre-order batch'}
          </span>
        </div>

        <div className="item-card-footer">
          <div className="price-group">
            <span className="price-current">${item.price.toLocaleString()}</span>
            {item.discountPercentage > 0 && (
              <span className="price-original">
                ${Math.round(item.price / (1 - item.discountPercentage / 100)).toLocaleString()}
              </span>
            )}
          </div>

          <Link to={`/products/${item.id}`} className="btn btn-primary btn-sm">
            View Details →
          </Link>
        </div>
      </div>
    </article>
  );
}
