import React from 'react';
import { X, Calendar, FileText, Users, AlertTriangle, FolderOpen } from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionSelect: (action: string) => void;
}

const quickActions = [
  { id: 'add-shift', label: 'Add Shift', icon: Calendar, description: 'Schedule a new guard shift' },
  { id: 'report-incident', label: 'Report Incident', icon: AlertTriangle, description: 'Submit a new incident report' },
  { id: 'add-guard', label: 'Add Guard', icon: Users, description: 'Register a new guard' },
  { id: 'upload-document', label: 'Upload Document', icon: FolderOpen, description: 'Add document to vault' },
  { id: 'review-reports', label: 'Review Reports', icon: FileText, description: 'View pending reports' },
];

export function QuickActionModal({ isOpen, onClose, onActionSelect }: QuickActionModalProps) {
  if (!isOpen) return null;

  const handleActionClick = (actionId: string) => {
    onActionSelect(actionId);
    onClose();
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-container quick-action-modal">
        <div className="modal-header">
          <h2>Quick Actions</h2>
          <button className="modal-close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="quick-actions-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  className="quick-action-item"
                  onClick={() => handleActionClick(action.id)}
                >
                  <div className="quick-action-icon">
                    <Icon size={24} />
                  </div>
                  <div className="quick-action-content">
                    <h3>{action.label}</h3>
                    <p>{action.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
