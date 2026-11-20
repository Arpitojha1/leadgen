import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as PieTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as BarTooltip,
  LabelList,
} from 'recharts';

const STATUS_COLORS = {
  New: '#8BBFD0',
  Contacted: '#A3B98A',
  Qualified: '#22C55E',
  Lost: '#F97316',
};

export default function ChartsGrid({ stats = {} }) {
  const byStatus = stats.byStatus || { New: 0, Contacted: 0, Qualified: 0, Lost: 0 };
  
  const donutData = [
    { name: 'New', value: byStatus.New || 0, color: STATUS_COLORS.New },
    { name: 'Contacted', value: byStatus.Contacted || 0, color: STATUS_COLORS.Contacted },
    { name: 'Qualified', value: byStatus.Qualified || 0, color: STATUS_COLORS.Qualified },
    { name: 'Lost', value: byStatus.Lost || 0, color: STATUS_COLORS.Lost },
  ];

  const totalValue = donutData.reduce((acc, d) => acc + d.value, 0);
  const chartDonutData = totalValue > 0
    ? donutData.filter((d) => d.value > 0)
    : [{ name: 'No data', value: 1, color: '#E2E8F0' }];

  const barData = (stats.bySource && stats.bySource.length > 0)
    ? stats.bySource
    : [
        { source: 'LinkedIn', value: 30000 },
        { source: 'Referral', value: 14000 },
        { source: 'Website', value: 56000 },
        { source: 'Event', value: 10000 },
        { source: 'Other', value: 12500 },
        { source: 'Cold Call', value: 26000 },
      ];

  const totalPipeline = barData.reduce((acc, d) => acc + Number(d.value || 0), 0);

  const formatCurrency = (val) => '$' + Number(val || 0).toLocaleString('en-US');
  const formatCompact = (val) => {
    if (!val) return '$0';
    if (val >= 1000) return `$${Math.round(val / 1000)}k`;
    return `$${val}`;
  };

  return (
    <div className="charts-grid">
      {/* Donut Chart: Leads by status */}
      <div className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Leads by status</h3>
          <span className="chart-card-meta">{totalValue} total leads</span>
        </div>
        <div className="chart-inner-frame">
          <div className="chart-container" style={{ width: '100%', height: 210, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={78}
                  paddingAngle={totalValue > 0 ? 3 : 0}
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {chartDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <PieTooltip
                  formatter={(val, name) => [
                    `${val} leads (${totalValue > 0 ? Math.round((val / totalValue) * 100) : 0}%)`,
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center label inside Donut hole */}
            <div className="donut-center-overlay" aria-hidden="true">
              <span className="donut-center-number">{totalValue}</span>
              <span className="donut-center-label">LEADS</span>
            </div>
          </div>

          {/* Donut Legend with direct counts & percentages */}
          <div className="donut-legend">
            {donutData.map((d) => {
              const pct = totalValue > 0 ? Math.round((d.value / totalValue) * 100) : 0;
              return (
                <div key={d.name} className="donut-legend-item">
                  <div className="donut-legend-item-left">
                    <span className="donut-legend-dot" style={{ backgroundColor: d.color }} />
                    <span className="donut-legend-label">{d.name}</span>
                  </div>
                  <div className="donut-legend-item-right">
                    <span className="donut-legend-count">{d.value}</span>
                    <span className="donut-legend-pct">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bar Chart: Pipeline value by source */}
      <div className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Pipeline value by source</h3>
          <span className="chart-card-meta">{formatCurrency(totalPipeline)} pipeline</span>
        </div>
        <div className="chart-inner-frame">
          <div className="chart-container" style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 22, right: 15, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="source"
                  tick={{ fontSize: 11, fill: '#0F172A', fontWeight: 600 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  ticks={[0, 30000, 60000]}
                  domain={[0, 65000]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatCompact}
                />
                <BarTooltip
                  formatter={(val) => [formatCurrency(val), 'Pipeline Value']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#8BBFD0"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={formatCompact}
                    style={{ fontSize: '10px', fill: '#475569', fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Legend */}
          <div className="bar-legend">
            <span className="bar-legend-square" />
            <span className="bar-legend-text">Pipeline value by lead acquisition source</span>
          </div>
        </div>
      </div>
    </div>
  );
}
