import React from 'react';

export default function Footer({ onResetDemo }) {
  return (
    <footer className="dark-footer" role="contentinfo">
      <div className="footer-content">
        <div className="footer-brand">Lead Manager</div>
        <button
          type="button"
          className="footer-reset-link"
          onClick={onResetDemo}
          aria-label="Reset demo data"
        >
          Reset demo data
        </button>
        <div className="footer-copyright">
          © 2026 Lead Manager. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
