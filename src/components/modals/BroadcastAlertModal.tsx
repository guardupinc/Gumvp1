import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface SiteCard {
  id: number;
  name: string;
  status: 'all-clear' | 'critical';
  statusText: string;
  activeGuards: number;
  guards: { id: number; name: string; initials: string }[];
  shiftProgress: number;
  shiftStatusText: string;
  taskMetrics: {
    patrolsCompleted: number;
    patrolsTotal: number;
    reportsDrafted: number;
  };
}

interface BroadcastAlertModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  site: SiteCard;
}

export function BroadcastAlertModal({
  onClose,
  onConfirm,
  site
}: BroadcastAlertModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // Calculate total devices (number of guards on site)
  const totalDevices = site.guards.length;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-row">
            <AlertTriangle size={24} className="text-critical" />
            <h2 className="modal-title">⚠️ Send Emergency Alert?</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            This will send a high-priority push notification to all{' '}
            <strong>{totalDevices} active guards</strong> at {site.name}.
          </p>

          <div className="broadcast-message-preview">
            <div className="message-preview-label">Message Preview:</div>
            <div className="message-preview-content">
              <strong>MSG:</strong> SOS Triggered at Main Lobby. All available units respond immediately.
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button-critical" onClick={handleConfirm}>
            SEND ALERT
          </button>
        </div>
      </div>
    </>
  );
}