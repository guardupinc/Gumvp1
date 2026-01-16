import React from 'react';
import { Banknote, AlertTriangle, Shield } from 'lucide-react';
import { Alert } from './AlertsModal';

interface ImportantAlertsCardProps {
  maxAlerts?: number;
  onViewAll?: () => void;
  onAlertClick?: (alert: Alert) => void;
  alerts?: Alert[];
}

export function ImportantAlertsCard({ maxAlerts = 3, onViewAll, onAlertClick, alerts: providedAlerts }: ImportantAlertsCardProps) {
  // Mock data - in production this would come from props or context
  const defaultAlerts: Alert[] = [
    {
      id: 1,
      type: 'financial',
      icon: <Banknote size={16} />,
      title: 'Overtime Risk Detected',
      description: '3 guards approaching 40 hours this week',
      timestamp: '2 hours ago',
      route: 'scheduling',
      filterType: 'overtime-risk'
    },
    {
      id: 2,
      type: 'critical',
      icon: <AlertTriangle size={16} />,
      title: 'License Expiring Soon',
      description: "John Smith's Guard Card expires in 3 days",
      timestamp: '4 hours ago',
      route: 'guards',
      filterType: 'expiring-licenses'
    },
    {
      id: 3,
      type: 'operational',
      icon: <Shield size={16} />,
      title: 'Shift Coverage Needed',
      description: '2 shifts tomorrow are unassigned',
      timestamp: '5 hours ago',
      route: 'scheduling',
      filterType: 'unassigned-shifts'
    },
  ];

  const allAlerts = providedAlerts || defaultAlerts;
  const alertCount = allAlerts.length;

  if (alertCount === 0) {
    return (
      <div className="important-alerts-kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Important Alerts</span>
          <span className="alert-count-badge">0</span>
        </div>
        <div className="alerts-empty-state" style={{ padding: '20px 0' }}>
          <p className="empty-state-text" style={{ fontSize: '12px', margin: 0 }}>No alerts right now</p>
        </div>
      </div>
    );
  }

  return (
    <div className="important-alerts-kpi-card">
      <div className="kpi-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="kpi-title">Important Alerts</span>
          <span className="alert-count-badge">{alertCount}</span>
        </div>
        {onViewAll && (
          <button className="alert-view-all-inline" onClick={onViewAll}>
            View All
          </button>
        )}
      </div>
      
      <div className="alerts-compact-list">
        {allAlerts.map((alert) => (
          <button
            key={alert.id}
            className={`alert-compact alert-${alert.type}`}
            onClick={() => onAlertClick?.(alert)}
            style={{ cursor: onAlertClick ? 'pointer' : 'default', border: 'none', width: '100%' }}
          >
            <div className="alert-compact-icon">{alert.icon}</div>
            <div className="alert-compact-content">
              <p className="alert-compact-title">{alert.title}</p>
              <p className="alert-compact-description">{alert.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}