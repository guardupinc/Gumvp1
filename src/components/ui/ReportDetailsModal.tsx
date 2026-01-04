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
  } | null;
}

const attachmentImages = [
  {
    url: 'https://images.unsplash.com/photo-1561756719-55231c95c511?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb29yJTIwbG9jayUyMHNlY3VyaXR5fGVufDF8fHx8MTc2NzA5MDI4NHww&ixlib=rb-4.1.0&q=80&w=1080',
    timestamp: '20:45 PM',
    location: 'Loading Dock'
  },
  {
    url: 'https://images.unsplash.com/photo-1760210211349-15b4ad2cf6c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWlsZGluZyUyMGhhbGx3YXklMjBjb3JyaWRvcnxlbnwxfHx8fDE3NjcxNDcyNDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    timestamp: '20:52 PM',
    location: 'Main Corridor'
  }
];

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
            <div className="qc-trust-badge">
              <Target size={14} />
              <span>GPS Verified</span>
            </div>
          </div>
          
          <div className="qc-header-meta">
            <div className="qc-meta-item">
              <User size={14} />
              <span>{report.guardName}</span>
            </div>
            <div className="qc-meta-item">
              <MapPin size={14} />
              <span>{report.site}</span>
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
              <button className="qc-edit-link" onClick={handleEditNarrative}>
                <Edit3 size={14} />
                Edit Text
              </button>
            </div>
            <div className="qc-narrative-box">
              <p>{report.content}</p>
            </div>
          </div>

          {/* Evidence Section */}
          <div className="qc-section">
            <h3 className="qc-section-label">ATTACHED EVIDENCE</h3>
            <div className="qc-evidence-grid">
              {attachmentImages.map((image, index) => (
                <div key={index} className="qc-evidence-item">
                  <img src={image.url} alt={`Evidence ${index + 1}`} />
                  <div className="qc-evidence-overlay">
                    <span>{image.timestamp} • {image.location}</span>
                  </div>
                </div>
              ))}
            </div>
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
                Approved
              </div>
            )}
            {report.status === 'rejected' && (
              <div className="qc-status-indicator rejected">
                <XCircle size={16} />
                Rejected
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
