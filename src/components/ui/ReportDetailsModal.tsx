import React from 'react';
import { X, Download, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import '../../report-details-modal.css';

interface ReportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  onDownloadPDF?: () => void;
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
  'https://images.unsplash.com/photo-1561756719-55231c95c511?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb29yJTIwbG9jayUyMHNlY3VyaXR5fGVufDF8fHx8MTc2NzA5MDI4NHww&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1760210211349-15b4ad2cf6c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWlsZGluZyUyMGhhbGx3YXklMjBjb3JyaWRvcnxlbnwxfHx8fDE3NjcxNDcyNDR8MA&ixlib=rb-4.1.0&q=80&w=1080'
];

export function ReportDetailsModal({ 
  isOpen, 
  onClose, 
  onPrevious, 
  onNext, 
  hasPrevious, 
  hasNext, 
  onDownloadPDF,
  report 
}: ReportDetailsModalProps) {
  if (!isOpen || !report) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownloadPDF = () => {
    if (onDownloadPDF) {
      onDownloadPDF();
    } else {
      console.log('Downloading PDF for report:', report.referenceId);
      // In a real app, this would trigger PDF download
    }
  };

  const getStatusBadge = () => {
    if (report.status === 'approved') {
      return (
        <div className="status-badge approved">
          <CheckCircle size={18} />
          <span>Approved by Admin</span>
        </div>
      );
    } else if (report.status === 'rejected') {
      return (
        <div className="status-badge rejected">
          <XCircle size={18} />
          <span>Rejected by Admin</span>
        </div>
      );
    } else {
      return (
        <div className="status-badge pending">
          <Clock size={18} />
          <span>Pending Review</span>
        </div>
      );
    }
  };

  const getReportTypeLabel = () => {
    return report.type === 'Incident' ? 'Incident Report' : 'Daily Activity Report';
  };

  return (
    <div className="report-details-modal-overlay" onClick={handleOverlayClick}>
      {/* Previous Navigation Arrow */}
      {hasPrevious && (
        <button 
          className="report-nav-arrow left"
          onClick={onPrevious}
          title="Previous Report"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Modal Content */}
      <div className="report-details-modal">
        {/* Header */}
        <div className="report-details-header">
          <div className="header-title">
            <h2>{getReportTypeLabel()} {report.referenceId}</h2>
          </div>
          <div className="header-actions">
            <button className="download-pdf-btn" onClick={handleDownloadPDF} title="Download PDF">
              <Download size={18} />
            </button>
            <button className="report-details-close" onClick={onClose} title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Meta Row - Receipt Style */}
        <div className="report-meta-row">
          <div className="meta-item">
            <span className="meta-label">Submitted:</span>
            <span className="meta-value">{report.timestamp}</span>
          </div>
          <div className="meta-divider">|</div>
          <div className="meta-item">
            <span className="meta-label">Guard:</span>
            <span className="meta-value">{report.guardName}</span>
          </div>
          <div className="meta-divider">|</div>
          <div className="meta-item">
            <span className="meta-label">Location:</span>
            <span className="meta-value">{report.site}</span>
          </div>
        </div>

        {/* Modal Body - Scrollable Content */}
        <div className="report-details-body">
          {/* Report Narrative Section */}
          <div className="report-section">
            <h3 className="section-title">Narrative</h3>
            <div className="report-narrative-text">
              {report.content}
            </div>
          </div>

          {/* Evidence Grid Section */}
          <div className="report-section">
            <h3 className="section-title">Attached Evidence</h3>
            <div className="evidence-grid">
              {attachmentImages.map((imageUrl, index) => (
                <div key={index} className="evidence-item">
                  <img src={imageUrl} alt={`Evidence ${index + 1}`} />
                  <div className="evidence-caption">
                    Evidence Photo {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rejection Note if applicable */}
          {report.status === 'rejected' && report.rejectionNote && (
            <div className="report-section rejection-section">
              <h3 className="section-title rejection-title">Rejection Reason</h3>
              <div className="rejection-note-text">
                {report.rejectionNote}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Status */}
        <div className="report-details-footer">
          {getStatusBadge()}
          <button className="report-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {/* Next Navigation Arrow */}
      {hasNext && (
        <button 
          className="report-nav-arrow right"
          onClick={onNext}
          title="Next Report"
        >
          <ChevronRight size={28} />
        </button>
      )}
    </div>
  );
}