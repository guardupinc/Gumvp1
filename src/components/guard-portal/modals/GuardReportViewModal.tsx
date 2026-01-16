import React from 'react';
import { X, User, MapPin, Calendar, Check, XCircle, Download } from 'lucide-react';
import { AttachmentGrid } from '../../ui/AttachmentGrid';
import { formatTimestamp } from '../../../utils/timezone';
import '../../../report-details-modal.css';

// Report type enum for business logic
type ReportType = 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift_pass_on' | 'other';

// Helper function to determine if a report is client-deliverable
function isClientDeliverable(reportType?: ReportType): boolean {
  if (!reportType) return false;
  return ['incident', 'dar', 'maintenance'].includes(reportType);
}

interface GuardReportViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadPDF?: () => void;
  report: {
    id: number;
    referenceId: string;
    reportCode: string;  // CANONICAL: Immutable report identity
    caseId?: string;
    type: 'DAR' | 'Incident' | 'Maintenance' | 'Disciplinary' | 'Shift Pass-On';
    reportType?: ReportType;  // Normalized field for business logic
    guardName: string;
    site: string;
    timestamp?: string;
    filedOn?: string;
    content: string;
    status: 'pending' | 'approved' | 'rejected' | 'draft';
    rejectionNote?: string;
    // IMMUTABLE AUTHORSHIP FIELDS
    author_user_id?: number;
    author_name?: string;
    created_at?: string;
    decision_note?: string;
    approvedBy?: string;
    approvedByRole?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedByRole?: string;
    rejectedAt?: string;
    reviewed_by_name?: string;
    reviewed_by_role?: string;
    reviewed_at?: string;
    location?: string;
    attachments?: Array<{ id: number; url: string; name: string }>;
    date?: string;
    incidentDate?: string;
    time?: string;
    incidentType?: string;
    urgency?: string;
    policeCalled?: string;
    narrativeOnly?: string;
    actionTaken?: string;
    pdCaseNumber?: string;
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
    maintenanceDate?: string;
    maintenanceTime?: string;
    // Disciplinary-specific fields
    employeeName?: string;
    violationType?: string;
    disciplineLevel?: string;
    correctiveAction?: string;
    disciplinaryDate?: string;
    disciplinaryTime?: string;
    witnessName?: string;
    immediateAction?: string;
    companyPolicyRef?: string;
    employeeStatement?: string;
    supervisorRecommendation?: string;
    // Shift Pass-On specific fields
    shift?: string;  // Day / Swing / Overnight
    oncomingGuard?: string;
    shiftPassOnNotes?: string;
  } | null;
}

export function GuardReportViewModal({ 
  isOpen, 
  onClose, 
  onDownloadPDF,
  report 
}: GuardReportViewModalProps) {
  if (!isOpen || !report) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
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
       report.type === 'Disciplinary' ? 'disciplinary' :
       report.type === 'Shift Pass-On' ? 'shift_pass_on' : 'other');
    
    return typeMap[normalizedType];
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Needs Revision';
      case 'draft':
        return 'Draft';
      default:
        return status.toUpperCase();
    }
  };
  
  // Determine if report is internal-only
  const isInternalOnly = report.reportType === 'disciplinary' || report.reportType === 'shift_pass_on' || !isClientDeliverable(report.reportType);

  // Get the display timestamp
  const displayTimestamp = report.filedOn 
    ? formatTimestamp(report.filedOn) 
    : report.timestamp || 'N/A';

  // Get rejection note from either field
  const rejectionReason = report.decision_note || report.rejectionNote;

  // Get reviewer info
  const reviewerName = report.reviewed_by_name || report.approvedBy || report.rejectedBy;
  const reviewerRole = report.reviewed_by_role || report.approvedByRole || report.rejectedByRole;
  const reviewedAt = report.reviewed_at || report.approvedAt || report.rejectedAt;

  return (
    <div className="qc-modal-overlay" onClick={handleOverlayClick}>
      {/* Modal Content - Read-Only View for Guards */}
      <div className="qc-modal">
        {/* Close Button - Top Right */}
        <button className="qc-close-btn" onClick={onClose} title="Close">
          <X size={24} />
        </button>

        {/* Header: Trust & Metadata */}
        <div className="qc-header">
          <div className="qc-header-top">
            <h2 className="qc-title">{getReportTypeLabel()} {report.caseId || `#${report.reportCode}`}</h2>
            {onDownloadPDF && (
              <button 
                className="qc-download-btn"
                onClick={onDownloadPDF}
                title="Download PDF"
                style={{
                  background: 'rgba(59, 209, 111, 0.1)',
                  border: '1px solid rgba(59, 209, 111, 0.3)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  color: '#3BD16F',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 209, 111, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(59, 209, 111, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 209, 111, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(59, 209, 111, 0.3)';
                }}
              >
                <Download size={16} />
                Download PDF
              </button>
            )}
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
              <span>{displayTimestamp}</span>
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
                                 report.status === 'draft' ? 'rgba(148, 163, 184, 0.15)' :
                                 'rgba(255, 122, 24, 0.15)',
                color: report.status === 'approved' ? '#3BD16F' :
                       report.status === 'rejected' ? '#EF4444' :
                       report.status === 'draft' ? '#94A3B8' :
                       '#FF7A18'
              }}>
                {getStatusLabel(report.status)}
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

          {/* Rejection Banner for Needs Revision */}
          {report.status === 'rejected' && rejectionReason && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderLeft: '4px solid #EF4444',
              padding: '12px 16px',
              marginTop: '16px',
              borderRadius: '8px'
            }}>
              <div style={{
                color: '#EF4444',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                ⚠️ Needs Revision
              </div>
              <div style={{
                color: '#FCA5A5',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '1.5'
              }}>
                <strong>Reason:</strong> {rejectionReason}
              </div>
              {reviewerName && reviewedAt && (
                <div style={{
                  color: '#FCA5A5',
                  fontSize: '12px',
                  marginTop: '8px',
                  opacity: 0.8
                }}>
                  Reviewed by {reviewerName} {reviewerRole && `(${reviewerRole})`} • {formatTimestamp(reviewedAt)}
                </div>
              )}
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
              
              {/* Incident Report Data */}
              {report.type === 'Incident' && (
                <div className="qc-data-grid">
                  <div className="qc-data-item">
                    <div className="qc-data-label">Reporting Officer</div>
                    <div className="qc-data-value">{report.guardName}</div>
                  </div>
                  <div className="qc-data-item">
                    <div className="qc-data-label">Incident Case ID</div>
                    <div className="qc-data-value" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{report.reportCode}</div>
                  </div>
                  {(report.incidentDate || report.date) && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Date of Incident</div>
                      <div className="qc-data-value">{report.incidentDate || report.date}</div>
                    </div>
                  )}
                  {report.time && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Time of Incident</div>
                      <div className="qc-data-value">{report.time}</div>
                    </div>
                  )}
                  {report.site && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Site / Location</div>
                      <div className="qc-data-value">{report.site}</div>
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
                      <div className="qc-data-value" style={{ color: report.urgency === 'High' ? '#EF4444' : '#9CA3AF' }}>{report.urgency}</div>
                    </div>
                  )}
                  {report.policeCalled && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Police Called</div>
                      <div className="qc-data-value">{report.policeCalled}</div>
                    </div>
                  )}
                  {report.pdCaseNumber && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">PD Case Number</div>
                      <div className="qc-data-value" style={{ fontFamily: 'monospace' }}>{report.pdCaseNumber}</div>
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

              {/* DAR Data */}
              {report.type === 'DAR' && (
                <div className="qc-data-grid">
                  <div className="qc-data-item">
                    <div className="qc-data-label">Reporting Officer</div>
                    <div className="qc-data-value">{report.guardName}</div>
                  </div>
                  <div className="qc-data-item">
                    <div className="qc-data-label">DAR Case ID</div>
                    <div className="qc-data-value" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{report.reportCode}</div>
                  </div>
                  {report.site && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Site / Location</div>
                      <div className="qc-data-value">{report.site}</div>
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
                      <div className="qc-data-value">{report.equipmentStatus}</div>
                    </div>
                  )}
                  {(report.incidentDate || report.date) && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Report Date</div>
                      <div className="qc-data-value">{report.incidentDate || report.date}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Disciplinary Report Data */}
              {report.type === 'Disciplinary' && (
                <div className="qc-data-grid">
                  <div className="qc-data-item">
                    <div className="qc-data-label">Reporting Officer</div>
                    <div className="qc-data-value">{report.guardName}</div>
                  </div>
                  <div className="qc-data-item">
                    <div className="qc-data-label">Disciplinary Case ID</div>
                    <div className="qc-data-value" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{report.reportCode}</div>
                  </div>
                  {(report.disciplinaryDate || report.date) && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Date of Incident</div>
                      <div className="qc-data-value">{report.disciplinaryDate || report.date}</div>
                    </div>
                  )}
                  {(report.disciplinaryTime || report.time) && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Time</div>
                      <div className="qc-data-value">{report.disciplinaryTime || report.time}</div>
                    </div>
                  )}
                  {report.site && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Site / Location</div>
                      <div className="qc-data-value">{report.site}</div>
                    </div>
                  )}
                  {report.employeeName && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Employee Name</div>
                      <div className="qc-data-value">{report.employeeName}</div>
                    </div>
                  )}
                  {report.violationType && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Violation Type</div>
                      <div className="qc-data-value">{report.violationType}</div>
                    </div>
                  )}
                  {report.disciplineLevel && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Discipline Level</div>
                      <div className="qc-data-value">{report.disciplineLevel}</div>
                    </div>
                  )}
                  {report.witnessName && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Witness</div>
                      <div className="qc-data-value">{report.witnessName}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Maintenance Report Data */}
              {report.type === 'Maintenance' && (
                <div className="qc-data-grid">
                  <div className="qc-data-item">
                    <div className="qc-data-label">Reporting Officer</div>
                    <div className="qc-data-value">{report.guardName}</div>
                  </div>
                  <div className="qc-data-item">
                    <div className="qc-data-label">Maintenance ID</div>
                    <div className="qc-data-value" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{report.reportCode}</div>
                  </div>
                  {report.site && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Site / Location</div>
                      <div className="qc-data-value">{report.site}</div>
                    </div>
                  )}
                  {(report.maintenanceDate || report.date) && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Date Detected</div>
                      <div className="qc-data-value">{report.maintenanceDate || report.date}</div>
                    </div>
                  )}
                  {(report.maintenanceTime || report.time) && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Time Detected</div>
                      <div className="qc-data-value">{report.maintenanceTime || report.time}</div>
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
              {report.type === 'Shift Pass-On' && (
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
                  {report.oncomingGuard && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Oncoming Guard</div>
                      <div className="qc-data-value">{report.oncomingGuard}</div>
                    </div>
                  )}
                  {displayTimestamp && (
                    <div className="qc-data-item">
                      <div className="qc-data-label">Created</div>
                      <div className="qc-data-value">{displayTimestamp}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Narrative Section */}
            <div className="qc-section">
              <div className="qc-section-header">
                <h3 className="qc-section-label">
                  {report.reportType === 'shift_pass_on' || report.type === 'Shift Pass-On' ? 'HANDOVER NOTES' : 
                   report.type === 'Disciplinary' ? 'NARRATIVE OF EVENTS' : 'OFFICER NARRATIVE'}
                </h3>
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

            {/* Action Taken Section - Only for Incident Reports */}
            {report.type === 'Incident' && report.actionTaken && (
              <div className="qc-section">
                <h3 className="qc-section-label">ACTION TAKEN</h3>
                <div className="qc-action-taken-box">
                  <p>{report.actionTaken}</p>
                </div>
              </div>
            )}

            {/* Shift Pass-On Notes Section */}
            {(report.reportType === 'shift_pass_on' || report.type === 'Shift Pass-On') && report.shiftPassOnNotes && (
              <div className="qc-section">
                <h3 className="qc-section-label">SHIFT PASS-ON NOTES</h3>
                <div className="qc-action-taken-box">
                  <p>{report.shiftPassOnNotes}</p>
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
                  No attachments uploaded
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
                      by {report.guardName} • {displayTimestamp}
                    </div>
                  </div>
                </div>
                
                {/* Approved */}
                {report.status === 'approved' && reviewerName && reviewedAt && (
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
                        by {reviewerName} {reviewerRole && `(${reviewerRole})`} • {formatTimestamp(reviewedAt)}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Rejected */}
                {report.status === 'rejected' && reviewerName && reviewedAt && (
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
                        Needs Revision
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: '12px', marginTop: '2px' }}>
                        by {reviewerName} {reviewerRole && `(${reviewerRole})`} • {formatTimestamp(reviewedAt)}
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

        {/* Footer: Status Bar (Read-Only) */}
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
                {reviewerName && reviewedAt && (
                  <span style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 400, marginLeft: '8px' }}>
                    • {reviewerName} {reviewerRole && `(${reviewerRole})`} • {formatTimestamp(reviewedAt)}
                  </span>
                )}
              </div>
            )}
            {report.status === 'rejected' && (
              <div className="qc-status-indicator rejected">
                <XCircle size={16} />
                <span>Needs Revision</span>
                {reviewerName && reviewedAt && (
                  <span style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 400, marginLeft: '8px' }}>
                    • {reviewerName} {reviewerRole && `(${reviewerRole})`} • {formatTimestamp(reviewedAt)}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="qc-footer-right">
            {/* No action buttons for guards - read-only view */}
          </div>
        </div>
      </div>
    </div>
  );
}
