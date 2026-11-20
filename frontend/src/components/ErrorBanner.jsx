import React from 'react';

export default function ErrorBanner({ error, onRetry, onDismiss }) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || 'An error occurred';

  return (
    <div className="error-banner" role="alert">
      <div className="error-banner-content">
        <span>⚠️</span>
        <span>{errorMessage}</span>
      </div>
      <div className="error-banner-actions">
        {onRetry && (
          <button type="button" className="btn-banner-retry" onClick={onRetry}>
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            className="btn-banner-close"
            onClick={onDismiss}
            aria-label="Dismiss error banner"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
