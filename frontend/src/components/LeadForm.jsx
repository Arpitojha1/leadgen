import React, { useState, useEffect } from 'react';
import { SOURCES, STATUSES, validateLeadForm } from '../constants';

export default function LeadForm({
  isOpen,
  initialData = null,
  onSubmit,
  onClose,
  isSubmitting = false,
  serverError = null,
  serverFieldErrors = {},
}) {
  const isEdit = Boolean(initialData?.id);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'Website',
    status: 'New',
    deal_value: '',
  });

  const [clientErrors, setClientErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        company: initialData.company || '',
        source: initialData.source || 'Website',
        status: initialData.status || 'New',
        deal_value: initialData.deal_value !== undefined && initialData.deal_value !== null ? initialData.deal_value : '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        source: 'Website',
        status: 'New',
        deal_value: '',
      });
    }
    setClientErrors({});
    setTouched({});
  }, [initialData, isOpen]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    // Live validation if field has been touched
    if (touched[name]) {
      const validation = validateLeadForm(updated);
      setClientErrors(validation.errors);
    }
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const validation = validateLeadForm(formData);
    setClientErrors(validation.errors);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Mark all as touched
    setTouched({
      name: true,
      email: true,
      phone: true,
      company: true,
      source: true,
      status: true,
      deal_value: true,
    });

    const validation = validateLeadForm(formData);
    setClientErrors(validation.errors);

    if (!validation.isValid) {
      return;
    }

    const payload = {
      ...formData,
      deal_value: formData.deal_value === '' ? 0 : Number(formData.deal_value),
    };

    await onSubmit(payload);
  }

  // Combined error display (client validation prioritized, then backend field error)
  const getFieldError = (field) => clientErrors[field] || serverFieldErrors[field];

  return (
    <div className="modal-overlay" onClick={() => !isSubmitting && onClose()} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Lead' : 'Create New Lead'}</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {serverError && (
              <div className="form-general-error">
                {serverError}
              </div>
            )}

            <div className="form-grid">
              {/* Name field */}
              <div className="form-group form-group-full">
                <label className="form-label form-label-required" htmlFor="lead-name">
                  Lead Name
                </label>
                <input
                  id="lead-name"
                  name="name"
                  type="text"
                  className={`form-input ${getFieldError('name') ? 'form-input-error' : ''}`}
                  placeholder="e.g. Jane Doe"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  autoFocus
                />
                {getFieldError('name') && (
                  <span className="field-error-text">{getFieldError('name')}</span>
                )}
              </div>

              {/* Email field */}
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="lead-email">
                  Email Address
                </label>
                <input
                  id="lead-email"
                  name="email"
                  type="email"
                  className={`form-input ${getFieldError('email') ? 'form-input-error' : ''}`}
                  placeholder="e.g. jane@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                />
                {getFieldError('email') && (
                  <span className="field-error-text">{getFieldError('email')}</span>
                )}
              </div>

              {/* Phone field */}
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="lead-phone">
                  Phone (7-15 digits)
                </label>
                <input
                  id="lead-phone"
                  name="phone"
                  type="text"
                  className={`form-input ${getFieldError('phone') ? 'form-input-error' : ''}`}
                  placeholder="e.g. +1 555-123-4567"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                />
                {getFieldError('phone') && (
                  <span className="field-error-text">{getFieldError('phone')}</span>
                )}
              </div>

              {/* Company field */}
              <div className="form-group form-group-full">
                <label className="form-label form-label-required" htmlFor="lead-company">
                  Company
                </label>
                <input
                  id="lead-company"
                  name="company"
                  type="text"
                  className={`form-input ${getFieldError('company') ? 'form-input-error' : ''}`}
                  placeholder="e.g. Acme Corporation"
                  value={formData.company}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                />
                {getFieldError('company') && (
                  <span className="field-error-text">{getFieldError('company')}</span>
                )}
              </div>

              {/* Source dropdown */}
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="lead-source">
                  Lead Source
                </label>
                <select
                  id="lead-source"
                  name="source"
                  className={`form-select ${getFieldError('source') ? 'form-input-error' : ''}`}
                  value={formData.source}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {getFieldError('source') && (
                  <span className="field-error-text">{getFieldError('source')}</span>
                )}
              </div>

              {/* Status dropdown */}
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="lead-status">
                  Lead Status
                </label>
                <select
                  id="lead-status"
                  name="status"
                  className={`form-select ${getFieldError('status') ? 'form-input-error' : ''}`}
                  value={formData.status}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                {getFieldError('status') && (
                  <span className="field-error-text">{getFieldError('status')}</span>
                )}
              </div>

              {/* Deal Value field (optional numeric >= 0) */}
              <div className="form-group form-group-full">
                <label className="form-label" htmlFor="lead-deal-value">
                  Deal Value ($) <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  id="lead-deal-value"
                  name="deal_value"
                  type="number"
                  min="0"
                  step="any"
                  className={`form-input ${getFieldError('deal_value') ? 'form-input-error' : ''}`}
                  placeholder="e.g. 15000"
                  value={formData.deal_value}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                />
                {getFieldError('deal_value') && (
                  <span className="field-error-text">{getFieldError('deal_value')}</span>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
