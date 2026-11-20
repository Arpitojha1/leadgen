import React from 'react';
import { STATUS_COLORS } from '../constants';

export default function StatusBadge({ status }) {
  const config = STATUS_COLORS[status] || {
    bg: '#F3F8FB',
    text: '#0F172A',
    border: '#E2E8F0',
    dot: '#8BBFD0',
  };

  return (
    <span
      className="status-pill-badge"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      <span
        className="status-pill-dot"
        style={{ backgroundColor: config.dot }}
        aria-hidden="true"
      />
      <span className="status-pill-text">{status}</span>
    </span>
  );
}
