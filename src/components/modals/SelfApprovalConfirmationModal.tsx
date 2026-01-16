import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import '../modals.css';

interface SelfApprovalConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reportId?: string;
  reportType?: string;
  authorName?: string;
}

export function SelfApprovalConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  reportId,
  reportType = 'Report',
  authorName
}: SelfApprovalConfirmationModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon" style={{ backgroundColor: 'rgba(251, 146, 60, 0.15)' }}>
              <AlertTriangle size={24} style={{ color: '#FB923C' }} />
            </div>
            <div>
              <h2 className="modal-title">Self-Approval Confirmation</h2>
              <p className="modal-subtitle">
                {reportId ? `${reportType} ${reportId}` : 'Confirm self-approval'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '24px' }}>
          {/* Warning Notice */}
          <div style={{
            backgroundColor: 'rgba(251, 146, 60, 0.1)',
            border: '1px solid rgba(251, 146, 60, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <AlertTriangle size={20} style={{ color: '#FB923C', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#FB923C', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                Self-Approval Detected
              </div>
              <div style={{ color: '#CBD5E1', fontSize: '13px', lineHeight: '1.6' }}>
                You are approving your own report. This action will be logged in the audit trail.
                {authorName && (
                  <div style={{ marginTop: '8px', fontWeight: 500, color: '#E2E8F0' }}>
                    Author: {authorName}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.6' }}>
            While permitted in MVP, self-approvals should be minimized in production environments to maintain 
            proper separation of duties and audit compliance.
          </div>

          <div style={{ 
            marginTop: '16px', 
            padding: '12px 16px', 
            backgroundColor: 'rgba(59, 209, 111, 0.1)',
            border: '1px solid rgba(59, 209, 111, 0.2)',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#94A3B8'
          }}>
            ℹ️ This approval will include the note: "Self-approved by {authorName}"
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="button-primary" 
            onClick={handleConfirm}
            style={{ 
              backgroundColor: '#FB923C',
              color: '#FFFFFF'
            }}
          >
            Confirm Approval
          </button>
        </div>
      </div>
    </div>
  );
}
