import React from 'react';
import { ExternalLink } from 'lucide-react';

interface MetricListItem {
  id: string | number;
  title: string;
  subtitle: string;
  badge?: {
    label: string;
    severity: 'normal' | 'warning' | 'critical';
  };
  time?: string;
}

interface MetricListCardProps {
  title: string;
  count: number;
  items: MetricListItem[];
  emptyMessage?: string;
  onViewItem?: (id: string | number) => void;
  onViewAll?: () => void;
  className?: string;
}

export function MetricListCard({
  title,
  count,
  items,
  emptyMessage = 'No items',
  onViewItem,
  onViewAll,
  className = '',
}: MetricListCardProps) {
  return (
    <div className={`metric-list-card ${className}`}>
      <div className="metric-list-header">
        <div className="metric-list-title-group">
          <h3>{title}</h3>
          <span className="metric-list-count">{count}</span>
        </div>
        {onViewAll && count > 0 && (
          <button className="button-link" onClick={onViewAll}>
            View All
          </button>
        )}
      </div>
      
      <div className="metric-list-items">
        {items.length === 0 ? (
          <div className="metric-list-empty">{emptyMessage}</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="metric-list-item">
              <div className="metric-list-item-content">
                <div className="metric-list-item-title">{item.title}</div>
                <div className="metric-list-item-subtitle">{item.subtitle}</div>
              </div>
              
              <div className="metric-list-item-actions">
                {item.time && <span className="metric-list-item-time">{item.time}</span>}
                {item.badge && (
                  <span className={`metric-badge ${item.badge.severity}`}>
                    {item.badge.label}
                  </span>
                )}
                {onViewItem && (
                  <button
                    className="metric-list-item-button"
                    onClick={() => onViewItem(item.id)}
                    aria-label="View details"
                  >
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
