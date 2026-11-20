import React from 'react';

export default function StatCards({ stats = {} }) {
  const formatCurrency = (val) => {
    return '$' + Number(val || 0).toLocaleString('en-US');
  };

  const totalLeads = stats.total ?? 0;
  const contactedLeads = stats.byStatus?.Contacted ?? 0;
  const qualifiedValue = stats.qualifiedValue ?? 0;
  const pipelineValue = stats.pipelineValue ?? 0;

  const cardItems = [
    {
      id: 'total-leads',
      value: totalLeads.toString(),
      label: 'Total leads',
    },
    {
      id: 'contacted',
      value: contactedLeads.toString(),
      label: 'Contacted',
    },
    {
      id: 'qualified-value',
      value: formatCurrency(qualifiedValue),
      label: 'Qualified value',
    },
    {
      id: 'pipeline-value',
      value: formatCurrency(pipelineValue),
      label: 'Pipeline value',
    },
  ];

  return (
    <div className="stat-cards-grid">
      {cardItems.map((item) => (
        <div key={item.id} className="stat-card">
          <div className="stat-card-value">{item.value}</div>
          <div className="stat-card-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
