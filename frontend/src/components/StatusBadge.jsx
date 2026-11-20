import React from 'react';
import { STATUS_COLORS } from '../constants';

export default function StatusBadge({ status }) {
  const config = STATUS_COLORS[status] || {
    bg: '#f1f5f9',
    text: '#475569',
    border: '#cbd5e1',
    dot: '#94a3b8',
  };

  return (
    <span
      className="status-badge"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
      }}
    >
      <span
        className="status-badge-dot"
        style={{ backgroundColor: config.dot }}
      />
      {status}
    </span>
  );
}
