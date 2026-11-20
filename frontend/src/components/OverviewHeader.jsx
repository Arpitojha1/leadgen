import React from 'react';

export default function OverviewHeader({ onAddLead }) {
  return (
    <div className="overview-header-block">
      <div className="overview-header-text">
        <span className="page-label">SALES DASHBOARD</span>
        <h1 className="page-title">Overview</h1>
        <p className="page-description">
          Track your pipeline health, spot trends, and act on the leads that need attention today.
        </p>
      </div>
      <div className="overview-header-action">
        <button
          type="button"
          className="btn-add-lead"
          onClick={onAddLead}
          aria-label="Add lead"
        >
          Add lead
        </button>
      </div>
    </div>
  );
}
