import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Target, User, MapPin, Calendar, Edit3, Check, XCircle } from 'lucide-react';
import { AttachmentGrid } from './AttachmentGrid';
import { formatTimestamp, formatApprovalTimestamp, DEFAULT_ORGANIZATION_TIMEZONE } from '../../utils/organizationTimezone';
import { canApproveReports, isReportAuthor, type CurrentUser } from '../../contexts/AppStateContext';
import '../../report-details-modal.css';

// Report type enum for business logic
type ReportType = 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift_pass_on' | 'other';

// Helper function to determine if a report is client-deliverable
function isClientDeliverable(reportType?: ReportType): boolean {
  if (!reportType) return false;
  return ['incident', 'dar', 'maintenance'].includes(reportType);
}

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
  currentUser?: CurrentUser; // Required for permission checking
  report: {
    id: number;
    referenceId: string;
    reportCode: string;  // CANONICAL: Immutable report identity
    type: 'DAR' | 'Incident' | 'Maintenance' | 'Disciplinary' | 'Shift Pass-On';
    reportType?: ReportType;  // Normalized field for business logic
    guardName: string;
    site: string;
    timestamp: string;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionNote?: string;
    // IMMUTABLE AUTHORSHIP FIELDS
    author_user_id?: number;
    author_name?: string;
    created_at?: string;
    approvedBy?: string;
    approvedByRole?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedByRole?: string;
    rejectedAt?: string;
    location?: string;
    attachments?: Array<{ id: number; url: string; name: string }>;
    date?: string;
    time?: string;
    incidentType?: string;
    urgency?: string;
    // CANONICAL police fields (snake_case - preferred)
    police_called?: boolean | string;  // boolean in new reports, string for backward compat
    pd_case_number?: string;
    // LEGACY police fields (camelCase - backward compatibility)
    policeCalled?: string;
    pdCaseNumber?: string;
    // Narrative and actions
    narrativeOnly?: string;
    actionTaken?: string;  // CANONICAL field name
    actions_taken?: string;  // Also check this variant
    priority?: 'normal' | 'high';
    // DAR-specific fields
    shiftStart?: string;
    shiftEnd?: string;
    reliefGuard?: string;
    equipmentStatus?: string;
    // Maintenance-specific fields
    maintenanceCategory?: string;
    specificArea?: string;
    assetId?: string;
    // Disciplinary-specific fields
    employeeName?: string;
    violationType?: string;
    disciplineLevel?: string;
    correctiveAction?: string;
    // Shift Pass-On specific fields
    shift?: string;  // Day / Swing / Overnight
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
  currentUser,
  report 
}: ReportDetailsModalProps) {
  if (!isOpen || !report) return null;
  
  // Permission checks
  const userCanApprove = currentUser ? canApproveReports(currentUser.role) : false;
  const isAuthor = currentUser && report ? isReportAuthor(report as any, currentUser) : false;
  const isSelfApproval = userCanApprove && isAuthor;

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
    // CANONICAL: Use reportType field to determine display title
    const typeMap: Record<ReportType, string> = {
      incident: 'Incident Report',
      dar: 'Daily Activity Report',
      maintenance: 'Maintenance Report',
      disciplinary: 'Disciplinary Report',
      shift_pass_on: 'Shift Pass-On Log',
      other: 'Report'
    };
    
    // Use normalized reportType if available, otherwise derive from legacy type field
    const normalizedType: ReportType = report.reportType || 
      (report.type === 'Incident' ? 'incident' :
       report.type === 'DAR' ? 'dar' :
       report.type === 'Maintenance' ? 'maintenance' :
       report.type === 'Disciplinary' ? 'disciplinary' : 'other');
    
    return typeMap[normalizedType];
  };
  
  // Determine if report is internal-only
  const isInternalOnly = report.reportType === 'disciplinary' || report.reportType === 'shift_pass_on' || !isClientDeliverable(report.reportType);

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
            <h2 className="qc-title">{getReportTypeLabel()} #{report.reportCode}</h2>
          </div>
          
          <div className="qc-header-meta">
            <div className="qc-meta-item">
              <User size={14} />
              <span>{report.author_name || report.guardName}</span>
            </div>
            <div className="qc-meta-item">
              <MapPin size={14} />
              <span>{report.location || report.site}</span>
            </div>
            <div className="qc-meta-item">
              <Calendar size={14} />
              <span>{formatTimestamp(report.timestamp, DEFAULT_ORGANIZATION_TIMEZONE)}</span>
            </div>
            {/* Status Pill */}
            <div className="qc-meta-item">
              <span style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: report.status === 'approved' ? 'rgba(59, 209, 111, 0.15)' :
                                 report.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' :
                                 'rgba(255, 122, 24, 0.15)',
                color: report.status === 'approved' ? '#3BD16F' :
                       report.status === 'rejected' ? '#EF4444' :
                       '#FF7A18'
              }}>
                {report.status.toUpperCase()}
              </span>
            </div>
          </div>
          
          {/* INTERNAL ONLY Banner */}
          {isInternalOnly && (
            <div style={{
              backgroundColor: '#7F1D1D',
              borderLeft: '4px solid #DC2626',
              padding: '12px 16px',
              marginTop: '16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '4px',
                letterSpacing: '0.5px'
              }}>
                🔒 INTERNAL ONLY
              </span>
              <span style={{
                color: '#FCA5A5',
                fontSize: '13px',
                fontWeight: 500
              }}>
                This document will NOT be sent to clients
              </span>
            </div>
          )}

          {/* COMPLIANCE BANNER: Read-Only During Pending Review */}
          {report.status === 'pending' && (
            <div style={{
              backgroundColor: 'rgba(100, 116, 139, 0.15)',
              borderLeft: '4px solid #64748B',
              padding: '12px 16px',
              marginTop: '16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                backgroundColor: '#64748B',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '4px',
                letterSpacing: '0.5px'
              }}>
                🔒 READ-ONLY
              </span>
              <span style={{
                color: '#CBD5E1',
                fontSize: '13px',
                fontWeight: 500
              }}>
                Report content is read-only during review. Use "Request Changes" to return to author for edits.
              </span>
            </div>
          )}
        </div>

        {/* Body - Two Column Layout */}
        <div className="qc-body" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
          {/* LEFT COLUMN: Report Details */}
          <div>
            {/* Report Data Section - Conditional based on report type */}
            <div className="qc-section">
              <h3 className="qc-section-label">REPORT DETAILS</h3>
              
              {/* Disciplinary Report Data */}
              {report.type === 'Disciplinary' && (
                <div className="qc-data-grid">
                  <div className="qc-data-item">
                    <div className="qc-data-label">Reporting Officer</div>
                    <div className="qc-data-value">{report.author_name || report.guardName}</div>
                  </div>
                  <div className="qc-data-item">
                    <div className="qc-data-label">Disciplinary Case ID</div>
                    <div className="qc-data-value" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{report.reportCode}</div>
                  </div>
                  {report.date && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Date of Incident</div>
                      <div className="qc-data-value">{report.date}</div>
                    </div>
                  )}
                  {report.time && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Time of Incident</div>
                      <div className="qc-data-value">{report.time}</div>
                    </div>
                  )}
                  {report.employeeName && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Employee Name</div>
                      <div className="qc-data-value" style={{ fontWeight: 600 }}>{report.employeeName}</div>
                    </div>
                  )}
                  <div className="qc-data-item">
                    <div className="qc-data-label">Site / Location</div>
                    <div className="qc-data-value">{report.location || report.site}</div>
                  </div>
                  {report.violationType && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Violation Type</div>
                      <div className="qc-data-value">{report.violationType}</div>
                    </div>
                  )}
                  {report.disciplineLevel && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Level of Discipline</div>
                      <div className="qc-data-value" style={{ 
                        color: report.disciplineLevel.toLowerCase().includes('written') ? '#F59E0B' :
                               report.disciplineLevel.toLowerCase().includes('termination') ? '#EF4444' :
                               report.disciplineLevel.toLowerCase().includes('suspension') ? '#F97316' :
                               '#9CA3AF',
                        fontWeight: 600
                      }}>
                        {report.disciplineLevel}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Incident Report Data */}
              {report.type === 'Incident' && (
                <div className="qc-data-grid">
                  <div className="qc-data-item">
                    <div className="qc-data-label">Reporting Officer</div>
                    <div className="qc-data-value">{report.author_name || report.guardName}</div>
                  </div>
                  <div className="qc-data-item">
                    <div className="qc-data-label">Incident Case ID</div>
                    <div className="qc-data-value" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{report.reportCode}</div>
                  </div>
                  <div className="qc-data-item">
                    <div className="qc-data-label">Location / Site</div>
                    <div className="qc-data-value">{report.location || report.site}</div>
                  </div>
                  {report.date && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Date of Incident</div>
                      <div className="qc-data-value">{report.date}</div>
                    </div>
                  )}
                  {report.time && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Time of Incident</div>
                      <div className="qc-data-value">{report.time}</div>
                    </div>
                  )}
                  {report.incidentType && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Incident Type</div>
                      <div className="qc-data-value">{report.incidentType}</div>
                    </div>
                  )}
                  {report.urgency && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Urgency</div>
                      <div className="qc-data-value" style={{ 
                        color: report.urgency === 'Critical' || report.urgency === 'High' ? '#EF4444' : '#F59E0B',
                        fontWeight: 600
                      }}>
                        {report.urgency}
                      </div>
                    </div>
                  )}
                  <div className="qc-data-item">
                    <div className="qc-data-label">Police Called</div>
                    <div className="qc-data-value" style={{ 
                      color: (report.police_called === true || report.police_called === 'Yes' || report.policeCalled === 'Yes') ? '#3BD16F' : '#9CA3AF',
                      fontWeight: 600
                    }}>
                      {(report.police_called === true || report.police_called === 'Yes' || report.policeCalled === 'Yes') ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div className="qc-data-item">
                    <div className="qc-data-label">PD Case Number</div>
                    <div className="qc-data-value" style={{
                      color: (report.pd_case_number || report.pdCaseNumber) ? '#E2E8F0' : '#64748B'
                    }}>
                      {report.pd_case_number || report.pdCaseNumber || 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {/* DAR Data */}
              {report.type === 'DAR' && (
                <div className="qc-data-grid">
                  {report.date && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Date</div>
                      <div className="qc-data-value">{report.date}</div>
                    </div>
                  )}
                  {report.shiftStart && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Shift Start</div>
                      <div className="qc-data-value">{report.shiftStart}</div>
                    </div>
                  )}
                  {report.shiftEnd && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Shift End</div>
                      <div className="qc-data-value">{report.shiftEnd}</div>
                    </div>
                  )}
                  {report.reliefGuard && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Relief Guard</div>
                      <div className="qc-data-value">{report.reliefGuard}</div>
                    </div>
                  )}
                  {report.equipmentStatus && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Equipment Status</div>
                      <div className="qc-data-value" style={{ color: report.equipmentStatus === 'All Operational' ? '#3BD16F' : '#F59E0B' }}>{report.equipmentStatus}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Maintenance Report Data */}
              {report.type === 'Maintenance' && (
                <div className="qc-data-grid">
                  {report.date && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Date Reported</div>
                      <div className="qc-data-value">{report.date}</div>
                    </div>
                  )}
                  {report.time && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Time Detected</div>
                      <div className="qc-data-value">{report.time}</div>
                    </div>
                  )}
                  {report.maintenanceCategory && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Category</div>
                      <div className="qc-data-value">{report.maintenanceCategory}</div>
                    </div>
                  )}
                  {report.specificArea && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Specific Area</div>
                      <div className="qc-data-value">{report.specificArea}</div>
                    </div>
                  )}
                  {report.assetId && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Asset ID</div>
                      <div className="qc-data-value">{report.assetId}</div>
                    </div>
                  )}
                  {report.priority && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Priority</div>
                      <div className="qc-data-value" style={{ color: report.priority === 'high' ? '#EF4444' : '#9CA3AF' }}>{report.priority === 'high' ? 'High' : 'Normal'}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Shift Pass-On Log Data */}
              {report.reportType === 'shift_pass_on' && (
                <div className="qc-data-grid">
                  <div className="qc-data-item">
                    <div className="qc-data-label">Reporting Officer</div>
                    <div className="qc-data-value">{report.guardName}</div>
                  </div>
                  <div className="qc-data-item">
                    <div className="qc-data-label">Pass-On Log ID</div>
                    <div className="qc-data-value">{report.reportCode}</div>
                  </div>
                  {report.site && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Site / Location</div>
                      <div className="qc-data-value">{report.site}</div>
                    </div>
                  )}
                  {report.shift && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Shift</div>
                      <div className="qc-data-value">{report.shift}</div>
                    </div>
                  )}
                  {report.timestamp && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Created</div>
                      <div className="qc-data-value">{report.timestamp}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Narrative Section */}
            <div className="qc-section">
              <div className="qc-section-header">
                <h3 className="qc-section-label">
                  {report.reportType === 'shift_pass_on' ? 'HANDOVER NOTES' : 
                   report.type === 'Disciplinary' ? 'NARRATIVE OF EVENTS' : 'OFFICER NARRATIVE'}
                </h3>
                {/* COMPLIANCE: Report content is read-only during Pending Review */}
                {report.status === 'pending' && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#64748B',
                    letterSpacing: '0.5px',
                    padding: '4px 8px',
                    backgroundColor: 'rgba(100, 116, 139, 0.1)',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>
                    🔒 Read-Only
                  </span>
                )}
              </div>
              <div className="qc-narrative-box">
                <p>{report.content}</p>
              </div>
            </div>
            
            {/* Corrective Action Section - Only for Disciplinary Reports */}
            {report.type === 'Disciplinary' && report.correctiveAction && (
              <div className="qc-section">
                <h3 className="qc-section-label">CORRECTIVE ACTION / EXPECTED IMPROVEMENT</h3>
                <div className="qc-action-taken-box">
                  <p>{report.correctiveAction}</p>
                </div>
              </div>
            )}

            {/* Action Taken Section - Only for Incident Reports - ALWAYS SHOW even if empty */}
            {report.type === 'Incident' && (
              <div className="qc-section">
                <h3 className="qc-section-label">ACTIONS TAKEN</h3>
                <div className="qc-action-taken-box">
                  <p>{report.actionTaken || report.actions_taken || 'N/A'}</p>
                </div>
              </div>
            )}

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
          
          {/* RIGHT COLUMN: Evidence & Activity */}
          <div>
            {/* Evidence Section */}
            <div className="qc-section">
              <h3 className="qc-section-label">ATTACHED EVIDENCE</h3>
              {report.attachments && report.attachments.length > 0 ? (
                <AttachmentGrid attachments={report.attachments} />
              ) : (
                <div style={{ color: '#9CA3AF', fontSize: '14px', padding: '12px 0' }}>
                  No evidence attached
                </div>
              )}
            </div>
            
            {/* Activity / Audit Trail Section */}
            <div className="qc-section" style={{ marginTop: '24px' }}>
              <h3 className="qc-section-label">ACTIVITY</h3>
              <div style={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.5)', 
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                padding: '16px'
              }}>
                {/* Created */}
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                  marginBottom: '12px'
                }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: '#64748B',
                    marginTop: '6px',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: 500 }}>
                      Report Created
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: '12px', marginTop: '2px' }}>
                      by {report.guardName} • {report.timestamp}
                    </div>
                  </div>
                </div>
                
                {/* Approved */}
                {report.status === 'approved' && report.approvedBy && report.approvedAt && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: '#3BD16F',
                      marginTop: '6px',
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#3BD16F', fontSize: '13px', fontWeight: 500 }}>
                        Report Approved
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: '12px', marginTop: '2px' }}>
                        {report.approvedBy} • {formatApprovalTimestamp(report.approvedAt, DEFAULT_ORGANIZATION_TIMEZONE)}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Rejected */}
                {report.status === 'rejected' && report.rejectedBy && report.rejectedAt && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: '#EF4444',
                      marginTop: '6px',
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#EF4444', fontSize: '13px', fontWeight: 500 }}>
                        Report Rejected
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: '12px', marginTop: '2px' }}>
                        {report.rejectedBy} • {formatApprovalTimestamp(report.rejectedAt, DEFAULT_ORGANIZATION_TIMEZONE)}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Pending */}
                {report.status === 'pending' && (
                  <div style={{ color: '#94A3B8', fontSize: '12px', fontStyle: 'italic' }}>
                    Awaiting supervisor review...
                  </div>
                )}
              </div>
            </div>
          </div>
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
                    • {report.approvedBy} • {formatApprovalTimestamp(report.approvedAt, DEFAULT_ORGANIZATION_TIMEZONE)}
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
                    • {report.rejectedBy} • {formatApprovalTimestamp(report.rejectedAt, DEFAULT_ORGANIZATION_TIMEZONE)}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="qc-footer-right">
            {/* COMPLIANCE: Only show approve/reject buttons to Admin/Supervisor, not to Guards */}
            {report.status === 'pending' && userCanApprove && onApprove && onReject && (
              <>
                <button className="qc-btn-reject" onClick={handleRejectClick}>
                  Request Changes
                </button>
                <button className="qc-btn-approve" onClick={handleApproveClick}>
                  <Check size={18} />
                  Approve & Send
                  {isSelfApproval && (
                    <span style={{ 
                      marginLeft: '6px', 
                      fontSize: '11px', 
                      opacity: 0.8,
                      fontWeight: 400 
                    }}>
                      (Self)
                    </span>
                  )}
                </button>
              </>
            )}
            {/* Show message for Guards viewing pending reports */}
            {report.status === 'pending' && !userCanApprove && (
              <div style={{
                color: '#94A3B8',
                fontSize: '13px',
                fontStyle: 'italic',
                padding: '8px 12px'
              }}>
                Awaiting supervisor approval...
              </div>
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