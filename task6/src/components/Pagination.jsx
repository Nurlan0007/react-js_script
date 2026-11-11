import React from 'react';

export default function Pagination({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 6,
  onPageChange,
}) {
  if (total === 0) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  const pages = Array.from({ length: totalPages }, (_, idx) => idx + 1);

  return (
    <div className="pagination-bar" role="navigation" aria-label="Catalog pagination">
      <p className="pagination-summary">
        Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of{' '}
        <strong>{total}</strong> hardware items
      </p>

      <div className="pagination-controls">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ‹ Previous
        </button>

        <div className="pagination-pages">
          {pages.map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              className={`page-num-btn ${pageNum === page ? 'active' : ''}`}
              onClick={() => onPageChange(pageNum)}
              aria-current={pageNum === page ? 'page' : undefined}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
