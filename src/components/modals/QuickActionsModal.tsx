import React, { useEffect } from 'react';
import { X, UserPlus, Calendar, FileText } from 'lucide-react';

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGuard: () => void;
  onCreateShift: () => void;
  onCreateReport: () => void;
}

export function QuickActionsModal({ 
  isOpen, 
  onClose, 
  onAddGuard, 
  onCreateShift, 
  onCreateReport 
}: QuickActionsModalProps) {
  // ESC key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Focus trap - focus the modal container when it opens
      const modalElement = document.querySelector('.select-report-type-modal');
      if (modalElement instanceof HTMLElement) {
        modalElement.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleActionClick = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="select-report-type-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-actions-title"
        tabIndex={-1}
      >
        <div className="modal-header">
          <div>
            <h2 id="quick-actions-title">Quick Actions</h2>
            <p className="modal-subtitle">Common shortcuts</p>
          </div>
          <button 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="report-type-section">
            <div className="report-type-cards">
              <button 
                className="report-type-card report-type-dar"
                onClick={() => handleActionClick(onAddGuard)}
              >
                <div className="report-card-icon">
                  <UserPlus size={24} />
                </div>
                <div className="report-card-content">
                  <h4>Add Guard</h4>
                  <p>Create a new guard profile</p>
                </div>
              </button>

              <button 
                className="report-type-card report-type-maintenance"
                onClick={() => handleActionClick(onCreateShift)}
              >
                <div className="report-card-icon">
                  <Calendar size={24} />
                </div>
                <div className="report-card-content">
                  <h4>Create Shift</h4>
                  <p>Schedule a guard shift</p>
                </div>
              </button>

              <button 
                className="report-type-card report-type-incident"
                onClick={() => handleActionClick(onCreateReport)}
              >
                <div className="report-card-icon">
                  <FileText size={24} />
                </div>
                <div className="report-card-content">
                  <h4>Create Report</h4>
                  <p>Start a new report</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}