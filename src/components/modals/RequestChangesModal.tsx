import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import '../modals.css';

interface RequestChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notes?: string, notifyGuard?: boolean) => void;
  reportId?: string;
}

export function RequestChangesModal({ isOpen, onClose, onConfirm, reportId }: RequestChangesModalProps) {
  const [reason, setReason] = useState<string>('incomplete-information');
  const [notes, setNotes] = useState<string>('');
  const [notifyGuard, setNotifyGuard] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason) {
      return; // Reason is required
    }
    
    // Build rejection note with reason and optional notes
    const rejectionNote = notes 
      ? `${getReasonLabel(reason)}: ${notes}`
      : getReasonLabel(reason);
    
    onConfirm(rejectionNote, notes, notifyGuard);
    
    // Reset form
    setReason('incomplete-information');
    setNotes('');
    setNotifyGuard(true);
  };

  const handleClose = () => {
    // Reset form
    setReason('incomplete-information');
    setNotes('');
    setNotifyGuard(true);
    onClose();
  };

  const getReasonLabel = (value: string): string => {
    const labels: Record<string, string> = {
      'incomplete-information': 'Incomplete Information',
      'needs-clarification': 'Needs Clarification',
      'formatting-issues': 'Formatting Issues',
      'missing-evidence': 'Missing Evidence',
      'inaccurate-details': 'Inaccurate Details',
      'other': 'Other'
    };
    return labels[value] || value;
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon" style={{ backgroundColor: 'rgba(251, 146, 60, 0.15)' }}>
              <AlertTriangle size={24} style={{ color: '#FB923C' }} />
            </div>
            <div>
              <h2 className="modal-title">Request Changes</h2>
              <p className="modal-subtitle">
                {reportId ? `Report ${reportId}` : 'Report will be returned to author for revision'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '24px' }}>
          {/* Compliance Notice */}
          <div style={{
            backgroundColor: 'rgba(251, 146, 60, 0.1)',
            border: '1px solid rgba(251, 146, 60, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start'
          }}>
            <AlertTriangle size={16} style={{ color: '#FB923C', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#FB923C', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Compliance Notice
              </div>
              <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.5' }}>
                Report content cannot be edited during Pending Review. Changes must be requested to return the report to the author.
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
              Reason for Changes <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="form-input"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#0F172A',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '6px',
                color: '#E2E8F0',
                fontSize: '14px'
              }}
            >
              <option value="incomplete-information">Incomplete Information</option>
              <option value="needs-clarification">Needs Clarification</option>
              <option value="formatting-issues">Formatting Issues</option>
              <option value="missing-evidence">Missing Evidence</option>
              <option value="inaccurate-details">Inaccurate Details</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Additional Notes */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
              Additional Notes <span style={{ color: '#64748B', fontSize: '12px', fontWeight: 400 }}>(Optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide specific guidance on what needs to be corrected..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#0F172A',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '6px',
                color: '#E2E8F0',
                fontSize: '14px',
                resize: 'vertical',
                minHeight: '100px'
              }}
            />
          </div>

          {/* Notify Guard Checkbox */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifyGuard}
                onChange={(e) => setNotifyGuard(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: '#3BD16F'
                }}
              />
              <span style={{ color: '#E2E8F0', fontSize: '14px' }}>
                Notify guard of required changes
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="button-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button 
            className="button-primary" 
            onClick={handleSubmit}
            style={{ 
              backgroundColor: '#FB923C',
              color: '#FFFFFF'
            }}
          >
            Request Changes
          </button>
        </div>
      </div>
    </div>
  );
}
