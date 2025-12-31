import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon: React.ReactNode;
  onClick?: () => void;
}

export function KPICard({ title, value, change, icon, onClick }: KPICardProps) {
  return (
    <div 
      className={`kpi-card ${onClick ? 'kpi-card-clickable' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
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