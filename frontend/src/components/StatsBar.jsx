import React from 'react';
import { STATUSES, STATUS_COLORS } from '../constants';

export default function StatsBar({ stats, activeStatus, onSelectStatus }) {
  const total = stats?.total ?? 0;
  const byStatus = stats?.byStatus ?? {};

  return (
    <div className="stats-bar">
      <div
        className="stat-card"
        style={{
          cursor: 'pointer',
          borderColor: !activeStatus ? 'var(--primary)' : 'var(--border-color)',
          backgroundColor: !activeStatus ? 'var(--primary-light)' : 'var(--bg-surface)',
        }}
        onClick={() => onSelectStatus && onSelectStatus('')}
        title="Show all leads"
      >
        <span className="stat-label">
          <span className="stat-dot" style={{ backgroundColor: 'var(--primary)' }} />
          Total Leads
        </span>
        <span className="stat-value">{total}</span>
      </div>

      {STATUSES.map((status) => {
        const count = byStatus[status] ?? 0;
        const color = STATUS_COLORS[status];
        const isSelected = activeStatus === status;

        return (
          <div
            key={status}
            className="stat-card"
            style={{
              cursor: 'pointer',
              borderColor: isSelected ? color.dot : 'var(--border-color)',
              backgroundColor: isSelected ? color.bg : 'var(--bg-surface)',
            }}
            onClick={() => onSelectStatus && onSelectStatus(isSelected ? '' : status)}
            title={`Filter by ${status}`}
          >
            <span className="stat-label">
              <span className="stat-dot" style={{ backgroundColor: color.dot }} />
              {status}
            </span>
            <span className="stat-value" style={{ color: color.text }}>
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
