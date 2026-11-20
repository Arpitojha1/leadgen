import React, { useEffect } from 'react';

export default function ConfirmModal({
  isOpen,
  title = 'Delete Lead',
  message = 'Are you sure you want to delete this lead? This action cannot be undone.',
  leadDetails = null,
  onConfirm,
  onCancel,
  isConfirming = false,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !isConfirming) {
        onCancel();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isConfirming, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => !isConfirming && onCancel()} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onCancel}
            disabled={isConfirming}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="confirm-modal-icon">⚠️</div>
          <p>{message}</p>
          {leadDetails && (
            <div className="confirm-lead-preview">
              <strong>{leadDetails.name}</strong> &bull; {leadDetails.company} ({leadDetails.email})
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={isConfirming}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? 'Deleting...' : 'Delete Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}
