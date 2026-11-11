import React, { useState, useEffect } from 'react';
import { PRODUCT_CATEGORIES, AVAILABILITY_STATUSES } from '../services/service.js';

/**
 * Modal form for creating or editing a Hardware SKU.
 * Submitting this form executes a Create/Update mutation in `services/service.js`,
 * which immediately invalidates all `['products']` cache entries.
 */
export default function ProductFormModal({
  isOpen,
  initialItem = null,
  onClose,
  onSubmit,
  submitting = false,
}) {
  const isEditing = Boolean(initialItem);

  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    sku: '',
    category: 'Laptops',
    price: '1299',
    discountPercentage: '10',
    rating: '4.90',
    stock: '15',
    availabilityStatus: 'In Stock',
    specs: '',
    description: '',
  });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (initialItem) {
      setFormData({
        title: initialItem.title || '',
        brand: initialItem.brand || '',
        sku: initialItem.sku || '',
        category: initialItem.category || 'Laptops',
        price: String(initialItem.price ?? 1299),
        discountPercentage: String(initialItem.discountPercentage ?? 5),
        rating: String(initialItem.rating ?? 4.85),
        stock: String(initialItem.stock ?? 10),
        availabilityStatus: initialItem.availabilityStatus || 'In Stock',
        specs: initialItem.specs || '',
        description: initialItem.description || '',
      });
    } else {
      setFormData({
        title: 'MacStudio M4 Ultra Workstation',
        brand: 'Apple',
        sku: `TV-LPT-${Math.floor(100 + Math.random() * 899)}`,
        category: 'Laptops',
        price: '2799',
        discountPercentage: '8',
        rating: '4.95',
        stock: '12',
        availabilityStatus: 'In Stock',
        specs: '24-Core CPU, 60-Core GPU, 64GB Unified Memory, 2TB NVMe SSD',
        description:
          'High-density desktop & mobile compute node added to test automatic query cache invalidation.',
      });
    }
    setFormError(null);
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.brand.trim()) {
      setFormError('Product title and brand are required.');
      return;
    }
    const priceNum = Number(formData.price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setFormError('Price must be a valid positive number.');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        price: priceNum,
        discountPercentage: Number(formData.discountPercentage) || 0,
        rating: Number(formData.rating) || 4.8,
        stock: Number(formData.stock) || 0,
      });
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to save hardware SKU.');
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <span className="eyebrow-badge">Cache Invalidation Mutation</span>
            <h3>{isEditing ? `Edit SKU #${initialItem.id}` : 'Create New Hardware SKU'}</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <p className="modal-subtitle">
          Saving this item triggers <code>{isEditing ? 'updateItem()' : 'createItem()'}</code> in{' '}
          <code>services/service.js</code> and automatically invalidates all cached{' '}
          <code>[&apos;products&apos;]</code> queries.
        </p>

        {formError && <div className="auth-alert error">{formError}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid-2">
            <label className="form-field">
              <span>Hardware Title *</span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </label>

            <label className="form-field">
              <span>Brand *</span>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
              />
            </label>

            <label className="form-field">
              <span>SKU Code</span>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
              />
            </label>

            <label className="form-field">
              <span>Category</span>
              <select name="category" value={formData.category} onChange={handleChange}>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Unit Price (USD) *</span>
              <input
                type="number"
                name="price"
                min="1"
                step="1"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </label>

            <label className="form-field">
              <span>Stock Units</span>
              <input
                type="number"
                name="stock"
                min="0"
                step="1"
                value={formData.stock}
                onChange={handleChange}
                required
              />
            </label>

            <label className="form-field">
              <span>Availability Status</span>
              <select
                name="availabilityStatus"
                value={formData.availabilityStatus}
                onChange={handleChange}
              >
                {AVAILABILITY_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Discount (%)</span>
              <input
                type="number"
                name="discountPercentage"
                min="0"
                max="60"
                value={formData.discountPercentage}
                onChange={handleChange}
              />
            </label>
          </div>

          <label className="form-field">
            <span>Technical Specifications</span>
            <input
              type="text"
              name="specs"
              value={formData.specs}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-field">
            <span>Description</span>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
            />
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? 'Saving & Invalidating Cache...'
                : isEditing
                ? 'Save Changes & Invalidate Cache'
                : 'Create SKU & Invalidate Cache'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
