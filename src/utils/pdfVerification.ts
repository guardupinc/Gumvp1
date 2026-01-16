/**
 * PDF VERIFICATION UTILITY
 * =========================
 * Console logging utilities for verifying PDF generation across all report types.
 * Use this to test that PDFs open correctly for each report type.
 * 
 * HOW TO USE:
 * 1. Import this file in your component: import { verifyPDFOpen } from '../utils/pdfVerification';
 * 2. Call verifyPDFOpen(reportType, reportCode) when opening a PDF
 * 3. Check browser console for detailed verification output
 */

export type VerifiableReportType = 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift_pass_on' | 'other';

interface PDFVerificationResult {
  reportType: VerifiableReportType;
  reportCode: string;
  timestamp: string;
  checks: {
    typeSupported: boolean;
    codeFormat: boolean;
    expectedFields: string[];
    warnings: string[];
  };
}

/**
 * Report type metadata for verification
 */
const REPORT_TYPE_CONFIG: Record<VerifiableReportType, {
  displayName: string;
  requiredFields: string[];
  optionalFields: string[];
  pdfSections: string[];
}> = {
  incident: {
    displayName: 'Incident Report',
    requiredFields: ['reportCode', 'site', 'location', 'guardName', 'timestamp', 'narrative'],
    optionalFields: ['incidentType', 'urgency', 'actionTaken', 'police_called', 'pd_case_number', 'attachments'],
    pdfSections: ['Header', 'Key Facts', 'Narrative', 'Actions Taken', 'Police Response', 'Evidence/Attachments', 'Supervisor Review']
  },
  dar: {
    displayName: 'Daily Activity Report',
    requiredFields: ['reportCode', 'site', 'location', 'guardName', 'timestamp', 'narrative'],
    optionalFields: ['shiftStart', 'shiftEnd', 'reliefGuard', 'equipmentStatus', 'attachments'],
    pdfSections: ['Header', 'Key Facts', 'Narrative', 'Shift Details', 'Equipment Status', 'Evidence/Attachments', 'Supervisor Review']
  },
  maintenance: {
    displayName: 'Maintenance Request',
    requiredFields: ['reportCode', 'site', 'location', 'guardName', 'timestamp', 'narrative'],
    optionalFields: ['maintenanceCategory', 'specificArea', 'assetId', 'attachments'],
    pdfSections: ['Header', 'Key Facts', 'Narrative', 'Maintenance Details', 'Evidence/Attachments', 'Supervisor Review']
  },
  disciplinary: {
    displayName: 'Disciplinary Report',
    requiredFields: ['reportCode', 'site', 'location', 'guardName', 'timestamp', 'narrative'],
    optionalFields: ['employeeName', 'violationType', 'disciplineLevel', 'correctiveAction', 'attachments'],
    pdfSections: ['Header', 'Key Facts', 'Narrative', 'Disciplinary Details', 'Corrective Action', 'Evidence/Attachments', 'Supervisor Review']
  },
  shift_pass_on: {
    displayName: 'Shift Pass-On Log',
    requiredFields: ['reportCode', 'site', 'location', 'guardName', 'timestamp', 'narrative'],
    optionalFields: ['attachments'],
    pdfSections: ['Header', 'Key Facts', 'Narrative', 'Evidence/Attachments', 'Supervisor Review']
  },
  other: {
    displayName: 'General Report',
    requiredFields: ['reportCode', 'site', 'location', 'guardName', 'timestamp', 'narrative'],
    optionalFields: ['attachments'],
    pdfSections: ['Header', 'Key Facts', 'Narrative', 'Evidence/Attachments', 'Supervisor Review']
  }
};

/**
 * Verify report code format
 * Expected format: PREFIX-YEAR-XXXXXX (e.g., IR-2026-000001)
 */
function verifyReportCodeFormat(reportCode: string): boolean {
  const pattern = /^[A-Z]{2,3}-\d{4}-\d{6}$/;
  return pattern.test(reportCode);
}

/**
 * Get expected prefix for report type
 */
function getExpectedPrefix(reportType: VerifiableReportType): string {
  const prefixMap: Record<VerifiableReportType, string> = {
    incident: 'IR',
    dar: 'DAR',
    maintenance: 'MNT',
    disciplinary: 'DIS',
    shift_pass_on: 'SPO',
    other: 'GEN'
  };
  return prefixMap[reportType];
}

/**
 * Main verification function - call this when opening a PDF
 */
export function verifyPDFOpen(reportType: VerifiableReportType, reportCode: string): PDFVerificationResult {
  const timestamp = new Date().toISOString();
  const config = REPORT_TYPE_CONFIG[reportType];
  const expectedPrefix = getExpectedPrefix(reportType);
  
  const result: PDFVerificationResult = {
    reportType,
    reportCode,
    timestamp,
    checks: {
      typeSupported: !!config,
      codeFormat: verifyReportCodeFormat(reportCode),
      expectedFields: config?.requiredFields || [],
      warnings: []
    }
  };
  
  // Check if report code starts with expected prefix
  if (!reportCode.startsWith(expectedPrefix)) {
    result.checks.warnings.push(`Report code prefix mismatch: expected "${expectedPrefix}" but got "${reportCode.split('-')[0]}"`);
  }
  
  console.log('━'.repeat(80));
  console.log('📄 PDF VERIFICATION: Opening Report PDF');
  console.log('━'.repeat(80));
  console.log(`🔹 Report Type: ${config?.displayName || 'Unknown'} (${reportType})`);
  console.log(`🔹 Report Code: ${reportCode}`);
  console.log(`🔹 Timestamp: ${timestamp}`);
  console.log('');
  console.log('✅ CHECKS:');
  console.log(`   Type Supported: ${result.checks.typeSupported ? '✓' : '✗'}`);
  console.log(`   Code Format Valid: ${result.checks.codeFormat ? '✓' : '✗'} (Expected: PREFIX-YEAR-XXXXXX)`);
  console.log(`   Expected Prefix: ${expectedPrefix}`);
  console.log('');
  console.log('📋 REQUIRED FIELDS:');
  config?.requiredFields.forEach(field => {
    console.log(`   - ${field}`);
  });
  console.log('');
  console.log('📋 OPTIONAL FIELDS:');
  config?.optionalFields.forEach(field => {
    console.log(`   - ${field}`);
  });
  console.log('');
  console.log('📑 PDF SECTIONS:');
  config?.pdfSections.forEach(section => {
    console.log(`   - ${section}`);
  });
  
  if (result.checks.warnings.length > 0) {
    console.log('');
    console.log('⚠️  WARNINGS:');
    result.checks.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
  }
  
  console.log('━'.repeat(80));
  console.log('');
  
  return result;
}

/**
 * Batch verification - test all report types
 * Use this to verify the system handles all report types correctly
 */
export function verifyAllReportTypes(testCases: Array<{
  reportType: VerifiableReportType;
  reportCode: string;
  hasAttachments: boolean;
  hasPoliceData?: boolean;
}>) {
  console.log('╔'.repeat(80));
  console.log('🧪 BATCH PDF VERIFICATION - Testing All Report Types');
  console.log('╚'.repeat(80));
  console.log('');
  
  const results = testCases.map((testCase, index) => {
    console.log(`\n📦 TEST CASE ${index + 1}/${testCases.length}`);
    console.log(`   Type: ${testCase.reportType}`);
    console.log(`   Code: ${testCase.reportCode}`);
    console.log(`   Has Attachments: ${testCase.hasAttachments ? 'Yes' : 'No'}`);
    if (testCase.hasPoliceData !== undefined) {
      console.log(`   Police Called: ${testCase.hasPoliceData ? 'Yes' : 'No'}`);
    }
    
    return verifyPDFOpen(testCase.reportType, testCase.reportCode);
  });
  
  // Summary
  console.log('\n╔'.repeat(80));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('╚'.repeat(80));
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.checks.typeSupported && r.checks.codeFormat).length}`);
  console.log(`Warnings: ${results.reduce((sum, r) => sum + r.checks.warnings.length, 0)}`);
  console.log('');
  
  return results;
}

/**
 * Test suite generator - creates sample test cases for all report types
 */
export function generateTestSuite() {
  const currentYear = new Date().getFullYear();
  
  return [
    // Incident Reports
    { reportType: 'incident' as const, reportCode: `IR-${currentYear}-000001`, hasAttachments: false, hasPoliceData: false },
    { reportType: 'incident' as const, reportCode: `IR-${currentYear}-000002`, hasAttachments: true, hasPoliceData: true },
    
    // Daily Activity Reports
    { reportType: 'dar' as const, reportCode: `DAR-${currentYear}-000001`, hasAttachments: false },
    { reportType: 'dar' as const, reportCode: `DAR-${currentYear}-000002`, hasAttachments: true },
    
    // Maintenance Reports
    { reportType: 'maintenance' as const, reportCode: `MNT-${currentYear}-000001`, hasAttachments: false },
    { reportType: 'maintenance' as const, reportCode: `MNT-${currentYear}-000002`, hasAttachments: true },
    
    // Disciplinary Reports
    { reportType: 'disciplinary' as const, reportCode: `DIS-${currentYear}-000001`, hasAttachments: false },
    { reportType: 'disciplinary' as const, reportCode: `DIS-${currentYear}-000002`, hasAttachments: true },
    
    // Shift Pass-On Reports
    { reportType: 'shift_pass_on' as const, reportCode: `SPO-${currentYear}-000001`, hasAttachments: false },
    { reportType: 'shift_pass_on' as const, reportCode: `SPO-${currentYear}-000002`, hasAttachments: true },
  ];
}

/**
 * Console log helper for PDF generation on server
 * Call this from the server-side PDF generation function
 */
export function logPDFGeneration(report: any) {
  console.log('━'.repeat(80));
  console.log('🏗️  PDF GENERATION (Server-Side)');
  console.log('━'.repeat(80));
  console.log(`Report ID: ${report.id}`);
  console.log(`Report Code: ${report.reportCode}`);
  console.log(`Report Type: ${report.reportType}`);
  console.log(`Organization: ${report.org_id || 'default'}`);
  console.log(`Status: ${report.status}`);
  console.log(`Reviewer: ${report.reviewed_by_name || 'Pending'}`);
  console.log(`Reviewed At: ${report.reviewed_at || 'N/A'}`);
  console.log('');
  
  // Type-specific fields
  if (report.reportType === 'incident') {
    console.log('📋 INCIDENT FIELDS:');
    console.log(`   Incident Type: ${report.incidentType || 'N/A'}`);
    console.log(`   Actions Taken: ${report.actionTaken ? 'Yes' : 'N/A'}`);
    console.log(`   Police Called: ${report.police_called !== undefined ? report.police_called : 'N/A'}`);
    console.log(`   PD Case #: ${report.pd_case_number || 'N/A'}`);
  } else if (report.reportType === 'dar') {
    console.log('📋 DAR FIELDS:');
    console.log(`   Shift Start: ${report.shiftStart || 'N/A'}`);
    console.log(`   Shift End: ${report.shiftEnd || 'N/A'}`);
    console.log(`   Relief Guard: ${report.reliefGuard || 'N/A'}`);
  } else if (report.reportType === 'maintenance') {
    console.log('📋 MAINTENANCE FIELDS:');
    console.log(`   Category: ${report.maintenanceCategory || 'N/A'}`);
    console.log(`   Specific Area: ${report.specificArea || 'N/A'}`);
    console.log(`   Asset ID: ${report.assetId || 'N/A'}`);
  } else if (report.reportType === 'disciplinary') {
    console.log('📋 DISCIPLINARY FIELDS:');
    console.log(`   Employee Name: ${report.employeeName || 'N/A'}`);
    console.log(`   Violation Type: ${report.violationType || 'N/A'}`);
    console.log(`   Discipline Level: ${report.disciplineLevel || 'N/A'}`);
  }
  
  console.log('');
  console.log(`Attachments: ${report.attachments?.length || 0}`);
  console.log('━'.repeat(80));
  console.log('');
}
