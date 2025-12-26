import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  children,
  actions,
  className = '',
}: ChartCardProps) {
  return (
    <div className={`chart-card ${className}`}>
      <div className="chart-card-header">
        <div className="chart-card-title-group">
          <h3>{title}</h3>
          {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="chart-card-actions">{actions}</div>}
      </div>
      
      <div className="chart-card-content">{children}</div>
    </div>
  );
}

// Simple bar chart component
interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  maxValue?: number;
}

export function BarChart({ data, maxValue }: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value));

  return (
    <div className="bar-chart">
      {data.map((item, index) => (
        <div key={index} className="bar-chart-item">
          <div className="bar-chart-label">{item.label}</div>
          <div className="bar-chart-bar-container">
            <div
              className="bar-chart-bar"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color || 'var(--primary-action)',
              }}
            >
              <span className="bar-chart-value">{item.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Simple line chart component
interface LineChartProps {
  data: number[];
  labels?: string[];
  color?: string;
}

export function LineChart({ data, labels, color = 'var(--primary-action)' }: LineChartProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="line-chart">
      <svg className="line-chart-svg" viewBox="0 0 300 100" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={data
            .map((value, index) => {
              const x = (index / (data.length - 1)) * 300;
              const y = 100 - ((value - min) / range) * 100;
              return `${x},${y}`;
            })
            .join(' ')}
        />
      </svg>
      {labels && (
        <div className="line-chart-labels">
          {labels.map((label, index) => (
            <span key={index} className="line-chart-label">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
