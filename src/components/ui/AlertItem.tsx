import React from 'react';
import { AlertTriangle, AlertCircle, Info, Clock } from 'lucide-react';

export interface Alert {
  id: string | number;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  context: string;
  timestamp: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AlertItemProps {
  alert: Alert;
  className?: string;
}

export function AlertItem({ alert, className = '' }: AlertItemProps) {
  const getIcon = () => {
    switch (alert.severity) {
      case 'critical':
        return <AlertTriangle size={18} />;
      case 'warning':
        return <AlertCircle size={18} />;
      case 'info':
        return <Info size={18} />;
    }
  };

  return (
    <div className={`alert-item-component ${alert.severity} ${className}`}>
      <div className="alert-item-icon">{getIcon()}</div>
      
      <div className="alert-item-content">
        <div className="alert-item-title">{alert.title}</div>
        <div className="alert-item-context">{alert.context}</div>
        <div className="alert-item-timestamp">
          <Clock size={12} />
          <span>{alert.timestamp}</span>
        </div>
      </div>
      
      {alert.action && (
        <button
          className="alert-item-action"
          onClick={alert.action.onClick}
        >
          {alert.action.label}
        </button>
      )}
    </div>
  );
}
