import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle } from 'lucide-react';

interface RejectReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rejectionReason: string) => void;
  reportId?: string;
}

export function RejectReportModal({ isOpen, onClose, onConfirm, reportId }: RejectReportModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [notifyGuard, setNotifyGuard] = useState(true);
  const [error, setError] = useState('');

  // DEBUG: Log when modal state changes
  useEffect(() => {
    console.log('[RejectReportModal] isOpen changed:', isOpen);
    console.log('[RejectReportModal] reportId:', reportId);
  }, [isOpen, reportId]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    console.log('[RejectReportModal] Confirming rejection:', {
      reportId,
      rejectionReason,
      notifyGuard
    });

    onConfirm(rejectionReason);
    setRejectionReason('');
    setNotifyGuard(true);
    setError('');
    onClose();
  };

  const handleClose = () => {
    console.log('[RejectReportModal] Closing modal');
    setRejectionReason('');
    setNotifyGuard(true);
    setError('');
    onClose();
  };

  const modalContent = (
    <>
      {/* Backdrop Overlay */}
      <div 
        className="modal-overlay" 
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}
      />
      
      {/* Modal Container */}
      <div 
        className="batch-reject-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
          background: '#151B2A',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease-out',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-wrapper modal-icon-warning">
              <AlertCircle size={20} />
            </div>
            <div>
              <h2>Reject Report</h2>
              {reportId && (
                <p className="modal-subtitle">Report: {reportId}</p>
              )}
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">
              Reason for Rejection *
            </label>
            <textarea
              className="form-textarea"
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setError('');
              }}
              placeholder="Provide specific feedback on why this report is being rejected and what needs to be revised..."
              rows={5}
              style={{
                minHeight: '120px',
                border: error ? '1px solid #EF4444' : undefined
              }}
            />
            {error && (
              <p style={{ 
                color: '#EF4444', 
                fontSize: '0.75rem', 
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <AlertCircle size={14} />
                {error}
              </p>
            )}
          </div>

          {/* Notify Guard Checkbox */}
          <div style={{ marginTop: '16px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--text-primary)'
            }}>
              <input
                type="checkbox"
                checked={notifyGuard}
                onChange={(e) => setNotifyGuard(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: 'var(--primary-action)'
                }}
              />
              <span>Notify guard of corrections needed</span>
            </label>
          </div>

          {/* Info Note */}
          <div style={{ 
            padding: '12px', 
            backgroundColor: 'rgba(59, 209, 111, 0.1)', 
            borderRadius: '8px',
            marginTop: '16px',
            border: '1px solid rgba(59, 209, 111, 0.2)'
          }}>
            <p style={{ 
              fontSize: '0.75rem', 
              color: '#6B7A8F', 
              lineHeight: '1.5',
              margin: 0
            }}>
              <strong style={{ color: 'var(--primary-color)' }}>Note:</strong> The guard will be able to view your feedback, 
              revise the report, and resubmit it for approval.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button 
            className="modal-btn modal-btn-secondary" 
            onClick={handleClose}
          >
            Cancel
          </button>
          <button 
            className="modal-btn modal-btn-danger" 
            onClick={handleConfirm}
          >
            <AlertCircle size={16} />
            Confirm Reject
          </button>
        </div>
      </div>
    </>
  );

  // Render modal using portal to ensure it's at the root level
  return createPortal(modalContent, document.body);
}