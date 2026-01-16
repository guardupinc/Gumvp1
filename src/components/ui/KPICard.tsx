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
  iconColor?: 'blue' | 'amber' | 'green' | 'red';
  progress?: number; // 0-100
}

export function KPICard({ title, value, change, icon, onClick, iconColor, progress }: KPICardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div 
      className={`kpi-card ${onClick ? 'kpi-card-clickable' : ''}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        <div className={`kpi-icon ${iconColor ? `icon-${iconColor}` : ''}`}>{icon}</div>
      </div>
      <div className="kpi-value">{value}</div>
      {progress !== undefined && (
        <div className="kpi-progress-bar">
          <div 
            className="kpi-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {change && (
        <div className={`kpi-change ${change.trend}`}>
          {change.value}
        </div>
      )}
    </div>
  );
}