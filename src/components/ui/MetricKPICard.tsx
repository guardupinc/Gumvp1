import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricKPICardProps {
  title: string;
  value: string | number;
  subtext?: string;
  delta?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  status?: 'normal' | 'warning' | 'critical';
  sparklineData?: number[];
  onClick?: () => void;
  className?: string;
}

export function MetricKPICard({
  title,
  value,
  subtext,
  delta,
  status = 'normal',
  sparklineData,
  onClick,
  className = '',
}: MetricKPICardProps) {
  const getTrendIcon = () => {
    if (!delta) return null;
    switch (delta.trend) {
      case 'up':
        return <TrendingUp size={14} />;
      case 'down':
        return <TrendingDown size={14} />;
      case 'neutral':
        return <Minus size={14} />;
    }
  };

  return (
    <div
      className={`metric-kpi-card ${status} ${onClick ? 'clickable' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="metric-kpi-header">
        <span className="metric-kpi-title">{title}</span>
        {status !== 'normal' && <span className={`metric-status-pill ${status}`} />}
      </div>
      
      <div className="metric-kpi-value">{value}</div>
      
      {subtext && <div className="metric-kpi-subtext">{subtext}</div>}
      
      {delta && (
        <div className={`metric-kpi-delta ${delta.trend}`}>
          {getTrendIcon()}
          <span>{delta.value}</span>
        </div>
      )}
      
      {sparklineData && sparklineData.length > 0 && (
        <div className="metric-sparkline">
          {sparklineData.map((value, index) => (
            <div
              key={index}
              className="sparkline-bar"
              style={{ height: `${(value / Math.max(...sparklineData)) * 100}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
