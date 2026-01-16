/**
 * CANONICAL INCIDENT REPORT SCHEMA
 * =================================
 * Single source of truth for Incident Report data structure.
 * Used across: Report Creation, Supervisor Review, PDF Generation, API
 * 
 * PRODUCT POSITIONING:
 * - Guard Up is the SOFTWARE PLATFORM (not the security company)
 * - The client's organization is the security company
 * - Organization name appears in report headers, not "Guard Up"
 */

export interface IncidentReport {
  // ============================================================================
  // CORE IDENTIFICATION
  // ============================================================================
  id: number;
  caseId: string;                    // Case ID (e.g., "IR-2026-000001")
  reportCode: string;                // Same as caseId for consistency
  
  // ============================================================================
  // ORGANIZATION & LOCATION
  // ============================================================================
  org_id: string;                    // Organization ID for multi-tenant
  organizationName?: string;         // Client's organization name (e.g., "Acme Security Services")
  site: string;                      // Site name where incident occurred
  specificLocation: string;          // Specific location within site (e.g., "Loading Dock B")
  
  // ============================================================================
  // PERSONNEL
  // ============================================================================
  guardName: string;                 // Guard who filed the report
  created_by_user_id?: number;       // User ID of creator
  created_by_name?: string;          // Name of creator (for audit trail)
  
  // ============================================================================
  // TEMPORAL DATA
  // ============================================================================
  dateTime: string;                  // ISO 8601 timestamp of incident occurrence
  filedOn?: string;                  // ISO 8601 timestamp when report was filed
  created_at?: string;               // Database creation timestamp
  
  // ============================================================================
  // INCIDENT CLASSIFICATION
  // ============================================================================
  incidentType: string;              // Type of incident (e.g., "Trespassing", "Fire Alarm")
  urgency: 'low' | 'normal' | 'high' | 'critical';  // Urgency level
  
  // ============================================================================
  // INCIDENT DETAILS
  // ============================================================================
  narrative: string;                 // Detailed description of what happened
  actionsTaken: string;              // Actions taken by guard (REQUIRED for Incident Reports)
  
  // ============================================================================
  // LAW ENFORCEMENT
  // ============================================================================
  policeCalled: boolean;             // Whether police were called
  pdCaseNumber?: string;             // Police Department case number (only if policeCalled = true)
  
  // ============================================================================
  // EVIDENCE
  // ============================================================================
  attachments: Array<{
    id: number;
    url: string;
    name: string;
    size?: string;
    uploadedAt?: string;
  }>;
  
  // ============================================================================
  // WORKFLOW & STATUS
  // ============================================================================
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'sent';
  
  // ============================================================================
  // SUPERVISOR REVIEW
  // ============================================================================
  reviewedBy?: string;               // Name of reviewer/approver
  reviewedByUserId?: number;         // User ID of reviewer
  reviewedByRole?: string;           // Role of reviewer (e.g., "Supervisor")
  reviewedAt?: string;               // ISO 8601 timestamp of review
  approvedBy?: string;               // Legacy field (same as reviewedBy)
  approvedAt?: string;               // Legacy field (same as reviewedAt)
  approvedByRole?: string;           // Legacy field (same as reviewedByRole)
  rejectedBy?: string;               // Name of rejector
  rejectedByRole?: string;           // Role of rejector
  rejectedAt?: string;               // ISO 8601 timestamp of rejection
  rejectionNote?: string;            // Reason for rejection
  
  // ============================================================================
  // METADATA
  // ============================================================================
  reportType: 'incident';            // Type discriminator for unions
  type?: 'Incident';                 // Legacy display name
  priority?: 'normal' | 'high';      // Legacy priority field
}

/**
 * Type guard to check if a report is an IncidentReport
 */
export function isIncidentReport(report: any): report is IncidentReport {
  return report && report.reportType === 'incident';
}

/**
 * Default values for new Incident Report
 */
export function createEmptyIncidentReport(overrides?: Partial<IncidentReport>): Partial<IncidentReport> {
  return {
    reportType: 'incident',
    type: 'Incident',
    status: 'draft',
    urgency: 'normal',
    priority: 'normal',
    narrative: '',
    actionsTaken: '',
    policeCalled: false,
    attachments: [],
    ...overrides
  };
}

/**
 * Convert legacy report to canonical schema
 */
export function normalizeIncidentReport(report: any): IncidentReport {
  return {
    // Core identification
    id: report.id,
    caseId: report.caseId || report.reportCode || report.referenceId || '',
    reportCode: report.reportCode || report.caseId || report.referenceId || '',
    
    // Organization & location
    org_id: report.org_id || 'default_org',
    organizationName: report.organizationName || report.organization_name || report.companyName,
    site: report.site || report.siteName || '',
    specificLocation: report.specificLocation || report.location || report.locationName || report.postName || '',
    
    // Personnel
    guardName: report.guardName || report.filedBy || report.created_by_name || '',
    created_by_user_id: report.created_by_user_id,
    created_by_name: report.created_by_name || report.guardName || report.filedBy,
    
    // Temporal data
    dateTime: report.dateTime || report.occurredAt || report.timestamp || report.created_at || new Date().toISOString(),
    filedOn: report.filedOn || report.created_at,
    created_at: report.created_at,
    
    // Incident classification
    incidentType: report.incidentType || report.incident_type || 'General',
    urgency: report.urgency || report.priority || 'normal',
    
    // Incident details
    narrative: report.narrative || report.narrativeOnly || report.content || report.description || '',
    actionsTaken: report.actionsTaken || report.actionTaken || report.actions_taken || '',
    
    // Law enforcement
    policeCalled: report.policeCalled === true || report.police_called === true || report.policeCalled === 'Yes' || report.policeCalled === 'yes',
    pdCaseNumber: report.pdCaseNumber || report.pd_case_number || report.pdCaseNum,
    
    // Evidence
    attachments: report.attachments || [],
    
    // Workflow & status
    status: report.status || 'draft',
    
    // Supervisor review
    reviewedBy: report.reviewedBy || report.reviewed_by_name || report.approvedBy,
    reviewedByUserId: report.reviewedByUserId || report.reviewed_by_user_id,
    reviewedByRole: report.reviewedByRole || report.reviewed_by_role || report.approvedByRole,
    reviewedAt: report.reviewedAt || report.reviewed_at || report.approvedAt,
    approvedBy: report.approvedBy || report.reviewed_by_name,
    approvedAt: report.approvedAt || report.reviewed_at,
    approvedByRole: report.approvedByRole || report.reviewed_by_role,
    rejectedBy: report.rejectedBy || report.rejected_by_name,
    rejectedByRole: report.rejectedByRole || report.rejected_by_role,
    rejectedAt: report.rejectedAt || report.rejected_at,
    rejectionNote: report.rejectionNote || report.rejection_note,
    
    // Metadata
    reportType: 'incident',
    type: 'Incident',
    priority: report.priority || report.urgency || 'normal'
  };
}
