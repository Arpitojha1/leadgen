import React, { useState, useEffect } from 'react';
import { STATUSES } from '../constants';

export default function SearchFilterBar({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onClearFilters,
  onAddLead,
}) {
  const [searchTerm, setSearchTerm] = useState(search);

  // Sync external search prop if changed outside
  useEffect(() => {
    setSearchTerm(search);
  }, [search]);

  // Debounce the search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== search) {
        onSearchChange(searchTerm);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, search, onSearchChange]);

  const hasActiveFilters = Boolean(search || status);

  return (
    <div className="controls-bar">
      <div className="filter-group">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search leads by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search leads by name"
          />
        </div>

        <select
          className="filter-select"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn-clear-filters"
            onClick={() => {
              setSearchTerm('');
              onClearFilters();
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <button type="button" className="btn-primary" onClick={onAddLead}>
        <span>+</span> Add Lead
      </button>
    </div>
  );
}
