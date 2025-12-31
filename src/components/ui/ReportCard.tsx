import React from 'react';
import { FileText, AlertTriangle, CheckCircle, Edit, X, ArrowRight } from 'lucide-react';
import '../../report-card.css';

interface ReportCardProps {
  id: number;
  referenceId: string;
  type: 'DAR' | 'Incident';
  priority: 'normal' | 'high';
  guardName: string;
  site: string;
  timestamp: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionNote?: string;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
  onEdit?: (id: number) => void;
  onReject?: (id: number) => void;
  onApprove?: (id: number) => void;
  onViewDetails?: (id: number) => void;
}

export function ReportCard({
  id,
  referenceId,
  type,
  priority,
  guardName,
  site,
  timestamp,
  content,
  status,
  rejectionNote,
  isSelected = false,
  onToggleSelect,
  onEdit,
  onReject,
  onApprove,
  onViewDetails
}: ReportCardProps) {
  return (
    <div 
      className={`report-card ${isSelected ? 'selected' : ''}`}
      data-status={status}
    >
      {status === 'pending' && onToggleSelect && (
        <input
          type="checkbox"
          className="report-checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(id)}
        />
      )}
      
      <div className="report-card-main">
        <div className="report-icon-box" data-priority={priority}>
          {priority === 'high' ? (
            <AlertTriangle size={24} />
          ) : (
            <FileText size={24} />
          )}
        </div>
        
        <div className="report-card-content">
          <div className="report-card-header">
            <div className="report-title-row">
              <h3>{type} Report</h3>
              <div className="report-title-right">
                <span className="report-reference-id">{referenceId}</span>
                <span className="report-timestamp">{timestamp}</span>
              </div>
            </div>
            <div className="report-meta">
              <span className="report-guard">{guardName}</span>
              <span className="report-divider">•</span>
              <span className="report-site">{site}</span>
            </div>
          </div>

          <div className="report-quote-box">
            <p>{content}</p>
          </div>

          {/* Rejection Note - Only for Rejected Variant */}
          {status === 'rejected' && rejectionNote && (
            <div className="rejection-note-container">
              <p className="rejection-note-text">
                <strong>Admin Note:</strong> {rejectionNote}
              </p>
            </div>
          )}

          {/* Variant: Status = Pending */}
          {status === 'pending' && (
            <div className="report-actions">
              <button 
                className="report-action-btn btn-edit"
                onClick={() => onEdit?.(id)}
              >
                <Edit size={16} />
                <span>Edit</span>
              </button>
              <button 
                className="report-action-btn btn-reject"
                onClick={() => onReject?.(id)}
              >
                <X size={16} />
                <span>Reject</span>
              </button>
              <button 
                className="report-action-btn btn-approve"
                onClick={() => onApprove?.(id)}
              >
                <CheckCircle size={16} />
                <span>Approve</span>
              </button>
            </div>
          )}

          {/* Variant: Status = Approved */}
          {status === 'approved' && (
            <div className="report-approved-footer">
              <button 
                className="view-details-link"
                onClick={() => onViewDetails?.(id)}
              >
                <span>View Full Report</span>
                <ArrowRight size={14} />
              </button>
              <div className="report-status-badge approved">
                <CheckCircle size={16} />
                <span>Approved</span>
              </div>
            </div>
          )}

          {/* Variant: Status = Rejected */}
          {status === 'rejected' && (
            <div className="report-approved-footer">
              <button 
                className="view-details-link"
                onClick={() => onViewDetails?.(id)}
              >
                <span>View Full Report</span>
                <ArrowRight size={14} />
              </button>
              <div className="report-status-badge rejected">
                <AlertTriangle size={16} />
                <span>Rejected</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}