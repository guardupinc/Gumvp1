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
    type: 'DAR' | 'Incident' | 'Maintenance';
    site: string;
    content: string;
    location?: string;
    attachments?: Array<{ id: number; url: string; name: string }>;
    time?: string;
    date?: string;
    incidentType?: string;
    urgency?: string;
    policeCalled?: string;
    narrativeOnly?: string;
    caseId?: string;
    // DAR-specific fields
    shiftStart?: string;
    shiftEnd?: string;
    reliefGuard?: string;
    equipmentStatus?: string;  // Changed from equipmentCheck to match global state
    // Maintenance-specific fields
    maintenanceCategory?: string;
    specificArea?: string;
    assetId?: string;
    priority?: 'normal' | 'high';
  } | null;
}

export interface ReportUpdates {
  type: 'DAR' | 'Incident' | 'Maintenance';
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
  const [category, setCategory] = useState<'DAR' | 'Incident' | 'Maintenance'>('Incident');
  const [location, setLocation] = useState('');
  const [narrative, setNarrative] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [notifyGuard, setNotifyGuard] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Update form fields when report changes
  useEffect(() => {
    if (report) {
      setCategory(report.type);
      // Use report.location if available, otherwise show "Unknown Location"
      setLocation(report.location || 'Unknown Location');
      // Use narrativeOnly if available, otherwise fall back to content
      setNarrative(report.narrativeOnly || report.content);
      setAdminNote('');
      setNotifyGuard(false);
      // Set attachments from report data, or empty array if none
      setAttachments(report.attachments || []);
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
      // Use report.location if available, otherwise show "Unknown Location"
      setLocation(report.location || 'Unknown Location');
      // Use narrativeOnly if available, otherwise fall back to content
      setNarrative(report.narrativeOnly || report.content);
      setAdminNote('');
      setNotifyGuard(false);
      // Set attachments from report data, or empty array if none
      setAttachments(report.attachments || []);
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
          <h2>Supervisor Review: {report?.referenceId || 'New Report'}</h2>
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
              onChange={(value) => setCategory(value as 'DAR' | 'Incident' | 'Maintenance')}
              options={[
                { value: 'Incident', label: 'Incident Report' },
                { value: 'DAR', label: 'Daily Activity Report' },
                { value: 'Maintenance', label: 'Maintenance Request' }
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

          {/* Metadata Grid - Conditional Layout Based on Report Type */}
          {category === 'Incident' ? (
            // INCIDENT REPORT METADATA - 5 Columns
            <div className="metadata-grid">
              <div className="metadata-field">
                <label className="metadata-label">Date of Incident</label>
                <div className="metadata-value">{report.date || 'N/A'}</div>
              </div>
              <div className="metadata-field">
                <label className="metadata-label">Time of Incident</label>
                <div className="metadata-value">{report.time || 'N/A'}</div>
              </div>
              <div className="metadata-field">
                <label className="metadata-label">Incident Type</label>
                <div className="metadata-value">{report.incidentType || 'N/A'}</div>
              </div>
              <div className="metadata-field">
                <label className="metadata-label">Urgency</label>
                <div className="metadata-value metadata-urgency">{report.urgency || 'N/A'}</div>
              </div>
              <div className="metadata-field">
                <label className="metadata-label">Police Called?</label>
                <div className="metadata-value metadata-police">{report.policeCalled || 'N/A'}</div>
              </div>
            </div>
          ) : category === 'Maintenance' ? (
            // MAINTENANCE REQUEST METADATA - 5 Columns
            <div className="metadata-grid">
              <div className="metadata-field">
                <label className="metadata-label">Date Reported</label>
                <div className="metadata-value">{report.date || 'N/A'}</div>
              </div>
              <div className="metadata-field">
                <label className="metadata-label">Time Detected</label>
                <div className="metadata-value">{report.time || 'N/A'}</div>
              </div>
              <div className="metadata-field">
                <label className="metadata-label">Category</label>
                <div className="metadata-value">{report.maintenanceCategory || 'General'}</div>
              </div>
              <div className="metadata-field">
                <label className="metadata-label">Specific Area</label>
                <div className="metadata-value">{report.specificArea || 'N/A'}</div>
              </div>
              <div className="metadata-field">
                <label className="metadata-label">Priority</label>
                <div className="metadata-value metadata-priority">
                  {report.priority === 'high' ? 'High' : 'Normal'}
                </div>
              </div>
              {report.assetId && (
                <div className="metadata-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="metadata-label">Asset ID / Tag</label>
                  <div className="metadata-value">{report.assetId}</div>
                </div>
              )}
            </div>
          ) : (
            // DAR METADATA - 5 Columns (Operational Log Style)
            <div className="metadata-grid">
              <div className="metadata-field">
                <label className="metadata-label">Date</label>
                <div className="metadata-value">{report.date || 'N/A'}</div>
              </div>
              <div className="metadata-field">
                <label className="metadata-label">Shift Start</label>
                <div className="metadata-value">{report.shiftStart || 'N/A'}</div>
              </div>
              <div className="metadata-field">
                <label className="metadata-label">Shift End</label>
                <div className="metadata-value">{report.shiftEnd || 'N/A'}</div>
              </div>
              <div className="metadata-field">
                <label className="metadata-label">Relief Guard</label>
                <div className="metadata-value">{report.reliefGuard || 'N/A'}</div>
              </div>
              <div className="metadata-field">
                <label className="metadata-label">Equipment Check</label>
                <div className="metadata-value metadata-equipment">{report.equipmentStatus || 'N/A'}</div>
              </div>
            </div>
          )}

          {/* Narrative Field - Shorter */}
          <div className="edit-report-form-field">
            <label htmlFor="report-narrative">
              {category === 'Maintenance' ? 'Issue Description' : category === 'DAR' ? 'Activity Summary' : 'Narrative'}
            </label>
            <textarea
              id="report-narrative"
              className="edit-report-textarea"
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder={
                category === 'Maintenance' ? 'Describe the equipment issue or maintenance need...' :
                category === 'DAR' ? 'Enter shift activity summary...' : 
                'Enter report narrative'
              }
              rows={5}
            />
          </div>

          {/* Evidence Section */}
          <div className="edit-report-form-field">
            <label>Attachments / Evidence</label>
            {attachments.length > 0 ? (
              <div className="evidence-thumbnails">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="evidence-thumbnail">
                    <img 
                      src={attachment.url} 
                      alt={attachment.name}
                      onClick={() => window.open(attachment.url, '_blank')}
                      className="cursor-pointer"
                      title="Click to view full size"
                    />
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
            ) : (
              <div className="no-evidence-message">No evidence attached</div>
            )}
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