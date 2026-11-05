import React from 'react';

/**
 * Reusable Pagination component synchronized with URL search parameters.
 */
export default function Pagination({ page, totalPages, total, limit, onPageChange }) {
  if (totalPages <= 1 && total <= limit) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(total, page * limit);

  return (
    <div className="pagination-wrapper" role="navigation" aria-label="Pagination">
      <div className="pagination-summary">
        Showing <strong>{startItem}–{endItem}</strong> of <strong>{total}</strong> items
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Previous
        </button>

        <div className="pagination-pages">
          {pages.map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              className={`pagination-page-btn ${pageNum === page ? 'active' : ''}`}
              aria-current={pageNum === page ? 'page' : undefined}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
