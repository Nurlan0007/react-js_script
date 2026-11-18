import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable hardware product card.
 * Includes optional Edit and Delete actions so users/instructors can trigger
 * CRUD mutations and observe automatic server-data cache invalidation.
 */
export default function Card({ item, onEdit, onDelete }) {
  if (!item) return null;

  const statusClass =
    item.availabilityStatus === 'In Stock'
      ? 'status-in-stock'
      : item.availabilityStatus === 'Low Stock'
      ? 'status-low-stock'
      : 'status-pre-order';

  const originalPrice =
    item.discountPercentage > 0
      ? Math.round(item.price / (1 - item.discountPercentage / 100))
      : null;

  return (
    <article className="product-card">
      <div className="card-media">
        <Link to={`/products/${item.id}`} className="card-image-link">
          <img
            src={item.thumbnail}
            alt={item.title}
            className="card-thumbnail"
            loading="lazy"
          />
        </Link>
        <div className="card-badges">
          <span className={`status-badge ${statusClass}`}>
            {item.availabilityStatus}
          </span>
          {item.discountPercentage > 0 && (
            <span className="discount-badge">-{item.discountPercentage}%</span>
          )}
        </div>
      </div>

      <div className="card-body">
        <div className="card-meta-row">
          <Link
            to={`/products?category=${encodeURIComponent(item.category)}`}
            className="card-category-pill"
          >
            {item.category}
          </Link>
          <span className="card-sku">{item.sku}</span>
        </div>

        <p className="card-brand">{item.brand}</p>

        <h3 className="card-title">
          <Link to={`/products/${item.id}`}>{item.title}</Link>
        </h3>

        <p className="card-specs">{item.specs}</p>

        <div className="card-telemetry-row">
          <span className="card-rating" title={`Rating: ${item.rating} out of 5`}>
            ★ {Number(item.rating).toFixed(2)}
          </span>
          <span className="card-stock">
            {item.stock > 0 ? `${item.stock} units in vault` : 'Pre-order batch'}
          </span>
        </div>

        <div className="card-footer">
          <div className="card-price-group">
            <span className="card-price">${Number(item.price).toLocaleString()}</span>
            {originalPrice && (
              <span className="card-original-price">
                ${originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          <div className="card-actions-group">
            {onEdit && (
              <button
                type="button"
                className="btn-icon-action"
                onClick={() => onEdit(item)}
                title="Edit SKU (Invalidates Cache)"
              >
                ✎
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="btn-icon-action danger"
                onClick={() => onDelete(item)}
                title="Delete SKU (Invalidates Cache)"
              >
                🗑
              </button>
            )}
            <Link to={`/products/${item.id}`} className="btn btn-primary btn-sm">
              View Details →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
