// ============================================================================
// CANONICAL REPORT IDENTITY SYSTEM
// ============================================================================
// This module provides the single source of truth for report code generation
// and identity management. All report codes are immutable and set at creation.
//
// CRITICAL: Report codes must NEVER be recomputed at render time.
// Always use the reportCode field stored on the report record.

export type ReportType = 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift_pass_on' | 'other';

// Prefix mapping for report codes
const REPORT_PREFIX_MAP: Record<ReportType, string> = {
  incident: 'IR',
  dar: 'DAR',
  maintenance: 'MNT',
  disciplinary: 'DIS',
  shift_pass_on: 'SPO',
  other: 'OTH'
};

// Title mapping for report types
export const REPORT_TITLE_MAP: Record<ReportType, string> = {
  incident: 'Incident Report',
  dar: 'Daily Activity Report',
  maintenance: 'Maintenance Report',
  disciplinary: 'Disciplinary Report',
  shift_pass_on: 'Shift Pass-On Log',
  other: 'General Report'
};

// ============================================================================
// REPORT CODE GENERATION (Write Path)
// ============================================================================

/**
 * Generates a canonical report code for a new report.
 * This code is IMMUTABLE and stored on the report record.
 * 
 * @param reportType - The normalized report type
 * @param sequence - The next sequence number for this report type
 * @returns A report code like "DIS-2026-1" or "DAR-2026-5"
 */
export function generateReportCode(reportType: ReportType, sequence: number): string {
  const prefix = REPORT_PREFIX_MAP[reportType];
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${sequence}`;
}

/**
 * Generates a formatted display code with # prefix
 * @param reportType - The normalized report type
 * @param sequence - The next sequence number for this report type
 * @returns A formatted code like "#DIS-2026-1"
 */
export function generateFormattedReportCode(reportType: ReportType, sequence: number): string {
  return `#${generateReportCode(reportType, sequence)}`;
}

// ============================================================================
// REPORT CODE EXTRACTION (Read Path)
// ============================================================================

/**
 * Extracts the report code from various possible field names.
 * Handles legacy data that might have codes in different fields.
 * 
 * @param report - Any report object with possible code fields
 * @returns The extracted report code (without # prefix)
 */
export function extractReportCode(report: any): string | null {
  // Priority order: reportCode > caseId > referenceId
  if (report.reportCode) {
    return report.reportCode.replace(/^#/, '');
  }
  
  if (report.caseId) {
    return report.caseId.replace(/^#/, '');
  }
  
  if (report.referenceId) {
    return report.referenceId.replace(/^#/, '');
  }
  
  return null;
}

/**
 * Gets the formatted display code with # prefix
 */
export function getFormattedReportCode(report: any): string {
  const code = extractReportCode(report);
  return code ? `#${code}` : '#UNKNOWN';
}

// ============================================================================
// REPORT TYPE DETECTION (Data Normalization)
// ============================================================================

/**
 * Detects the report type from a code string.
 * Used for normalizing legacy data.
 * 
 * @param code - A report code like "#DIS-2026-1" or "DAR-2026-2"
 * @returns The detected report type
 */
export function detectReportTypeFromCode(code: string): ReportType {
  const cleanCode = code.replace(/^#/, '').toUpperCase();
  
  if (cleanCode.startsWith('DIS-')) return 'disciplinary';
  if (cleanCode.startsWith('DAR-')) return 'dar';
  if (cleanCode.startsWith('IR-')) return 'incident';
  if (cleanCode.startsWith('MNT-')) return 'maintenance';
  if (cleanCode.startsWith('SPO-')) return 'shift_pass_on';
  
  return 'other';
}

/**
 * Normalizes legacy report type strings to canonical ReportType
 */
export function normalizeReportType(legacyType: string): ReportType {
  const normalized = legacyType.toLowerCase();
  
  if (normalized === 'disciplinary') return 'disciplinary';
  if (normalized === 'dar') return 'dar';
  if (normalized === 'incident') return 'incident';
  if (normalized === 'maintenance') return 'maintenance';
  if (normalized.includes('shift') && normalized.includes('pass')) return 'shift_pass_on';
  if (normalized === 'shift pass-on') return 'shift_pass_on';
  if (normalized === 'shift pass on') return 'shift_pass_on';
  
  return 'other';
}

// ============================================================================
// REPORT VISIBILITY (Client Deliverable Logic)
// ============================================================================

/**
 * Determines if a report type should be client-deliverable
 * Only incident, DAR, and maintenance reports go to Client Outbox
 * Disciplinary reports always go to Internal Vault
 */
export function isClientDeliverableReportType(reportType: ReportType): boolean {
  return ['incident', 'dar', 'maintenance'].includes(reportType);
}

/**
 * Gets the visibility classification for a report
 */
export function getReportVisibility(reportType: ReportType): 'client_deliverable' | 'internal_only' {
  return isClientDeliverableReportType(reportType) ? 'client_deliverable' : 'internal_only';
}

// ============================================================================
// REPORT TITLE GENERATION
// ============================================================================

/**
 * Gets the full report title for display in modals and headers
 * @param report - The report object
 * @returns Formatted title like "Disciplinary Report #DIS-2026-1"
 */
export function getReportTitle(report: any): string {
  const reportType = report.reportType || detectReportTypeFromCode(extractReportCode(report) || '');
  const title = REPORT_TITLE_MAP[reportType] || 'Report';
  const code = getFormattedReportCode(report);
  
  return `${title} ${code}`;
}

/**
 * Gets just the type title without the code
 */
export function getReportTypeTitle(reportType: ReportType): string {
  return REPORT_TITLE_MAP[reportType] || 'Report';
}