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

  // If all values are 0, show placeholder slice so donut doesn't collapse
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

  const formatCurrency = (val) => '$' + Number(val || 0).toLocaleString('en-US');

  return (
    <div className="charts-grid">
      {/* Donut Chart: Leads by status */}
      <div className="chart-card">
        <h3 className="chart-card-title">Leads by status</h3>
        <div className="chart-inner-frame">
          <div className="chart-container" style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {chartDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <PieTooltip
                  formatter={(val, name) => [`${val} leads`, name]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Legend */}
          <div className="donut-legend">
            {donutData.map((d) => (
              <div key={d.name} className="donut-legend-item" style={{ color: d.color }}>
                <span className="donut-legend-dot" style={{ backgroundColor: d.color }} />
                <span className="donut-legend-label">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart: Pipeline value by source */}
      <div className="chart-card">
        <h3 className="chart-card-title">Pipeline value by source</h3>
        <div className="chart-inner-frame">
          <div className="chart-container" style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 20, right: 15, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="source"
                  tick={{ fontSize: 12, fill: '#0F172A', fontWeight: 600 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v === 0 ? '0' : v >= 1000 ? `${v}` : v)}
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
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Legend */}
          <div className="bar-legend">
            <span className="bar-legend-square" />
            <span className="bar-legend-text">Pipeline value by source</span>
          </div>
        </div>
      </div>
    </div>
  );
}
