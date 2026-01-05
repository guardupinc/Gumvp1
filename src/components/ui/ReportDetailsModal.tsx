import React from 'react';
import { X, ChevronLeft, ChevronRight, Target, User, MapPin, Calendar, Edit3, Check, XCircle } from 'lucide-react';
import '../../report-details-modal.css';

interface ReportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  onDownloadPDF?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  report: {
    id: number;
    referenceId: string;
    type: 'DAR' | 'Incident';
    guardName: string;
    site: string;
    timestamp: string;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionNote?: string;
    approvedBy?: string;
    approvedByRole?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedByRole?: string;
    rejectedAt?: string;
    location?: string;
    attachments?: Array<{ id: number; url: string; name: string }>;
  } | null;
}

export function ReportDetailsModal({ 
  isOpen, 
  onClose, 
  onPrevious, 
  onNext, 
  hasPrevious, 
  hasNext, 
  onDownloadPDF,
  onApprove,
  onReject,
  report 
}: ReportDetailsModalProps) {
  if (!isOpen || !report) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEditNarrative = () => {
    console.log('Edit narrative clicked');
    // TODO: Implement edit functionality
    alert('✎ Edit functionality will allow supervisors to refine guard reports before approval.');
  };

  const handleApproveClick = () => {
    if (onApprove) {
      onApprove();
    }
  };

  const handleRejectClick = () => {
    if (onReject) {
      onReject();
    }
  };

  const getReportTypeLabel = () => {
    return report.type === 'Incident' ? 'Incident Report' : 'Daily Activity Report';
  };

  return (
    <div className="qc-modal-overlay" onClick={handleOverlayClick}>
      {/* Previous Navigation Arrow */}
      {hasPrevious && (
        <button 
          className="qc-nav-arrow left"
          onClick={onPrevious}
          title="Previous Report"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Modal Content - Quality Control Station */}
      <div className="qc-modal">
        {/* Close Button - Top Right */}
        <button className="qc-close-btn" onClick={onClose} title="Close">
          <X size={24} />
        </button>

        {/* Header: Trust & Metadata */}
        <div className="qc-header">
          <div className="qc-header-top">
            <h2 className="qc-title">{getReportTypeLabel()} {report.referenceId}</h2>
          </div>
          
          <div className="qc-header-meta">
            <div className="qc-meta-item">
              <User size={14} />
              <span>{report.guardName}</span>
            </div>
            <div className="qc-meta-item">
              <MapPin size={14} />
              <span>{report.location || report.site}</span>
            </div>
            <div className="qc-meta-item">
              <Calendar size={14} />
              <span>{report.timestamp}</span>
            </div>
          </div>
        </div>

        {/* Body - Scrollable Content */}
        <div className="qc-body">
          {/* Narrative Section */}
          <div className="qc-section">
            <div className="qc-section-header">
              <h3 className="qc-section-label">OFFICER NARRATIVE</h3>
              {report.status === 'pending' && (
                <button className="qc-edit-link" onClick={handleEditNarrative}>
                  <Edit3 size={14} />
                  Edit Text
                </button>
              )}
            </div>
            <div className="qc-narrative-box">
              <p>{report.content}</p>
            </div>
          </div>

          {/* Evidence Section */}
          <div className="qc-section">
            <h3 className="qc-section-label">ATTACHED EVIDENCE</h3>
            {report.attachments && report.attachments.length > 0 ? (
              <div className="qc-evidence-grid">
                {report.attachments.map((attachment) => (
                  <div key={attachment.id} className="qc-evidence-item">
                    <img src={attachment.url} alt={attachment.name} />
                    <div className="qc-evidence-overlay">
                      <span>{attachment.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#9CA3AF', fontSize: '14px', padding: '12px 0' }}>
                No evidence attached
              </div>
            )}
          </div>

          {/* Rejection Note if applicable */}
          {report.status === 'rejected' && report.rejectionNote && (
            <div className="qc-section qc-rejection-section">
              <h3 className="qc-section-label">REJECTION REASON</h3>
              <div className="qc-rejection-box">
                <p>{report.rejectionNote}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Command Bar */}
        <div className="qc-footer">
          <div className="qc-footer-left">
            {report.status === 'pending' && (
              <div className="qc-status-indicator pending">
                <span className="qc-status-dot"></span>
                Pending Review
              </div>
            )}
            {report.status === 'approved' && (
              <div className="qc-status-indicator approved">
                <Check size={16} />
                <span>Approved</span>
                {report.approvedBy && report.approvedAt && (
                  <span style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 400, marginLeft: '8px' }}>
                    • {report.approvedBy} • {report.approvedAt}
                  </span>
                )}
              </div>
            )}
            {report.status === 'rejected' && (
              <div className="qc-status-indicator rejected">
                <XCircle size={16} />
                <span>Rejected</span>
                {report.rejectedBy && report.rejectedAt && (
                  <span style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 400, marginLeft: '8px' }}>
                    • {report.rejectedBy} • {report.rejectedAt}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="qc-footer-right">
            {report.status === 'pending' && (
              <>
                <button className="qc-btn-reject" onClick={handleRejectClick}>
                  Reject
                </button>
                <button className="qc-btn-approve" onClick={handleApproveClick}>
                  <Check size={18} />
                  Approve & Send
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Next Navigation Arrow */}
      {hasNext && (
        <button 
          className="qc-nav-arrow right"
          onClick={onNext}
          title="Next Report"
        >
          <ChevronRight size={32} />
        </button>
      )}
    </div>
  );
}