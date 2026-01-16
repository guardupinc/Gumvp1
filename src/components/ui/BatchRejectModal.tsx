import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { GUSelect } from './GUSelect';

interface BatchRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, note?: string) => void;
  selectedCount: number;
}

export function BatchRejectModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount
}: BatchRejectModalProps) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm(reason, note);
    // Reset state
    setReason('');
    setNote('');
  };

  const handleCancel = () => {
    setReason('');
    setNote('');
    onClose();
  };

  const reasonOptions = [
    { value: '', label: 'Select a reason...' },
    { value: 'missing-details', label: 'Missing details' },
    { value: 'wrong-type', label: 'Wrong report type' },
    { value: 'needs-clarification', label: 'Needs clarification' },
    { value: 'attachment-required', label: 'Attachment required' },
    { value: 'policy-format', label: 'Policy format issue' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div 
        className="batch-reject-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-wrapper modal-icon-warning">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2>Batch Reject Reports</h2>
              <p className="modal-subtitle">
                Rejecting {selectedCount} report{selectedCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <GUSelect
              label="Rejection Reason"
              value={reason}
              onChange={setReason}
              options={reasonOptions}
              required
              placeholder="Select a reason..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Additional Note
              <span className="form-label-optional">(Optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional context or instructions for the guards..."
              className="form-textarea"
              rows={4}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="modal-btn modal-btn-secondary"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="modal-btn modal-btn-danger"
            onClick={handleConfirm}
            disabled={!reason}
          >
            <AlertTriangle size={16} />
            Reject {selectedCount} Report{selectedCount > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
