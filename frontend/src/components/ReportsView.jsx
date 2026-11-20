import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export default function ReportsView({ stats = {} }) {
  const formatCurrency = (val) => '$' + Number(val || 0).toLocaleString('en-US');

  const bySource = stats.bySource || [];
  const totalLeads = stats.total || 0;
  const qualifiedValue = stats.qualifiedValue || 0;
  const pipelineValue = stats.pipelineValue || 0;
  const conversionRate = totalLeads > 0
    ? (((stats.byStatus?.Qualified || 0) / totalLeads) * 100).toFixed(1)
    : '0';

  return (
    <div className="reports-view">
      <div className="view-header">
        <span className="page-label">SALES DASHBOARD</span>
        <h1 className="page-title">Reports</h1>
        <p className="page-description">
          In-depth revenue trends, conversion rates, and acquisition channel performance.
        </p>
      </div>

      <div className="stat-cards-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-value">{conversionRate}%</div>
          <div className="stat-card-label">Qualified conversion rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{formatCurrency(qualifiedValue)}</div>
          <div className="stat-card-label">Qualified revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{formatCurrency(pipelineValue)}</div>
          <div className="stat-card-label">Total pipeline value</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">
            {totalLeads > 0 ? formatCurrency(Math.round(pipelineValue / totalLeads)) : '$0'}
          </div>
          <div className="stat-card-label">Average deal size</div>
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: '24px' }}>
        <h3 className="chart-card-title">Deal Volume by Acquisition Channel</h3>
        <div className="chart-inner-frame">
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySource} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="source" tick={{ fontSize: 12, fill: '#0F172A', fontWeight: 600 }} />
                <YAxis tickFormatter={(v) => (v === 0 ? '0' : `$${v}`)} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Value']} />
                <Bar dataKey="value" fill="#8BBFD0" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
