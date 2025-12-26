import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon: React.ReactNode;
}

export function KPICard({ title, value, change, icon }: KPICardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        <div className="kpi-icon">{icon}</div>
      </div>
      <div className="kpi-value">{value}</div>
      {change && (
        <div className={`kpi-change ${change.trend}`}>
          {change.value}
        </div>
      )}
    </div>
  );
}
