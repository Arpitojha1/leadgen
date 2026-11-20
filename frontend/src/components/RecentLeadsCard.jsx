import React, { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';
import { STATUSES, SOURCES } from '../constants';

export default function RecentLeadsCard({
  leads = [],
  pagination = {},
  search = '',
  status = '',
  source = '',
  sortBy = 'created_at',
  order = 'desc',
  onSearchChange,
  onStatusChange,
  onSourceChange,
  onSort,
  onPageChange,
  onEditLead,
  onDeleteLead,
  onQuickStatusChange,
  isLoading = false,
}) {
  const [searchTerm, setSearchTerm] = useState(search);

  useEffect(() => {
    setSearchTerm(search);
  }, [search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== search) {
        onSearchChange(searchTerm);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, search, onSearchChange]);

  const { page = 1, limit = 10, total = 0, totalPages = 1 } = pagination;

  return (
    <div className="recent-leads-card">
      {/* Header Block */}
      <div className="card-header-block">
        <h2 className="recent-leads-title">Recent leads</h2>
        <p className="recent-leads-subtitle">
          Browse, filter, and update your latest opportunities.
        </p>
      </div>

      {/* Toolbar: Search input, Status select, Source select */}
      <div className="leads-toolbar">
        <div className="toolbar-search-wrapper">
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search leads by name"
          />
        </div>

        <div className="toolbar-filters">
          <select
            className="toolbar-select"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            className="toolbar-select"
            value={source}
            onChange={(e) => onSourceChange(e.target.value)}
            aria-label="Filter by source"
          >
            <option value="">Source</option>
            {SOURCES.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="table-wrapper">
        {isLoading ? (
          <div className="table-loading-state">
            <div className="spinner" />
            <p>Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="table-empty-state">
            <p>No leads found matching your criteria.</p>
          </div>
        ) : (
          <table className="recent-leads-table">
            <thead>
              <tr>
                <th onClick={() => onSort('name')} className="th-sortable" title="Sort by Name">
                  Name {sortBy === 'name' && (order === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => onSort('email')} className="th-sortable" title="Sort by Email">
                  Email {sortBy === 'email' && (order === 'asc' ? '▲' : '▼')}
                </th>
                <th>Phone</th>
                <th onClick={() => onSort('company')} className="th-sortable" title="Sort by Company">
                  Company {sortBy === 'company' && (order === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => onSort('source')} className="th-sortable" title="Sort by Source">
                  Source {sortBy === 'source' && (order === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => onSort('status')} className="th-sortable" title="Sort by Status">
                  Status {sortBy === 'status' && (order === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="lead-name-cell">{lead.name}</td>
                  <td className="lead-email-cell">{lead.email}</td>
                  <td className="lead-phone-cell">{lead.phone}</td>
                  <td className="lead-company-cell">{lead.company}</td>
                  <td className="lead-source-cell">{lead.source}</td>
                  <td className="lead-status-cell">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="lead-actions-cell">
                    <div className="row-actions-group">
                      {/* Quick status button */}
                      {lead.status === 'New' && (
                        <button
                          type="button"
                          className="btn-quick-action"
                          onClick={() => onQuickStatusChange(lead, 'Contacted')}
                          title="Move to Contacted"
                          aria-label={`Mark ${lead.name} as Contacted`}
                        >
                          Contact
                        </button>
                      )}
                      {lead.status === 'Contacted' && (
                        <button
                          type="button"
                          className="btn-quick-action qualify"
                          onClick={() => onQuickStatusChange(lead, 'Qualified')}
                          title="Move to Qualified"
                          aria-label={`Mark ${lead.name} as Qualified`}
                        >
                          Qualify
                        </button>
                      )}
                      {lead.status !== 'Lost' && (
                        <button
                          type="button"
                          className="btn-quick-action lost"
                          onClick={() => onQuickStatusChange(lead, 'Lost')}
                          title="Mark as Lost"
                          aria-label={`Mark ${lead.name} as Lost`}
                        >
                          Lost
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-row-action edit"
                        onClick={() => onEditLead(lead)}
                        title="Edit lead"
                        aria-label={`Edit ${lead.name}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-row-action delete"
                        onClick={() => onDeleteLead(lead)}
                        title="Delete lead"
                        aria-label={`Delete ${lead.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination controls if total > limit */}
      {total > limit && (
        <div className="table-pagination">
          <span className="pagination-text">
            Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
          </span>
          <div className="pagination-buttons">
            <button
              type="button"
              className="btn-page-nav"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              &larr; Prev
            </button>
            <span className="page-indicator">{page} / {totalPages}</span>
            <button
              type="button"
              className="btn-page-nav"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
