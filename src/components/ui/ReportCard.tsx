import React from 'react';
import { FileText, AlertTriangle, CheckCircle, Edit, X, ArrowRight, Wrench } from 'lucide-react';
import '../../report-card.css';

// ============================================================================
// DATE FORMATTING UTILITIES - Convert ISO timestamps to human-readable format
// ============================================================================

/**
 * Formats a date string (ISO or locale string) to human-readable format
 * @param dateString - ISO timestamp (e.g., "2026-01-08T05:44:44.442Z") or locale string
 * @returns Formatted string like "Jan 8, 2026 · 12:44 AM" or original if already formatted
 */
const formatTimestamp = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  
  // If it's already in the desired format (contains "·" or "•"), return as-is
  if (dateString.includes('·') || dateString.includes('•')) {
    return dateString;
  }
  
  // Check if it's an ISO timestamp (contains 'T' or 'Z')
  if (dateString.includes('T') || dateString.includes('Z')) {
    const date = new Date(dateString);
    
    // Format: "Jan 8, 2026 · 12:44 AM"
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(',', ' ·');
  }
  
  // Return as-is if it's not ISO format
  return dateString;
};

/**
 * Converts any date string to UTC format for tooltip display
 * @param dateString - Any date string
 * @returns UTC formatted string like "2026-01-08 05:44:44Z"
 */
const getUTCTimestamp = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, 'Z');
  } catch {
    return dateString; // Fallback to original if parsing fails
  }
};

interface ReportCardProps {
  id: number;
  referenceId: string;  // Legacy field for backward compatibility
  reportCode?: string;  // CANONICAL: Immutable report identity
  type: 'DAR' | 'Incident' | 'Maintenance';
  priority: 'normal' | 'high';
  guardName: string;
  site: string;
  timestamp: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionNote?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
  onEdit?: (id: number) => void;
  onReject?: (id: number) => void;
  onApprove?: (id: number) => void;
  onViewDetails?: (id: number) => void;
  onEditAndResubmit?: (id: number) => void; // New prop for Edit & Resubmit
  createdBy?: string; // Track who created this report
  currentUserName?: string; // Current user for permission checks
}

export function ReportCard({
  id,
  referenceId,
  reportCode,
  type,
  priority,
  guardName,
  site,
  timestamp,
  content,
  status,
  rejectionNote,
  rejectedBy,
  rejectedAt,
  approvedBy,
  approvedAt,
  isSelected = false,
  onToggleSelect,
  onEdit,
  onReject,
  onApprove,
  onViewDetails,
  onEditAndResubmit,
  createdBy,
  currentUserName
}: ReportCardProps) {
  // Use reportCode if available, otherwise fall back to referenceId
  const displayId = reportCode ? `#${reportCode}` : referenceId;
  
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
        <div className="report-icon-box" data-priority={priority} data-type={type.toLowerCase()}>
          {type === 'Maintenance' ? (
            <Wrench size={24} />
          ) : priority === 'high' ? (
            <AlertTriangle size={24} />
          ) : (
            <FileText size={24} />
          )}
        </div>
        
        <div className="report-card-content">
          <div className="report-card-header">
            <div className="report-title-row">
              <h3>
                {type === 'Maintenance' ? 'Maintenance Request' : `${type} Report`}
              </h3>
              <div className="report-title-right">
                <span className="report-reference-id">{displayId}</span>
                <span 
                  className="report-timestamp" 
                  title={`UTC: ${getUTCTimestamp(timestamp)}`}
                  style={{ cursor: 'help' }}
                >
                  {formatTimestamp(timestamp)}
                </span>
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
              <button  className="view-details-link"
                onClick={() => onViewDetails?.(id)}
              >
                <span>View Full Report</span>
                <ArrowRight size={14} />
              </button>
              <div className="report-status-badge approved">
                <CheckCircle size={16} />
                <span>Approved</span>
                {approvedBy && approvedAt && (
                  <span style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 400, marginLeft: '8px' }}>
                    • Approved by {approvedBy} • {formatTimestamp(approvedAt)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Variant: Status = Rejected */}
          {status === 'rejected' && (
            <div className="report-approved-footer">
              {/* Show Edit & Resubmit button ONLY if current user created this report */}
              {createdBy === currentUserName && onEditAndResubmit && (
                <button 
                  className="view-details-link"
                  onClick={() => onEditAndResubmit(id)}
                  style={{
                    background: 'rgba(255, 122, 24, 0.1)',
                    color: '#FF7A18',
                    border: '1px solid rgba(255, 122, 24, 0.3)',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 500
                  }}
                >
                  <Edit size={14} />
                  <span>Edit & Resubmit</span>
                </button>
              )}
              {/* Show View button for all rejected reports */}
              {(!createdBy || createdBy !== currentUserName) && (
                <button 
                  className="view-details-link"
                  onClick={() => onViewDetails?.(id)}
                >
                  <span>View Full Report</span>
                  <ArrowRight size={14} />
                </button>
              )}
              <div className="report-status-badge rejected">
                <AlertTriangle size={16} />
                <span>Rejected</span>
                {rejectedBy && rejectedAt && (
                  <span style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 400, marginLeft: '8px' }}>
                    • Rejected by {rejectedBy} • {formatTimestamp(rejectedAt)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}