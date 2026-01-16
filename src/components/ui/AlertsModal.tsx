import React from 'react';
import { X, Banknote, AlertTriangle, Shield } from 'lucide-react';

export interface Alert {
  id: number;
  type: 'financial' | 'critical' | 'operational';
  icon: React.ReactNode;
  title: string;
  description: string;
  timestamp?: string;
  route: 'scheduling' | 'guards';
  filterType?: string;
}

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  onAlertClick: (alert: Alert) => void;
}

export function AlertsModal({ isOpen, onClose, alerts, onAlertClick }: AlertsModalProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="alerts-modal">
        <div className="modal-header">
          <h2>Important Alerts</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          {alerts.length === 0 ? (
            <div className="alerts-empty-state">
              <Shield size={48} className="empty-state-icon" />
              <p className="empty-state-text">No alerts right now</p>
              <p className="empty-state-subtext">All systems operating normally</p>
            </div>
          ) : (
            <div className="alerts-modal-list">
              {alerts.map((alert) => (
                <button
                  key={alert.id}
                  className={`alert-modal-item alert-${alert.type}`}
                  onClick={() => {
                    onAlertClick(alert);
                    onClose();
                  }}
                >
                  <div className="alert-modal-icon">{alert.icon}</div>
                  <div className="alert-modal-content">
                    <div className="alert-modal-header">
                      <h3 className="alert-modal-title">{alert.title}</h3>
                      {alert.timestamp && (
                        <span className="alert-modal-time">{alert.timestamp}</span>
                      )}
                    </div>
                    <p className="alert-modal-description">{alert.description}</p>
                  </div>
                  <div className="alert-modal-severity">
                    <span className={`severity-badge severity-${alert.type}`}>
                      {alert.type === 'financial' ? 'Financial' : 
                       alert.type === 'critical' ? 'Critical' : 'Operational'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
