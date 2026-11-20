import React from 'react';
import StatusBadge from './StatusBadge';
import { STATUSES, STATUS_COLORS } from '../constants';

export default function PipelineView({ leads = [] }) {
  const formatCurrency = (val) => '$' + Number(val || 0).toLocaleString('en-US');

  const leadsByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = leads.filter((l) => l.status === status);
    return acc;
  }, {});

  return (
    <div className="pipeline-view">
      <div className="view-header">
        <span className="page-label">SALES DASHBOARD</span>
        <h1 className="page-title">Pipeline</h1>
        <p className="page-description">
          Visual status board grouping your leads across each sales stage.
        </p>
      </div>

      <div className="pipeline-board">
        {STATUSES.map((status) => {
          const statusLeads = leadsByStatus[status] || [];
          const statusColor = STATUS_COLORS[status]?.border || '#8BBFD0';
          const totalValue = statusLeads.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);

          return (
            <div key={status} className="pipeline-column">
              <div className="pipeline-column-header">
                <div className="column-title-group">
                  <span
                    className="column-color-indicator"
                    style={{ backgroundColor: statusColor }}
                  />
                  <h3 className="column-title">{status}</h3>
                  <span className="column-count-badge">{statusLeads.length}</span>
                </div>
                <div className="column-value-subtext">
                  {formatCurrency(totalValue)}
                </div>
              </div>

              <div className="pipeline-cards-container">
                {statusLeads.length === 0 ? (
                  <div className="pipeline-empty-card">No {status.toLowerCase()} leads</div>
                ) : (
                  statusLeads.map((lead) => (
                    <div key={lead.id} className="pipeline-card">
                      <div className="pipeline-card-top">
                        <span className="pipeline-card-name">{lead.name}</span>
                        <span className="pipeline-card-value">
                          {formatCurrency(lead.deal_value)}
                        </span>
                      </div>
                      <div className="pipeline-card-company">{lead.company}</div>
                      <div className="pipeline-card-bottom">
                        <span className="pipeline-card-source">{lead.source}</span>
                        <StatusBadge status={lead.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
