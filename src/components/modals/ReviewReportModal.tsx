import React, { useState } from 'react';
import { X, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

interface ReviewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: {
    id: number;
    type: string;
    title: string;
    submittedBy: string;
    submittedDate: string;
    priority: 'high' | 'medium' | 'low';
  } | null;
  onApprove: (reportId: number, comments: string) => void;
  onReject: (reportId: number, comments: string) => void;
}

export function ReviewReportModal({ isOpen, onClose, report, onApprove, onReject }: ReviewReportModalProps) {
  const [comments, setComments] = useState('');

  if (!isOpen || !report) return null;

  const handleApprove = () => {
    onApprove(report.id, comments);
    setComments('');
    onClose();
  };

  const handleReject = () => {
    onReject(report.id, comments);
    setComments('');
    onClose();
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-container review-report-modal">
        <div className="modal-header">
          <h2>Review Report</h2>
          <button className="modal-close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="report-details">
            <div className="report-detail-row">
              <span className="report-detail-label">Type:</span>
              <span className={`status-badge ${report.priority === 'high' ? 'expired' : 'pending'}`}>
                {report.type}
              </span>
            </div>
            <div className="report-detail-row">
              <span className="report-detail-label">Title:</span>
              <span className="report-detail-value">{report.title}</span>
            </div>
            <div className="report-detail-row">
              <span className="report-detail-label">Submitted By:</span>
              <span className="report-detail-value">{report.submittedBy}</span>
            </div>
            <div className="report-detail-row">
              <span className="report-detail-label">Submitted Date:</span>
              <span className="report-detail-value">{report.submittedDate}</span>
            </div>
            <div className="report-detail-row">
              <span className="report-detail-label">Priority:</span>
              <span className={`status-badge ${report.priority === 'high' ? 'expired' : report.priority === 'medium' ? 'pending' : 'success'}`}>
                {report.priority}
              </span>
            </div>
          </div>

          <div className="report-content-section">
            <h3>Report Content</h3>
            <div className="report-content-preview">
              <p>
                This is a placeholder for the full report content. In a production environment, 
                this would display the complete incident report details, including timestamps, 
                location information, witness statements, and any attached evidence.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <MessageSquare size={16} />
              Review Comments
            </label>
            <textarea
              className="form-textarea"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add your review comments here..."
              rows={4}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button-danger" onClick={handleReject}>
            <XCircle size={16} />
            Reject
          </button>
          <button className="button-primary" onClick={handleApprove}>
            <CheckCircle size={16} />
            Approve
          </button>
        </div>
      </div>
    </>
  );
}
