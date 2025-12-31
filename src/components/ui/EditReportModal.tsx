import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Dropdown_Dark } from './Dropdown_Dark';
import '../../edit-report-modal.css';

interface EditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reportId: number, updates: ReportUpdates) => void;
  onApprove: (reportId: number, updates: ReportUpdates) => void;
  onReject: (reportId: number, updates: ReportUpdates) => void;
  report: {
    id: number;
    referenceId: string;
    type: 'DAR' | 'Incident';
    site: string;
    content: string;
  } | null;
}

export interface ReportUpdates {
  type: 'DAR' | 'Incident';
  site: string;
  content: string;
  adminNote?: string;
  notifyGuard?: boolean;
}

interface Attachment {
  id: number;
  url: string;
  name: string;
}

export function EditReportModal({ isOpen, onClose, onSave, onApprove, onReject, report }: EditReportModalProps) {
  const [category, setCategory] = useState<'DAR' | 'Incident'>('Incident');
  const [location, setLocation] = useState('');
  const [narrative, setNarrative] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [notifyGuard, setNotifyGuard] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([
    { 
      id: 1, 
      url: 'https://images.unsplash.com/photo-1561756719-55231c95c511?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb29yJTIwbG9jayUyMHNlY3VyaXR5fGVufDF8fHx8MTc2NzA5MDI4NHww&ixlib=rb-4.1.0&q=80&w=1080', 
      name: 'door-lock.jpg' 
    },
    { 
      id: 2, 
      url: 'https://images.unsplash.com/photo-1760210211349-15b4ad2cf6c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWlsZGluZyUyMGhhbGx3YXklMjBjb3JyaWRvcnxlbnwxfHx8fDE3NjcxNDcyNDR8MA&ixlib=rb-4.1.0&q=80&w=1080', 
      name: 'hallway.jpg' 
    }
  ]);

  // Update form fields when report changes
  useEffect(() => {
    if (report) {
      setCategory(report.type);
      setLocation(report.site);
      setNarrative(report.content);
      setAdminNote('');
      setNotifyGuard(false);
    }
  }, [report]);

  if (!isOpen || !report) return null;

  const handleSave = () => {
    onSave(report.id, {
      type: category,
      site: location,
      content: narrative,
      adminNote: adminNote,
      notifyGuard: notifyGuard
    });
    onClose();
  };

  const handleApprove = () => {
    onApprove(report.id, {
      type: category,
      site: location,
      content: narrative,
      adminNote: adminNote,
      notifyGuard: notifyGuard
    });
    onClose();
  };

  const handleReject = () => {
    onReject(report.id, {
      type: category,
      site: location,
      content: narrative,
      adminNote: adminNote,
      notifyGuard: notifyGuard
    });
    onClose();
  };

  const handleCancel = () => {
    // Reset to original values
    if (report) {
      setCategory(report.type);
      setLocation(report.site);
      setNarrative(report.content);
      setAdminNote('');
      setNotifyGuard(false);
    }
    onClose();
  };

  const handleRemoveAttachment = (attachmentId: number) => {
    setAttachments(attachments.filter(a => a.id !== attachmentId));
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div className="edit-report-modal-overlay" onClick={handleOverlayClick}>
      <div className="edit-report-modal supervisor-review">
        {/* Header */}
        <div className="edit-report-modal-header">
          <h2>Supervisor Review: {report.referenceId}</h2>
          <button className="edit-report-modal-close" onClick={handleCancel}>
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="edit-report-modal-content">
          {/* Category Field */}
          <div className="edit-report-form-field">
            <label htmlFor="report-category">Report Category</label>
            <Dropdown_Dark
              value={category}
              onChange={(value) => setCategory(value as 'DAR' | 'Incident')}
              options={[
                { value: 'Incident', label: 'Incident Report' },
                { value: 'DAR', label: 'Daily Activity Report' }
              ]}
            />
          </div>

          {/* Location Field */}
          <div className="edit-report-form-field">
            <label htmlFor="report-location">Location</label>
            <input
              id="report-location"
              type="text"
              className="edit-report-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
            />
          </div>

          {/* Narrative Field - Shorter */}
          <div className="edit-report-form-field">
            <label htmlFor="report-narrative">Narrative</label>
            <textarea
              id="report-narrative"
              className="edit-report-textarea"
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Enter report narrative"
              rows={5}
            />
          </div>

          {/* Evidence Section */}
          <div className="edit-report-form-field">
            <label>Attachments / Evidence</label>
            <div className="evidence-thumbnails">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="evidence-thumbnail">
                  <img src={attachment.url} alt={attachment.name} />
                  <button 
                    className="evidence-remove-btn"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    title="Remove attachment"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="evidence-name">{attachment.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Note Field - Distinct Background */}
          <div className="edit-report-form-field">
            <label htmlFor="report-admin-note">
              Internal Admin Note <span className="label-subtitle">(Not visible to Client)</span>
            </label>
            <textarea
              id="report-admin-note"
              className="edit-report-textarea admin-note-field"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add internal notes for audit trail..."
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="edit-report-modal-actions">
          <div className="action-buttons-left">
            <button className="edit-report-reject-btn" onClick={handleReject}>
              Reject Report
            </button>
          </div>

          <div className="action-buttons-right">
            <label className="notify-guard-checkbox">
              <input
                type="checkbox"
                checked={notifyGuard}
                onChange={(e) => setNotifyGuard(e.target.checked)}
              />
              <span>Notify Guard of corrections</span>
            </label>
            
            <button className="edit-report-cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button className="edit-report-approve-btn" onClick={handleApprove}>
              Approve & Finalize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}