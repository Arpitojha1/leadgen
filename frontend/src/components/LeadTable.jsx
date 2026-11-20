import React from 'react';
import StatusBadge from './StatusBadge';

export default function LeadTable({
  leads = [],
  pagination = {},
  sortBy = 'created_at',
  order = 'desc',
  onSort,
  onPageChange,
  onLimitChange,
  onEditLead,
  onDeleteLead,
  isLoading = false,
  hasFilters = false,
  onClearFilters,
}) {
  function handleHeaderClick(column) {
    if (sortBy === column) {
      // Toggle order
      onSort(column, order === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending for strings, descending for dates
      onSort(column, column === 'created_at' ? 'desc' : 'asc');
    }
  }

  function renderSortIndicator(column) {
    if (sortBy !== column) return null;
    return <span className="sort-icon">{order === 'asc' ? '▲' : '▼'}</span>;
  }

  const { page = 1, limit = 10, total = 0, totalPages = 1 } = pagination;
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  if (isLoading) {
    return (
      <div className="table-container">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading leads...</p>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h4 className="empty-state-title">
            {hasFilters ? 'No matching leads found' : 'No leads yet'}
          </h4>
          <p className="empty-state-desc">
            {hasFilters
              ? 'Try modifying your search or clearing the status filter.'
              : 'Get started by creating your first sales lead.'}
          </p>
          {hasFilters && (
            <button
              type="button"
              className="btn-secondary"
              style={{ marginTop: '1rem' }}
              onClick={onClearFilters}
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-responsive">
        <table className="leads-table">
          <thead>
            <tr>
              <th
                className="th-sortable"
                onClick={() => handleHeaderClick('name')}
                title="Sort by Name"
              >
                Name {renderSortIndicator('name')}
              </th>
              <th
                className="th-sortable"
                onClick={() => handleHeaderClick('company')}
                title="Sort by Company"
              >
                Company {renderSortIndicator('company')}
              </th>
              <th>Contact</th>
              <th
                className="th-sortable"
                onClick={() => handleHeaderClick('source')}
                title="Sort by Source"
              >
                Source {renderSortIndicator('source')}
              </th>
              <th
                className="th-sortable"
                onClick={() => handleHeaderClick('status')}
                title="Sort by Status"
              >
                Status {renderSortIndicator('status')}
              </th>
              <th
                className="th-sortable"
                onClick={() => handleHeaderClick('created_at')}
                title="Sort by Created Date"
              >
                Created {renderSortIndicator('created_at')}
              </th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td className="lead-name-cell">
                  {lead.name}
                </td>
                <td>{lead.company}</td>
                <td>
                  <div className="lead-email-cell">{lead.email}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {lead.phone}
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {lead.source}
                  </span>
                </td>
                <td>
                  <StatusBadge status={lead.status} />
                </td>
                <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
                </td>
                <td>
                  <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn-action-edit"
                      onClick={() => onEditLead(lead)}
                      title="Edit lead"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-action-delete"
                      onClick={() => onDeleteLead(lead)}
                      title="Delete lead"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="pagination-bar">
        <div className="pagination-info">
          Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of <strong>{total}</strong> leads
          <label style={{ marginLeft: '1rem', color: 'var(--text-muted)' }}>
            Per page:
            <select
              className="pagination-limit-select"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>

        <div className="pagination-controls">
          <button
            type="button"
            className="btn-pagination"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            &larr; Prev
          </button>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '0 0.5rem' }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn-pagination"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
