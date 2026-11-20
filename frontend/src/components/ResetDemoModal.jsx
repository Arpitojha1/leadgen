import React from 'react';

export default function ResetDemoModal({
  isOpen,
  onConfirm,
  onCancel,
  isResetting = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="reset-modal-title">
      <div className="modal-container modal-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="reset-modal-title" className="modal-title">Reset Demo Data</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onCancel}
            aria-label="Close dialog"
            disabled={isResetting}
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-message">
            This will replace your current leads with the 10 canonical reference leads shown in the sales dashboard design, restore sample metrics, and re-seed the recent activity feed.
          </p>
          <p className="modal-submessage" style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Are you sure you want to proceed?
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onCancel}
            disabled={isResetting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-modal-confirm"
            onClick={onConfirm}
            disabled={isResetting}
          >
            {isResetting ? 'Resetting...' : 'Reset Demo Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
