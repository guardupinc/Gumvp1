import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FileText, CheckCircle, X, Send, Calendar, Filter, Eye, Check, Plus, AlertTriangle, Download } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Dropdown_Dark } from '../ui/Dropdown_Dark';
import { DatePickerModal } from '../ui/DatePickerModal';
import { ReportCard } from '../ui/ReportCard';
import { EditReportModal, ReportUpdates } from '../ui/EditReportModal';
import { ReportDetailsModal } from '../ui/ReportDetailsModal';

import { SelectReportTypeModal } from '../ui/SelectReportTypeModal';
import { CreateReportModal } from '../ui/CreateReportModal';
import { EnhancedReportModal } from '../ui/EnhancedReportModal';
import { ReportsQueueTable } from '../ui/ReportsQueueTable';
import { BatchRejectModal } from '../ui/BatchRejectModal';
import { RejectReportModal } from '../modals/RejectReportModal';
import { RequestChangesModal } from '../modals/RequestChangesModal';
import { ExtendedFilters, ExtendedFiltersState } from '../ui/ExtendedFilters';
import { ReportSummarySidebar } from '../reports/ReportSummarySidebar';
import { calculatePendingCounts } from '../reports/reportSummary';
import { useAppState, canApproveReports, canEditReport } from '../../contexts/AppStateContext';
import { toast } from 'sonner';
import { formatTimestamp as formatTimestampTz, getDisplayTimezone } from '../../utils/timezone';
import { reportsAPI } from '../../utils/apiClient';
import '../../reports.css';
import '../../modals.css';

// ============================================================================
// DATE FORMATTING UTILITIES - Convert UTC timestamps to local timezone
// ============================================================================

/**
 * Formats a UTC timestamp (from database) to local timezone
 * @param dateString - ISO timestamp from database (e.g., "2026-01-09T04:44:44.442Z" in UTC)
 * @returns Formatted string in local timezone like "Jan 8, 2026 · 11:44 PM" (America/New_York)
 */
const formatTimestamp = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  
  // If it's already in the desired format (contains "·" or "•"), return as-is
  if (dateString.includes('·') || dateString.includes('•')) {
    return dateString;
  }
  
  // Check if it's an ISO timestamp (contains 'T' or 'Z')
  if (dateString.includes('T') || dateString.includes('Z')) {
    // Use timezone utility to format in local timezone
    const displayTz = getDisplayTimezone();
    const date = new Date(dateString);
    
    // Format: "Jan 8, 2026 · 11:44 PM" in local timezone
    return new Intl.DateTimeFormat('en-US', {
      timeZone: displayTz,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date).replace(',', ' ·');
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

export type ClientType = 'building-a' | 'global-logistics' | 'tech-innovations';

// ============================================================================
// NORMALIZED REPORT TYPE HELPER
// ============================================================================
// Normalized report type enum
export type ReportType = 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift_pass_on' | 'other';

export interface Report {
  id: number;
  referenceId: string;
  reportCode: string;         // CANONICAL: Immutable report code (e.g., "DIS-2026-000001")
  caseId?: string;            // Auto-generated Case ID (e.g., "#IR-2026-000001")
  type: 'DAR' | 'Incident' | 'Maintenance' | 'Disciplinary' | 'Shift Pass-On'; // Legacy field for display
  reportType: ReportType;     // Normalized field for business logic
  priority: 'normal' | 'high';
  guardName: string;
  site: string;
  timestamp: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'sent' | 'draft';
  org_id?: string;            // Organization ID for multi-tenant filtering
  rejectionNote?: string;
  approvedBy?: string;
  approvedByRole?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedByRole?: string;
  rejectedAt?: string;
  location?: string;
  attachments?: Array<{ id: number; url: string; name: string }>;
  date?: string;              // Date of Incident (e.g., "Jan 04, 2026")
  time?: string;
  incidentType?: string;
  urgency?: string;
  policeCalled?: string;
  narrativeOnly?: string;
  actionTaken?: string;
  pdCaseNumber?: string;
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
  // New fields for MVP upgrade
  assignedTo?: string;  // Reviewer assigned to this report
  createdBy?: string;   // User who created this report (for draft ownership)
  revisionOfReportId?: number;  // Reference to original rejected report if this is a revision
}

interface ReportsProps {
  reports: Report[];
  onNavigateToReport?: (clientType: ClientType) => void;
  autoOpenModal?: 'select-report-type' | 'review-queue';
  onModalOpened?: () => void;
}

export function Reports({ reports, onNavigateToReport, autoOpenModal, onModalOpened }: ReportsProps) {
  const { currentUser, approveReport, rejectReport, addReport, updateReportStatus, updateReport, deleteReport, getPreviewId, addVaultDocument, getDraftCounter, setAppState } = useAppState();
  const [selectedReportIds, setSelectedReportIds] = useState<Set<number>>(new Set());
  const [dateRange, setDateRange] = useState<string>('last-7-days');
  const [reportType, setReportType] = useState<string>('all');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<[Date, Date] | null>(null);
  const [customDateLabel, setCustomDateLabel] = useState<string>('Custom Range');
  const [statusTab, setStatusTab] = useState<'pending' | 'approved' | 'rejected' | 'drafts'>('pending');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsReport, setDetailsReport] = useState<Report | null>(null);
  const [isSelectReportTypeModalOpen, setIsSelectReportTypeModalOpen] = useState(false);
  const [isCreateReportModalOpen, setIsCreateReportModalOpen] = useState(false);

  // Auto-open modal if requested from QuickActions or Dashboard
  useEffect(() => {
    if (autoOpenModal === 'select-report-type') {
      setIsSelectReportTypeModalOpen(true);
      if (onModalOpened) {
        onModalOpened();
      }
    } else if (autoOpenModal === 'review-queue') {
      // Set to pending tab
      setStatusTab('pending');
      
      // Get pending reports sorted by timestamp (oldest first)
      const pendingReports = reports
        .filter(r => r.status === 'pending')
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Auto-open first pending report if exists
      if (pendingReports.length > 0) {
        setDetailsReport(pendingReports[0]);
        setIsDetailsModalOpen(true);
      }
      
      if (onModalOpened) {
        onModalOpened();
      }
    }
  }, [autoOpenModal, onModalOpened, reports]);

  const [createReportType, setCreateReportType] = useState<'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon'>('incident');
  const [generatedCaseId, setGeneratedCaseId] = useState<string>(''); // Auto-generated Case ID for current report
  const [isEnhancedReportModalOpen, setIsEnhancedReportModalOpen] = useState(false);
  const [enhancedReportMode, setEnhancedReportMode] = useState<{
    type: 'maintenance' | 'incident' | 'dar' | 'disciplinary' | 'shift-passon';
    title: string;
    reportIdPrefix: string;
    themeColor: string;
    recipientRole: string;
    narrativeLabel: string;
    submitButtonText: string;
    icon: string;
  } | null>(null);
  const [isBatchRejectModalOpen, setIsBatchRejectModalOpen] = useState(false);
  const [batchRejectReason, setBatchRejectReason] = useState<string>('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isRequestChangesModalOpen, setIsRequestChangesModalOpen] = useState(false);
  const [rejectingReportId, setRejectingReportId] = useState<number | null>(null);
  const [extendedFilters, setExtendedFilters] = useState<ExtendedFiltersState>({
    site: 'all',
    reportTypes: [],
    hasAttachments: null,
    filedBy: 'all',
    assigned: 'all'
  });
  const [selectedSummaryType, setSelectedSummaryType] = useState<string | null>(null);

  // ============================================================================
  // HELPER: Sequential ID Generation
  // ============================================================================
  // Generates the next sequential ID for a given report category
  const getNextReportId = (category: string): string => {
    let prefix = 'DAR';
    
    // Determine prefix based on category
    if (category.includes('Disciplinary') || category.includes('disciplinary') || category.includes('action')) {
      prefix = 'DIS';
    } else if (category.includes('Incident') || category.includes('incident')) {
      prefix = 'IR';
    } else if (category.includes('Maintenance') || category.includes('maintenance')) {
      prefix = 'MNT';
    } else if (category.includes('DAR') || category.includes('dar')) {
      prefix = 'DAR';
    } else if (category.includes('shift') || category.includes('passon')) {
      prefix = 'SPO'; // Shift Pass-On prefix
    }

    const year = new Date().getFullYear();
    const prefixPattern = `#${prefix}-${year}-`;
    
    // Find all existing reports with this prefix pattern
    const existingNumbers = reports
      .filter(r => {
        const id = r.caseId || r.referenceId || '';
        return id.startsWith(prefixPattern);
      })
      .map(r => {
        const id = r.caseId || r.referenceId || '';
        const parts = id.split('-');
        const lastPart = parts[parts.length - 1];
        return parseInt(lastPart, 10);
      })
      .filter(num => !isNaN(num));
      
    // Find the maximum number (or default to 0 if none exist)
    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const nextNum = maxNum + 1;
    
    // Use 6-digit format for report numbers
    return `${prefixPattern}${String(nextNum).padStart(6, '0')}`;
  };

  // ============================================================================
  // REACTIVE ID GENERATION
  // ============================================================================
  // Automatically regenerate the report ID whenever createReportType changes
  // This ensures the ID always matches the current report type selection
  useEffect(() => {
    // Only regenerate if we're in the process of creating a report
    if (!isCreateReportModalOpen && !isSelectReportTypeModalOpen) {
      return;
    }

    // Generate the next sequential ID based on the report type
    const newCaseId = getNextReportId(createReportType);
    
    // Update the generatedCaseId state with the new ID
    setGeneratedCaseId(newCaseId);
    
  }, [createReportType, isCreateReportModalOpen, isSelectReportTypeModalOpen, reports]); // Re-run whenever report type changes or reports array changes

  // Helper function to determine if report matches date filter
  const matchesDateFilter = (report: Report, index: number): boolean => {
    // Parse the report's date from timestamp (handles both ISO and formatted timestamps)
    let reportDate: Date;
    
    if (report.timestamp) {
      if (report.timestamp.includes('T') || report.timestamp.includes('Z')) {
        // ISO format: "2026-01-08T05:44:44.442Z"
        reportDate = new Date(report.timestamp);
      } else {
        // Formatted timestamp: "Dec 30, 2025 • 11:45 PM"
        const reportDateStr = report.timestamp.split('•')[0].trim();
        reportDate = new Date(reportDateStr);
      }
    } else {
      // Fallback: use current date if no timestamp
      reportDate = new Date();
    }
    
    // Get current date for comparison
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Normalize report date to start of day for comparison
    const reportDateNormalized = new Date(
      reportDate.getFullYear(),
      reportDate.getMonth(),
      reportDate.getDate()
    );
    
    if (dateRange === 'today') {
      return reportDateNormalized.getTime() === today.getTime();
    } else if (dateRange === 'yesterday') {
      return reportDateNormalized.getTime() === yesterday.getTime();
    } else if (dateRange === 'last-7-days') {
      // Show reports from last 7 days (including today)
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return reportDateNormalized >= sevenDaysAgo;
    } else if (dateRange === 'last-30-days') {
      // Show reports from last 30 days (including today)
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return reportDateNormalized >= thirtyDaysAgo;
    } else if (dateRange === 'custom') {
      // Strict date range filtering based on actual custom range selection
      if (!customDateRange) return false;
      
      // Get start and end dates from custom range (normalize to start of day)
      const [startDate, endDate] = customDateRange;
      const rangeStart = new Date(startDate);
      rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(endDate);
      rangeEnd.setHours(23, 59, 59, 999);
      
      // Normalize report date to start of day for comparison
      const reportDateNormalized = new Date(reportDate);
      reportDateNormalized.setHours(0, 0, 0, 0);
      
      return reportDateNormalized >= rangeStart && reportDateNormalized <= rangeEnd;
    } else if (dateRange === 'all') {
      return true; // Show all reports
    }
    
    return true; // Default: show all
  };

  // Helper function to determine if report matches type filter
  const matchesTypeFilter = (report: Report): boolean => {
    if (reportType === 'all') {
      return true;
    } else if (reportType === 'incident') {
      return report.type === 'Incident';
    } else if (reportType === 'dar') {
      return report.type === 'DAR';
    } else if (reportType === 'maintenance') {
      return report.type === 'Maintenance';
    }
    return true;
  };

  // ============================================================================
  // EXTENDED FILTERS LOGIC
  // ============================================================================
  
  // Helper function to check if report matches all extended filter criteria
  const matchesExtendedFilters = (report: Report): boolean => {
    // Site filter
    if (extendedFilters.site !== 'all' && report.site !== extendedFilters.site) {
      return false;
    }

    // Report Types filter (multi-select)
    if (extendedFilters.reportTypes.length > 0) {
      const reportTypeNormalized = report.reportType || report.type.toLowerCase();
      const matchesType = extendedFilters.reportTypes.some(filterType => {
        if (filterType === 'incident') return reportTypeNormalized === 'incident' || report.type === 'Incident';
        if (filterType === 'dar') return reportTypeNormalized === 'dar' || report.type === 'DAR';
        if (filterType === 'maintenance') return reportTypeNormalized === 'maintenance' || report.type === 'Maintenance';
        if (filterType === 'disciplinary') return reportTypeNormalized === 'disciplinary' || report.type === 'Disciplinary';
        if (filterType === 'shift_pass_on') return reportTypeNormalized === 'shift_pass_on' || report.type === 'Shift Pass-On';
        return false;
      });
      if (!matchesType) return false;
    }

    // Has Attachments filter
    if (extendedFilters.hasAttachments !== null) {
      const hasAttachments = (report.attachments?.length || 0) > 0;
      if (extendedFilters.hasAttachments !== hasAttachments) {
        return false;
      }
    }

    // Filed By filter
    if (extendedFilters.filedBy !== 'all' && report.guardName !== extendedFilters.filedBy) {
      return false;
    }

    // Note: Status filtering is handled by the status tabs (Pending/Approved/Rejected)
    // so we don't need to apply the extended status filter here

    // Assigned Reviewer filter
    if (extendedFilters.assigned !== 'all') {
      if (extendedFilters.assigned === 'unassigned') {
        if (report.assignedTo) return false;
      } else if (extendedFilters.assigned === 'me') {
        if (report.assignedTo !== currentUser.name) return false;
      } else if (extendedFilters.assigned === 'others') {
        if (!report.assignedTo || report.assignedTo === currentUser.name) return false;
      }
    }

    return true;
  };

  // Extract unique sites and guards for filter options
  const uniqueSites = useMemo(() => {
    const sites = Array.from(new Set(reports.map(r => r.site))).sort();
    return sites;
  }, [reports]);

  const uniqueGuards = useMemo(() => {
    const guards = Array.from(new Set(reports.map(r => r.guardName))).sort();
    return guards;
  }, [reports]);

  // Apply filters to reports based on status tab + extended filters
  const filteredReportsByStatus = reports
    .filter(r => {
      // For drafts, only show user's own drafts
      if (statusTab === 'drafts') {
        return r.status === 'draft' && r.createdBy === currentUser.name;
      }
      return r.status === statusTab;
    })
    .map((report, index) => ({ report, index }))
    .filter(({ report, index }) => 
      matchesTypeFilter(report) && 
      matchesDateFilter(report, index) && 
      matchesExtendedFilters(report)
    )
    .map(({ report }) => report);

  // Calculate counts for each status tab (based on current date/type/extended filters)
  const pendingCount = reports
    .filter(r => r.status === 'pending')
    .filter((report, index) => 
      matchesTypeFilter(report) && 
      matchesDateFilter(report, index) && 
      matchesExtendedFilters(report)
    )
    .length;
  const approvedCount = reports
    .filter(r => r.status === 'approved')
    .filter((report, index) => 
      matchesTypeFilter(report) && 
      matchesDateFilter(report, index) && 
      matchesExtendedFilters(report)
    )
    .length;
  const rejectedCount = reports
    .filter(r => r.status === 'rejected')
    .filter((report, index) => 
      matchesTypeFilter(report) && 
      matchesDateFilter(report, index) && 
      matchesExtendedFilters(report)
    )
    .length;
  const draftsCount = reports
    .filter(r => r.status === 'draft' && r.createdBy === currentUser.name)
    .filter((report, index) => 
      matchesTypeFilter(report) && 
      matchesDateFilter(report, index) && 
      matchesExtendedFilters(report)
    )
    .length;

  // Apply additional filter for summary type selection
  const displayedReports = selectedSummaryType 
    ? filteredReportsByStatus.filter(report => report.type === selectedSummaryType)
    : filteredReportsByStatus;
  const allSelected = displayedReports.length > 0 && selectedReportIds.size === displayedReports.length;

  // Calculate pending counts by report type for summary sidebar
  const pendingCountsByType = useMemo(() => {
    return calculatePendingCounts(reports);
  }, [reports]);

  // Handle summary card click - filters by type and switches to pending tab
  const handleSummaryTypeClick = (type: string) => {
    if (selectedSummaryType === type) {
      // Toggle off - clear filter
      setSelectedSummaryType(null);
    } else {
      // Apply filter and switch to pending tab
      setSelectedSummaryType(type);
      setStatusTab('pending');
    }
  };

  // Handler to clear active filter
  const handleClearFilter = () => {
    setSelectedSummaryType(null);
  };

  const handleEdit = (report: Report) => {
    // In a real app, this would open an edit modal
    setEditingReport(report);
    setIsEditModalOpen(true);
  };

  // ============================================================================
  // HANDLER: Open Edit Modal for Rejected Report Resubmission
  // ============================================================================
  /**
   * Opens edit modal pre-filled with rejected report's data
   * Does NOT modify the original rejected report (immutable audit trail)
   * Only available to the creator of the rejected report
   * User can choose: Save Draft or Resubmit for Review
   */
  const handleEditAndResubmit = (rejectedReport: Report) => {
    // Permission check: Only creator can edit their own rejected reports
    if (rejectedReport.createdBy !== currentUser.name) {
      toast.error('You can only edit rejected reports you created');
      return;
    }

    // Set the rejected report as the editing target
    // Mark it as a resubmission to show different buttons in modal
    setEditingReport({
      ...rejectedReport,
      isResubmission: true, // Flag to indicate this is a resubmission
      revisionOfReportId: rejectedReport.id // Track original rejected report
    } as any);
    
    // Determine report type for modal
    const reportTypeMap: { [key: string]: 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon' } = {
      'Incident': 'incident',
      'DAR': 'dar',
      'Maintenance': 'maintenance',
      'Disciplinary': 'disciplinary',
      'Shift Pass-On': 'shift-passon'
    };
    
    const modalReportType = reportTypeMap[rejectedReport.type] || 'incident';
    setCreateReportType(modalReportType);
    
    // Open the create report modal in edit/resubmission mode
    setIsCreateReportModalOpen(true);
  };

  const handleReject = (reportId: number) => {
    // DEBUG: Log rejection flow
    console.log('[Reports] handleReject called with reportId:', reportId);
    console.log('[Reports] Setting rejectingReportId to:', reportId);
    console.log('[Reports] Setting isRejectModalOpen to: true');
    
    // Open the rejection modal instead of immediately rejecting
    setRejectingReportId(reportId);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = (rejectionReason: string) => {
    if (!rejectingReportId) return;
    
    // DEBUG: Log confirmation
    console.log('[Reports] handleConfirmReject called');
    console.log('[Reports] rejectingReportId:', rejectingReportId);
    console.log('[Reports] rejectionReason:', rejectionReason);
    
    // ============================================================================
    // CANONICAL REJECTION: Use global rejectReport() with reviewer metadata
    // ============================================================================
    rejectReport(rejectingReportId, rejectionReason);
    
    setSelectedReportIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(rejectingReportId);
      return newSet;
    });
    
    // Reset state and close modal
    setRejectingReportId(null);
    setIsRejectModalOpen(false);
    
    // Show success toast
    toast.success('Report rejected successfully');
    
    // Note: Reports will automatically re-render when parent updates the reports prop
    console.log('[Reports] Report rejected, list will auto-update from parent');
  };

  const handleApprove = (reportId: number) => {
    // ============================================================================
    // CANONICAL APPROVAL: All approvals go through global approveReport()
    // ============================================================================
    const report = reports.find(r => r.id === reportId);
    
    // DEBUG: Log current user to verify it's the supervisor, not the guard
    console.log('='.repeat(80));
    console.log('[Reports.tsx handleApprove] CURRENT USER CHECK:');
    console.log('Current User:', currentUser);
    console.log('Report Author (guardName):', report?.guardName);
    console.log('Report Created By:', report?.createdBy);
    console.log('='.repeat(80));
    
    // CRITICAL: Prevent guards from approving reports
    if (currentUser.role === 'Guard' || currentUser.role === 'GUARD') {
      console.error('❌ CRITICAL ERROR: Guard cannot approve reports!');
      toast.error('Guards cannot approve reports. Please use a Supervisor/Admin account.');
      return;
    }
    
    // Call canonical approval function
    approveReport(reportId);
    
    // Show success toast
    if (report) {
      toast.success(`✓ Report Approved & Filed to ${report.guardName}'s Personnel Record.`);
    }
    
    // Deselect report
    setSelectedReportIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(reportId);
      return newSet;
    });
  };

  const handleToggleSelect = (reportId: number) => {
    setSelectedReportIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedReportIds(new Set());
    } else {
      setSelectedReportIds(new Set(displayedReports.map(r => r.id)));
    }
  };

  const handleBatchApprove = () => {
    if (selectedReportIds.size === 0) return;
    
    // ============================================================================
    // CANONICAL BATCH APPROVAL: All approvals go through global approveReport()
    // ============================================================================
    const approvedReports = reports.filter(r => selectedReportIds.has(r.id));
    
    // Approve each report using canonical function
    approvedReports.forEach(report => {
      approveReport(report.id);
    });
    
    // Show batch success notification
    toast.success(`✓ ${approvedReports.length} report(s) approved and filed to Vault.`);
    
    // Clear selections
    setSelectedReportIds(new Set());
  };

  const handleBatchReject = (reason: string, note?: string) => {
    if (selectedReportIds.size === 0) return;
    
    const currentUser = { name: 'Sarah Chen', role: 'Supervisor' };
    const time = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
    
    const signature = `by ${currentUser.role} ${currentUser.name}`;
    const rejectedAt = time;
    
    // Build rejection note from reason and optional note
    const reasonLabels: {[key: string]: string} = {
      'missing-details': 'Missing details',
      'wrong-type': 'Wrong report type',
      'needs-clarification': 'Needs clarification',
      'attachment-required': 'Attachment required',
      'policy-format': 'Policy format issue',
      'other': 'Other'
    };
    
    const reasonText = reasonLabels[reason] || reason;
    const rejectionNote = note ? `${reasonText}: ${note}` : reasonText;
    
    const reportsToReject = reports.filter(r => selectedReportIds.has(r.id));
    
    reportsToReject.forEach(report => {
      updateReport(report.id, {
        status: 'rejected' as const,
        rejectionNote: rejectionNote,
        rejectedBy: signature,
        rejectedByRole: currentUser.role,
        rejectedAt: rejectedAt
      });
    });
    
    // Show batch success notification
    toast.success(`✓ ${reportsToReject.length} report(s) rejected.`);
    
    // Clear selections
    setSelectedReportIds(new Set());
    setIsBatchRejectModalOpen(false);
  };

  const handleViewDetails = (reportId: number) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      setDetailsReport(report);
      setIsDetailsModalOpen(true);
    }
  };

  const handlePreviousReport = () => {
    if (!detailsReport) return;
    const currentIndex = reports.findIndex(r => r.id === detailsReport.id);
    if (currentIndex > 0) {
      setDetailsReport(reports[currentIndex - 1]);
    }
  };

  const handleNextReport = () => {
    if (!detailsReport) return;
    const currentIndex = reports.findIndex(r => r.id === detailsReport.id);
    if (currentIndex < reports.length - 1) {
      setDetailsReport(reports[currentIndex + 1]);
    }
  };

  const hasPreviousReport = detailsReport ? reports.findIndex(r => r.id === detailsReport.id) > 0 : false;
  const hasNextReport = detailsReport ? reports.findIndex(r => r.id === detailsReport.id) < reports.length - 1 : false;

  // Handle approve from details modal with auto-queue
  const handleDetailsModalApprove = (reportId: number) => {
    const report = reports.find(r => r.id === reportId);
    
    // CRITICAL: Prevent guards from approving reports
    if (currentUser.role === 'Guard' || currentUser.role === 'GUARD') {
      console.error('❌ CRITICAL ERROR: Guard cannot approve reports!');
      toast.error('Guards cannot approve reports. Please use a Supervisor/Admin account.');
      return;
    }
    
    // Call canonical approval function
    approveReport(reportId);
    
    // Show success toast
    if (report) {
      toast.success(`✓ Report Approved & Filed to ${report.guardName}'s Personnel Record.`);
    }
    
    // Auto-queue: Open next pending report
    const pendingReports = reports
      .filter(r => r.status === 'pending')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    const currentIndex = pendingReports.findIndex(r => r.id === reportId);
    
    // If there's a next pending report, open it
    if (currentIndex >= 0 && currentIndex < pendingReports.length - 1) {
      setDetailsReport(pendingReports[currentIndex + 1]);
    } else {
      // No more pending reports, close modal and show toast
      setIsDetailsModalOpen(false);
      setDetailsReport(null);
      toast.success('All pending reports reviewed.');
    }
  };

  // Handle reject from details modal with auto-queue
  const handleDetailsModalReject = (reportId: number) => {
    // COMPLIANCE: Use Request Changes modal for pending reports
    setRejectingReportId(reportId);
    setIsRequestChangesModalOpen(true);
    
    // Close the details modal temporarily
    setIsDetailsModalOpen(false);
  };

  // Override handleConfirmReject to support auto-queue after rejection
  const handleConfirmRejectWithQueue = (rejectionReason: string) => {
    if (!rejectingReportId) return;
    
    const reportId = rejectingReportId;
    
    // Call canonical rejection
    rejectReport(reportId, rejectionReason);
    
    // Show success toast
    toast.success('Report rejected successfully');
    
    // Reset rejecting state
    setRejectingReportId(null);
    setIsRejectModalOpen(false);
    
    // Auto-queue: Open next pending report
    const pendingReports = reports
      .filter(r => r.status === 'pending')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    const currentIndex = pendingReports.findIndex(r => r.id === reportId);
    
    // If there's a next pending report, open it
    if (currentIndex >= 0 && currentIndex < pendingReports.length - 1) {
      setDetailsReport(pendingReports[currentIndex + 1]);
      setIsDetailsModalOpen(true);
    } else {
      // No more pending reports, show toast
      setDetailsReport(null);
      toast.success('All pending reports reviewed.');
    }
  };

  // Handle request changes confirmation with auto-queue
  const handleConfirmRequestChanges = (rejectionReason: string, notes?: string, notifyGuard?: boolean) => {
    if (!rejectingReportId) return;
    
    const reportId = rejectingReportId;
    
    // COMPLIANCE: Call canonical rejection (status → "rejected" = "Changes Requested")
    rejectReport(reportId, rejectionReason);
    
    // Show success toast
    toast.success('Changes requested. Report returned to author.');
    
    // Reset state
    setRejectingReportId(null);
    setIsRequestChangesModalOpen(false);
    
    // Auto-queue: Open next pending report (review-queue flow)
    if (autoOpenModal === 'review-queue') {
      const pendingReports = reports
        .filter(r => r.status === 'pending')
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      const currentIndex = pendingReports.findIndex(r => r.id === reportId);
      
      // If there's a next pending report, open it
      if (currentIndex >= 0 && currentIndex < pendingReports.length - 1) {
        setDetailsReport(pendingReports[currentIndex + 1]);
        setIsDetailsModalOpen(true);
      } else {
        // No more pending reports, show toast
        setDetailsReport(null);
        toast.success('All pending reports reviewed.');
      }
    }
  };

  const handleDateRangeChange = (value: string) => {
    if (value === 'custom') {
      setIsDatePickerOpen(true);
    }
    setDateRange(value);
  };

  const handleDateRangeSelect = (dates: [Date, Date]) => {
    setCustomDateRange(dates);
    const [start, end] = dates;
    const label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    setCustomDateLabel(label);
    setDateRange('custom');
  };

  const handleClearCustomRange = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomDateRange(null);
    setCustomDateLabel('Custom Range');
    setDateRange('last-7-days');
  };

  const handleCustomRangeClick = () => {
    setIsDatePickerOpen(true);
  };

  const handleCreateReportClick = (type: 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon') => {
    // ============================================================================
    // OBJECT TYPE ENFORCEMENT
    // ============================================================================
    // incident/dar/maintenance/disciplinary → Create REPORT object with reportType + reportCode
    // shift-passon → Create internal-only log entry (treated as report for MVP consistency)
    //                reportType: 'shift_pass_on', visibility: 'internal_only'
    // ============================================================================
    
    // Set the report type - the useEffect hook will automatically regenerate the ID
    setCreateReportType(type);
    
    // Open the create report modal
    setIsCreateReportModalOpen(true);
    setIsSelectReportTypeModalOpen(false);
  };

  const handleCreateReport = (reportData: any) => {
    // ============================================================================
    // 1. EXTRACT REPORT CODE (Canonical Identity)
    // ============================================================================
    // The modal provides either caseId or id. We'll use it as reportCode.
    const reportCode = (reportData.caseId || reportData.id || '').replace(/^#/, '');

    if (!reportCode) {
      toast.error('Error: No Report Code provided. Please try again.');
      console.error('CRITICAL: Missing Report Code from modal submission', reportData);
      return;
    }

    // ============================================================================
    // 2. VALIDATION
    // ============================================================================
    if (!reportData.site || !reportData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    // ============================================================================
    // 3. DETERMINE REPORT TYPE (both legacy and normalized)
    // ============================================================================
    // ROUTING RULES:
    // - incident/dar/maintenance → Standard report types for client delivery
    // - disciplinary → internal_only, goes to Internal/HR storage only
    // - shift_pass_on → internal_only, auto-approved, stored in Internal Ops
    // ============================================================================
    let type: 'DAR' | 'Incident' | 'Maintenance' | 'Disciplinary' | 'Shift Pass-On' = 'DAR';
    let reportType: ReportType = 'other';
    let autoApprove = false; // Shift Pass-On logs are auto-approved
    const reportTypeStr = createReportType.toLowerCase();
    
    if (reportTypeStr.includes('disciplinary')) {
      type = 'Disciplinary';
      reportType = 'disciplinary'; // internal_only
    } else if (reportTypeStr.includes('incident')) {
      type = 'Incident';
      reportType = 'incident';
    } else if (reportTypeStr.includes('maintenance')) {
      type = 'Maintenance';
      reportType = 'maintenance';
    } else if (reportTypeStr.includes('dar')) {
      type = 'DAR';
      reportType = 'dar';
    } else if (reportTypeStr.includes('shift') || reportTypeStr.includes('passon')) {
      type = 'Shift Pass-On'; // Categorize as Shift Pass-On for display purposes
      reportType = 'shift_pass_on'; // internal_only
      autoApprove = true; // Shift Pass-On logs don't require supervisor approval
    }
    
    // ============================================================================
    // 4. FORMAT DATE
    // ============================================================================
    let formattedDate = reportData.date;
    if (reportData.date && !reportData.date.includes(',')) {
      // Convert "2026-01-04" to "Jan 04, 2026" only if not already formatted
      const dateObj = new Date(reportData.date);
      formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }
    
    // ============================================================================
    // 5. SAVE REPORT TO STATE (using global addReport function)
    // ============================================================================
    const newReport = {
      reportCode,  // CANONICAL: Immutable report identity
      caseId: `#${reportCode}`,  // Legacy field for backward compatibility
      type,
      reportType,  // Normalized field for business logic
      priority: reportData.priority || 'normal',
      guardName: currentUser.name,
      site: reportData.site,
      content: reportData.content,
      status: autoApprove ? ('approved' as const) : ('pending' as const), // Auto-approve Shift Pass-On logs
      location: reportData.location,
      attachments: reportData.attachments || [],
      date: formattedDate,
      time: reportData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      incidentType: reportData.incidentType,
      urgency: reportData.urgency,
      // ============================================================================
      // CRITICAL FIX: Use canonical field names for police response
      // ============================================================================
      police_called: reportData.police_called, // boolean - canonical field name
      pd_case_number: reportData.pd_case_number, // string - canonical field name
      // ============================================================================
      narrativeOnly: reportData.narrativeOnly,
      actionTaken: reportData.actionTaken,
      // DAR-specific fields
      shiftStart: reportData.shiftStart,
      shiftEnd: reportData.shiftEnd,
      reliefGuard: reportData.reliefGuard,
      equipmentStatus: reportData.equipmentStatus,
      // Maintenance-specific fields
      maintenanceCategory: reportData.maintenanceCategory,
      specificArea: reportData.specificArea,
      assetId: reportData.assetId,
      // Disciplinary-specific fields (Map directly - NO transformation)
      employeeName: reportData.employeeName || 'N/A',
      violationType: reportData.violationType || 'N/A',
      disciplineLevel: reportData.disciplineLevel || 'N/A',
      correctiveAction: reportData.correctiveAction || 'N/A',
      // Shift Pass-On specific fields
      shift: reportData.shift
    };
    
    addReport(newReport);
    
    // ============================================================================
    // 6. AUTO-APPROVE & ADD TO VAULT IF SHIFT PASS-ON
    // ============================================================================
    if (autoApprove) {
      // Add to Vault immediately since Shift Pass-On logs are auto-approved
      const currentDate = new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      addVaultDocument({
        name: `${reportCode} - Shift Pass-On Log.pdf`, // Standardized format
        category: 'Internal Ops',
        uploadedBy: currentUser.name,
        date: currentDate,
        size: '0.3 MB',
        status: 'Active',
        reportReferenceId: reportCode
      });
    }
    
    // ============================================================================
    // 7. CLOSE MODAL & SHOW SUCCESS NOTIFICATION
    // ============================================================================
    setIsCreateReportModalOpen(false);
    
    const reportTypeName = type === 'Incident' ? 'Incident Report' 
      : type === 'DAR' && reportType === 'shift_pass_on' ? 'Shift Pass-On Log'
      : type === 'DAR' ? 'Daily Activity Report' 
      : type === 'Maintenance' ? 'Maintenance Request' 
      : type === 'Disciplinary' ? 'Disciplinary Action' 
      : 'Report';
    
    if (autoApprove) {
      toast.success(`✓ ${reportTypeName} #${reportCode} created and filed to Internal Vault.`);
    } else {
      toast.success(`✓ ${reportTypeName} #${reportCode} created successfully.`);
    }
  };

  // ============================================================================
  // DRAFTS HANDLERS
  // ============================================================================
  
  const handleSaveAsDraft = (reportData: any) => {
    // Check if we're updating an existing draft
    const existingDraft = editingReport && editingReport.status === 'draft' ? editingReport : null;
    
    // Use temporary DRAFT-XXX code for new drafts, keep existing code for updates
    let reportCode: string;
    if (existingDraft) {
      reportCode = existingDraft.reportCode;
    } else {
      const draftSequence = getDraftCounter();
      reportCode = `DRAFT-${String(draftSequence).padStart(3, '0')}`;
    }
    
    // Determine report type
    let type: 'DAR' | 'Incident' | 'Maintenance' | 'Disciplinary' | 'Shift Pass-On' = 'DAR';
    let reportType: ReportType = 'other';
    const reportTypeStr = createReportType.toLowerCase();
    
    if (reportTypeStr.includes('disciplinary')) {
      type = 'Disciplinary';
      reportType = 'disciplinary';
    } else if (reportTypeStr.includes('incident')) {
      type = 'Incident';
      reportType = 'incident';
    } else if (reportTypeStr.includes('maintenance')) {
      type = 'Maintenance';
      reportType = 'maintenance';
    } else if (reportTypeStr.includes('dar')) {
      type = 'DAR';
      reportType = 'dar';
    } else if (reportTypeStr.includes('shift') || reportTypeStr.includes('passon')) {
      type = 'Shift Pass-On';
      reportType = 'shift_pass_on';
    }
    
    // Format date
    let formattedDate = reportData.date;
    if (reportData.date && !reportData.date.includes(',')) {
      const dateObj = new Date(reportData.date);
      formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }
    
    if (existingDraft) {
      // Update existing draft - preserve date/time fields in correct format
      updateReport(existingDraft.id, {
        ...reportData,
        type,
        reportType,
        priority: reportData.priority || 'normal',
        guardName: currentUser.name,
        site: reportData.site || reportData.location || 'Unknown Location',
        content: reportData.content,
        status: 'draft',
        date: formattedDate, // Display date for table
        time: reportData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        // Store actual field values for form rehydration
        incidentDate: reportData.date, // YYYY-MM-DD format from form
        incidentType: reportData.incidentType,
        urgency: reportData.urgency,
        policeCalled: reportData.policeCalled,
        actionTaken: reportData.actionTaken,
        pdCaseNumber: reportData.pdCaseNumber,
        // DAR fields
        shiftStart: reportData.shiftStart,
        shiftEnd: reportData.shiftEnd,
        shift: reportData.shift,
        reliefGuard: reportData.reliefGuard,
        equipmentStatus: reportData.equipmentStatus,
        // Maintenance fields
        maintenanceCategory: reportData.maintenanceCategory,
        specificArea: reportData.specificArea,
        assetId: reportData.assetId,
        maintenanceDate: reportData.maintenanceDate,
        maintenanceTime: reportData.maintenanceTime,
        // Disciplinary fields
        employeeName: reportData.employeeName,
        violationType: reportData.violationType,
        disciplineLevel: reportData.disciplineLevel,
        correctiveAction: reportData.correctiveAction,
        disciplinaryDate: reportData.disciplinaryDate,
        disciplinaryTime: reportData.disciplinaryTime
      });
      toast.success('✓ Draft updated successfully.');
    } else {
      // Create new draft with temporary DRAFT-XXX code
      const newDraft = {
        reportCode,
        caseId: `#${reportCode}`,
        type,
        reportType,
        priority: reportData.priority || 'normal',
        guardName: currentUser.name,
        site: reportData.site || reportData.location || 'Unknown Location',
        content: reportData.content,
        status: 'draft' as const,
        createdBy: currentUser.name,  // Track who created this draft
        location: reportData.location,
        attachments: reportData.attachments || [],
        date: formattedDate, // Display date for table (e.g., "Jan 8, 2026")
        time: reportData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        
        // ============================================================================
        // CRITICAL: Store date/time in correct format and field names for rehydration
        // ============================================================================
        
        // Incident Report fields
        incidentDate: reportData.date, // YYYY-MM-DD format from the form
        incidentType: reportData.incidentType,
        urgency: reportData.urgency,
        policeCalled: reportData.policeCalled,
        narrativeOnly: reportData.narrativeOnly,
        actionTaken: reportData.actionTaken,
        pdCaseNumber: reportData.pdCaseNumber,
        
        // DAR-specific fields
        shiftStart: reportData.shiftStart, // HH:mm format
        shiftEnd: reportData.shiftEnd, // HH:mm format
        shift: reportData.shift, // Shift type
        reliefGuard: reportData.reliefGuard,
        equipmentStatus: reportData.equipmentStatus,
        
        // Maintenance-specific fields
        maintenanceCategory: reportData.maintenanceCategory,
        specificArea: reportData.specificArea,
        assetId: reportData.assetId,
        maintenanceDate: reportData.maintenanceDate, // YYYY-MM-DD format
        maintenanceTime: reportData.maintenanceTime, // HH:mm format
        
        // Disciplinary-specific fields
        employeeName: reportData.employeeName,
        violationType: reportData.violationType,
        disciplineLevel: reportData.disciplineLevel,
        correctiveAction: reportData.correctiveAction,
        disciplinaryDate: reportData.disciplinaryDate, // YYYY-MM-DD format
        disciplinaryTime: reportData.disciplinaryTime // HH:mm format
      };
      
      addReport(newDraft);
      toast.success('✓ Draft saved successfully.');
    }
    
    setIsCreateReportModalOpen(false);
    setEditingReport(null);
  };

  const handleContinueEditingDraft = (draft: Report) => {
    // Open CreateReportModal with the draft data pre-filled
    setEditingReport(draft);
    const draftType = draft.reportType === 'incident' ? 'incident'
      : draft.reportType === 'dar' ? 'dar'
      : draft.reportType === 'maintenance' ? 'maintenance'
      : draft.reportType === 'disciplinary' ? 'disciplinary'
      : draft.reportType === 'shift_pass_on' ? 'shift-passon'
      : 'dar';
    setCreateReportType(draftType);
    setIsCreateReportModalOpen(true);
  };

  const handleDeleteDraft = (draftId: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this draft? This action cannot be undone.');
    if (confirmed) {
      const draft = reports.find(r => r.id === draftId);
      if (draft) {
        // Use the proper deleteReport function to permanently remove the draft
        deleteReport(draftId);
        toast.success('✓ Draft deleted successfully.');
      }
    }
  };

  const handleSubmitDraft = (draftId: number, reportData: any) => {
    const draft = reports.find(r => r.id === draftId);
    if (!draft) return;
    
    // Generate a permanent report code to replace the temporary DRAFT-XXX code
    let permanentReportCode: string;
    if (draft.reportCode.startsWith('DRAFT-')) {
      // Get a permanent code based on report type
      const reportTypeForCode = draft.type === 'Incident' ? 'Incident' 
        : draft.type === 'DAR' ? 'DAR' 
        : draft.type === 'Maintenance' ? 'Maintenance' 
        : draft.type;
      permanentReportCode = getPreviewId(reportTypeForCode as any);
    } else {
      // Already has a permanent code (shouldn't happen, but defensive)
      permanentReportCode = draft.reportCode;
    }
    
    // When submitting a draft, assign permanent code and change status to 'pending'
    // Preserve revisionOfReportId if this is a revision
    updateReport(draftId, {
      ...reportData,
      reportCode: permanentReportCode,
      caseId: `#${permanentReportCode}`,
      status: 'pending' as const,
      revisionOfReportId: draft.revisionOfReportId // Preserve revision reference
    });
    
    setIsCreateReportModalOpen(false);
    setEditingReport(null);
    
    const reportTypeName = draft.type === 'Incident' ? 'Incident Report' 
      : draft.type === 'DAR' ? 'Daily Activity Report' 
      : draft.type === 'Maintenance' ? 'Maintenance Request' 
      : draft.type === 'Disciplinary' ? 'Disciplinary Action' 
      : 'Report';
    
    // Show different message if this is a revision
    if (draft.revisionOfReportId) {
      const originalReport = reports.find(r => r.id === draft.revisionOfReportId);
      const originalCode = originalReport?.reportCode || `Report #${draft.revisionOfReportId}`;
      toast.success(`✓ Revised ${reportTypeName} #${permanentReportCode} submitted for review (revision of ${originalCode}).`);
    } else {
      toast.success(`✓ ${reportTypeName} #${permanentReportCode} submitted for review.`);
    }
  };

  // ============================================================================
  // HANDLERS: Resubmission Actions (Save Draft / Resubmit for Review)
  // ============================================================================
  /**
   * Save as Draft - Creates a new draft report from rejected report data
   * Status: 'draft', stays in Drafts tab
   */
  const handleResubmissionSaveDraft = async (reportData: any) => {
    const originalRejectedReport = editingReport;
    if (!originalRejectedReport || !originalRejectedReport.revisionOfReportId) {
      toast.error('Error: Original rejected report not found');
      return;
    }

    try {
      // Create a new draft report with all data from the form
      const draftCode = `DRAFT-${getDraftCounter()}`;
      const newDraft: Partial<Report> = {
        ...reportData,
        id: undefined, // Will be assigned by backend
        status: 'draft' as const,
        reportCode: draftCode,
        caseId: draftCode,
        revisionOfReportId: originalRejectedReport.revisionOfReportId,
        createdBy: currentUser.name,
        timestamp: new Date().toISOString(),
        // Clear rejection metadata
        rejectionNote: undefined,
        rejectedBy: undefined,
        rejectedAt: undefined,
        rejectedByRole: undefined,
        // Clear approval metadata
        approvedBy: undefined,
        approvedAt: undefined,
        approvedByRole: undefined,
      };

      await addReport(newDraft as Report);
      
      const originalReport = reports.find(r => r.id === originalRejectedReport.revisionOfReportId);
      const originalCode = originalReport?.reportCode || 'Rejected Report';
      toast.success(`✓ Draft saved (revision of ${originalCode}). Continue editing in Drafts tab.`);
      
      setIsCreateReportModalOpen(false);
      setEditingReport(null);
      setStatusTab('drafts'); // Navigate to Drafts tab
    } catch (error) {
      console.error('Error saving resubmission draft:', error);
      toast.error('Failed to save draft');
    }
  };

  /**
   * Resubmit for Review - Creates a new pending report from rejected report data
   * Status: 'pending', goes directly to review queue
   */
  const handleResubmitForReview = async (reportData: any) => {
    const originalRejectedReport = editingReport;
    if (!originalRejectedReport || !originalRejectedReport.revisionOfReportId) {
      toast.error('Error: Original rejected report not found');
      return;
    }

    try {
      // Generate permanent report code
      const reportTypeForCode = originalRejectedReport.type === 'Incident' ? 'Incident' 
        : originalRejectedReport.type === 'DAR' ? 'DAR' 
        : originalRejectedReport.type === 'Maintenance' ? 'Maintenance' 
        : originalRejectedReport.type === 'Disciplinary' ? 'Disciplinary'
        : originalRejectedReport.type;
      const permanentReportCode = getPreviewId(reportTypeForCode as any);
      
      // Create a new pending report
      const newReport: Partial<Report> = {
        ...reportData,
        id: undefined, // Will be assigned by backend
        status: 'pending' as const,
        reportCode: permanentReportCode,
        caseId: `#${permanentReportCode}`,
        revisionOfReportId: originalRejectedReport.revisionOfReportId,
        createdBy: currentUser.name,
        timestamp: new Date().toISOString(),
        // Clear rejection metadata
        rejectionNote: undefined,
        rejectedBy: undefined,
        rejectedAt: undefined,
        rejectedByRole: undefined,
        // Clear approval metadata
        approvedBy: undefined,
        approvedAt: undefined,
        approvedByRole: undefined,
      };

      await addReport(newReport as Report);
      
      const originalReport = reports.find(r => r.id === originalRejectedReport.revisionOfReportId);
      const originalCode = originalReport?.reportCode || 'Rejected Report';
      const reportTypeName = originalRejectedReport.type === 'Incident' ? 'Incident Report' 
        : originalRejectedReport.type === 'DAR' ? 'Daily Activity Report' 
        : originalRejectedReport.type === 'Maintenance' ? 'Maintenance Request' 
        : originalRejectedReport.type === 'Disciplinary' ? 'Disciplinary Action' 
        : 'Report';
      
      toast.success(`✓ Revised ${reportTypeName} #${permanentReportCode} submitted for review (revision of ${originalCode}).`);
      
      setIsCreateReportModalOpen(false);
      setEditingReport(null);
      setStatusTab('pending'); // Navigate to Pending tab
    } catch (error) {
      console.error('Error resubmitting report:', error);
      toast.error('Failed to resubmit report');
    }
  };

  // Handler for opening Maintenance Request modal (programmed card)
  const handleOpenMaintenanceRequest = () => {
    const maintenanceMode = {
      type: 'maintenance' as const,
      title: 'Maintenance Request',
      reportIdPrefix: '#MR',
      themeColor: '#F59E0B',
      recipientRole: 'Facility Manager',
      narrativeLabel: 'Issue Description',
      submitButtonText: 'Submit Work Order',
      icon: '🛠️'
    };
    setEnhancedReportMode(maintenanceMode);
    setIsEnhancedReportModalOpen(true);
  };

  // Handler for opening Incident Report modal with industry-standard fields
  const handleOpenIncidentReport = () => {
    const incidentMode = {
      type: 'incident' as const,
      title: 'Incident Report',
      reportIdPrefix: '#IR',
      themeColor: '#EF4444',
      recipientRole: 'Client Security Contact',
      narrativeLabel: 'Detailed Narrative',
      submitButtonText: 'Submit Incident Report',
      icon: '🚨'
    };
    setEnhancedReportMode(incidentMode);
    setIsEnhancedReportModalOpen(true);
  };

  // Handler for submitting enhanced report
  const handleEnhancedReportSubmit = (data: {
    reportId: string;
    title: string;
    content: string;
    site: string;
    priority: 'normal' | 'high';
    themeColor: string;
    recipientRole: string;
  }) => {
    // Use global addReport function (which auto-generates ID and timestamp)
    addReport({
      caseId: data.reportId,
      type: 'DAR', // Maintenance is categorized as DAR
      reportType: 'dar', // Normalized field
      priority: data.priority,
      guardName: currentUser.name,
      site: data.site,
      content: data.content,
      status: 'pending'
    });
    
    // Show success toast
    toast.success(`✓ ${data.title} ${data.reportId} submitted successfully.`);
  };

  return (
    <div className="page-container">
      <PageHeader 
        title="Reports"
        subtitle="Review and approve guard reports before client distribution"
      />
      
      {/* Report Generator Toolbar */}
      <div className="report-generator-toolbar">
        <div className="toolbar-filters">
          <div className="toolbar-dropdown">
            <Calendar size={16} />
            {dateRange === 'custom' && customDateRange ? (
              <div className="custom-range-input">
                <span className="custom-range-text" onClick={handleCustomRangeClick}>{customDateLabel}</span>
                <button className="clear-custom-range-btn" onClick={handleClearCustomRange}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <Dropdown_Dark
                value={dateRange}
                onChange={handleDateRangeChange}
                options={[
                  { value: 'today', label: 'Today' },
                  { value: 'yesterday', label: 'Yesterday' },
                  { value: 'last-7-days', label: 'Last 7 Days' },
                  { value: 'last-30-days', label: 'Last 30 Days' },
                  { value: 'all', label: 'All Reports' },
                  { value: 'custom', label: 'Custom Range' }
                ]}
              />
            )}
          </div>

          <div className="toolbar-dropdown">
            <Filter size={16} />
            <Dropdown_Dark
              value={reportType}
              onChange={setReportType}
              options={[
                { value: 'all', label: 'All Reports' },
                { value: 'incident', label: 'Incident Reports' },
                { value: 'dar', label: 'Daily Activity Reports' },
                { value: 'maintenance', label: 'Maintenance Reports' }
              ]}
            />
          </div>
        </div>
        
        <div className="toolbar-actions">
          <button 
            className="create-report-btn"
            onClick={() => setIsSelectReportTypeModalOpen(true)}
          >
            <Plus size={16} />
            <span>Create Report</span>
          </button>
        </div>
      </div>
      
      {/* Select Report Type Modal */}
      <SelectReportTypeModal
        isOpen={isSelectReportTypeModalOpen}
        onClose={() => setIsSelectReportTypeModalOpen(false)}
        onSelectType={handleCreateReportClick}
      />
      
      {/* Create Report Modal */}
      <CreateReportModal
        isOpen={isCreateReportModalOpen}
        onClose={() => {
          setIsCreateReportModalOpen(false);
          setEditingReport(null);
        }}
        reportType={createReportType}
        officerName={currentUser.name}
        caseId={generatedCaseId}
        initialData={
          editingReport?.status === 'draft' 
            ? editingReport 
            : (editingReport as any)?.isResubmission 
              ? editingReport 
              : undefined
        }
        isResubmission={(editingReport as any)?.isResubmission || false}
        rejectionNote={(editingReport as any)?.isResubmission ? editingReport?.rejectionNote : undefined}
        onSubmit={(data) => {
          if ((editingReport as any)?.isResubmission) {
            // Resubmitting a rejected report - should not reach here (using separate handlers)
            console.error('onSubmit called for resubmission - this should not happen');
          } else if (editingReport?.status === 'draft') {
            // Submitting a draft - convert to pending
            handleSubmitDraft(editingReport.id, data);
          } else {
            // Creating a new report
            handleCreateReport(data);
          }
        }}
        onSaveAsDraft={
          (editingReport as any)?.isResubmission 
            ? handleResubmissionSaveDraft 
            : handleSaveAsDraft
        }
        onResubmitForReview={
          (editingReport as any)?.isResubmission 
            ? handleResubmitForReview 
            : undefined
        }
      />
      
      {/* Extended Filters */}
      <ExtendedFilters
        filters={extendedFilters}
        onFiltersChange={setExtendedFilters}
        sites={uniqueSites}
        guards={uniqueGuards}
      />
      
      <div className="reports-layout">
        {/* Left Column: Review Queue */}
        <div className="review-queue">
          <div className="review-queue-header">
            <div className="review-queue-title">
              <h2>Incoming Feed</h2>
            </div>

            {/* Active Filter Chip */}
            {selectedSummaryType && (
              <div className="active-filter-chip">
                <span className="filter-chip-text">
                  <Filter size={14} />
                  Type: {pendingCountsByType.find(c => c.type === selectedSummaryType)?.label || selectedSummaryType}
                </span>
                <button 
                  className="filter-chip-close"
                  onClick={handleClearFilter}
                  title="Clear filter"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Status Tabs */}
            <div className="status-tabs">
              <button 
                className={`status-tab ${statusTab === 'pending' ? 'active' : ''}`}
                onClick={() => setStatusTab('pending')}
              >
                Pending ({pendingCount})
              </button>
              <button 
                className={`status-tab ${statusTab === 'approved' ? 'active' : ''}`}
                onClick={() => setStatusTab('approved')}
              >
                Approved ({approvedCount})
              </button>
              <button 
                className={`status-tab ${statusTab === 'rejected' ? 'active' : ''}`}
                onClick={() => setStatusTab('rejected')}
              >
                Rejected ({rejectedCount})
              </button>
              <button 
                className={`status-tab ${statusTab === 'drafts' ? 'active' : ''}`}
                onClick={() => setStatusTab('drafts')}
              >
                Drafts ({draftsCount})
              </button>
            </div>
            
            {/* Only show batch actions for pending tab */}
            {statusTab === 'pending' && (
              <div className="review-queue-actions">
                <label className="select-all-checkbox">
                  <input 
                    type="checkbox" 
                    checked={allSelected}
                    onChange={handleSelectAll}
                  />
                  <span>Select All</span>
                </label>
                <button 
                  className="batch-approve-btn"
                  onClick={handleBatchApprove}
                  disabled={selectedReportIds.size === 0}
                >
                  <Check size={16} />
                  <span>Batch Approve ({selectedReportIds.size})</span>
                </button>
                <button 
                  className="batch-reject-btn"
                  onClick={() => setIsBatchRejectModalOpen(true)}
                  disabled={selectedReportIds.size === 0}
                >
                  <AlertTriangle size={16} />
                  <span>Batch Reject ({selectedReportIds.size})</span>
                </button>
              </div>
            )}
          </div>

          <div className="report-cards-container">
            {statusTab === 'drafts' ? (
              // Draft-specific UI
              displayedReports.map((report) => (
                <div key={report.id} className="report-card draft-card">
                  <div className="report-card-header">
                    <div className="report-type-badge" style={{
                      background: report.type === 'Incident' ? 'rgba(239, 68, 68, 0.1)' :
                                 report.type === 'DAR' ? 'rgba(59, 130, 246, 0.1)' :
                                 report.type === 'Maintenance' ? 'rgba(245, 158, 11, 0.1)' :
                                 report.type === 'Disciplinary' ? 'rgba(168, 85, 247, 0.1)' :
                                 'rgba(107, 114, 128, 0.1)',
                      color: report.type === 'Incident' ? '#EF4444' :
                             report.type === 'DAR' ? '#3B82F6' :
                             report.type === 'Maintenance' ? '#F59E0B' :
                             report.type === 'Disciplinary' ? '#A855F7' :
                             '#6B7280'
                    }}>
                      {report.type}
                    </div>
                    <span className="draft-label" style={{ 
                      marginLeft: 'auto',
                      padding: '4px 8px',
                      background: 'rgba(107, 114, 128, 0.2)',
                      color: '#9CA3AF',
                      fontSize: '11px',
                      fontWeight: '600',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Draft
                    </span>
                  </div>
                  <div className="draft-info" style={{ marginTop: '12px' }}>
                    <p style={{ color: '#E5E7EB', fontSize: '14px', marginBottom: '8px' }}>
                      <strong>{report.site || 'No site specified'}</strong>
                      {report.location && ` • ${report.location}`}
                    </p>
                    <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '4px' }}>
                      Created by: {report.guardName}
                    </p>
                    <p 
                      style={{ color: '#6B7280', fontSize: '12px', cursor: 'help' }}
                      title={`UTC: ${getUTCTimestamp(report.timestamp)}`}
                    >
                      Last updated: {formatTimestamp(report.timestamp)}
                    </p>
                  </div>
                  <div className="draft-actions" style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <button
                      className="button-primary"
                      onClick={() => handleContinueEditingDraft(report)}
                      style={{ flex: 1 }}
                    >
                      Continue Editing
                    </button>
                    <button
                      className="button-secondary"
                      onClick={() => handleDeleteDraft(report.id)}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#EF4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      Delete Draft
                    </button>
                  </div>
                </div>
              ))
            ) : (
              // Regular report cards for other tabs
              displayedReports.map((report) => (
                <ReportCard
                  key={report.id}
                  id={report.id}
                  referenceId={report.caseId || report.referenceId}
                  reportCode={report.reportCode}  // CANONICAL: Pass immutable report code
                  type={report.type}
                  priority={report.priority}
                  guardName={report.guardName}
                  site={report.site}
                  timestamp={report.timestamp}
                  content={report.content}
                  status={report.status}
                  rejectionNote={report.rejectionNote}
                  rejectedBy={report.rejectedBy}
                  rejectedAt={report.rejectedAt}
                  approvedBy={report.approvedBy}
                  approvedAt={report.approvedAt}
                  isSelected={selectedReportIds.has(report.id)}
                  onToggleSelect={handleToggleSelect}
                  onEdit={() => handleEdit(report)}
                  onReject={handleReject}
                  onApprove={handleApprove}
                  onViewDetails={() => handleViewDetails(report.id)}
                  onEditAndResubmit={() => handleEditAndResubmit(report)}
                  createdBy={report.createdBy}
                  currentUserName={currentUser.name}
                />
              ))
            )}

            {displayedReports.length === 0 && (
              <div className="empty-queue">
                <CheckCircle size={48} className="empty-icon" />
                <h3>All Caught Up!</h3>
                <p>No {statusTab} reports to review</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Report Summary Sidebar */}
        <ReportSummarySidebar
          pendingCounts={pendingCountsByType}
          selectedType={selectedSummaryType}
          onTypeClick={handleSummaryTypeClick}
        />
      </div>

      {/* DatePicker Modal */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onDateRangeSelect={handleDateRangeSelect}
      />

      {/* Edit Report Modal */}
      <EditReportModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        report={editingReport}
        onSave={(reportId, updates) => {
          updateReport(reportId, updates);
        }}
        onApprove={(reportId, updates) => {
          // ============================================================================
          // CANONICAL MODAL APPROVAL: Use global approveReport() with updates
          // ============================================================================
          const report = reports.find(r => r.id === reportId);
          
          // Call canonical approval function with any edits from the modal
          approveReport(reportId, { 
            notifyGuard: updates.notifyGuard,
            updates: updates 
          });
          
          // Show success toast
          if (report) {
            toast.success(`✓ Report Approved & Filed to ${report.guardName}'s Personnel Record.`);
          }
        }}
        onReject={(reportId, updates) => {
          // Hard-coded user identity - self-contained rejection logic
          const currentUser = { name: 'Sarah Chen', role: 'Supervisor' };
          
          // Create real-time timestamp
          const time = new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          });
          
          // Construct complete signature string
          const signature = `by ${currentUser.role} ${currentUser.name}`;
          const rejectedAt = time;
          
          // Update the report with any edits made during review AND set status to rejected with signature
          updateReport(reportId, {
            ...updates, 
            status: 'rejected' as const,
            rejectionNote: updates.adminNote || 'Rejected by supervisor',
            rejectedBy: signature,
            rejectedByRole: currentUser.role,
            rejectedAt: rejectedAt
          });
        }}
      />

      {/* Report Details Modal */}
      <ReportDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setDetailsReport(null);
        }}
        report={detailsReport}
        currentUser={currentUser}
        onPrevious={handlePreviousReport}
        onNext={handleNextReport}
        hasPrevious={hasPreviousReport}
        hasNext={hasNextReport}
        onApprove={detailsReport?.status === 'pending' ? () => handleDetailsModalApprove(detailsReport.id) : undefined}
        onReject={detailsReport?.status === 'pending' ? () => handleDetailsModalReject(detailsReport.id) : undefined}
      />

      {/* Enhanced Report Modal */}
      {enhancedReportMode && (
        <EnhancedReportModal
          isOpen={isEnhancedReportModalOpen}
          onClose={() => setIsEnhancedReportModalOpen(false)}
          mode={enhancedReportMode}
          officerName={currentUser.name}
          onSubmit={handleEnhancedReportSubmit}
        />
      )}

      {/* Batch Reject Modal */}
      <BatchRejectModal
        isOpen={isBatchRejectModalOpen}
        onClose={() => setIsBatchRejectModalOpen(false)}
        selectedCount={selectedReportIds.size}
        onConfirm={handleBatchReject}
      />

      {/* Reject Report Modal */}
      <RejectReportModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          console.log('[Reports] Closing reject modal');
          setIsRejectModalOpen(false);
          setRejectingReportId(null);
          // If we were in review queue mode, close everything
          if (autoOpenModal === 'review-queue') {
            setDetailsReport(null);
          }
        }}
        onConfirm={autoOpenModal === 'review-queue' ? handleConfirmRejectWithQueue : handleConfirmReject}
        reportId={rejectingReportId ? reports.find(r => r.id === rejectingReportId)?.caseId : undefined}
      />

      {/* Request Changes Modal - COMPLIANCE: For pending report review */}
      <RequestChangesModal
        isOpen={isRequestChangesModalOpen}
        onClose={() => {
          console.log('[Reports] Closing request changes modal');
          setIsRequestChangesModalOpen(false);
          setRejectingReportId(null);
          // If we were in review queue mode, close everything
          if (autoOpenModal === 'review-queue') {
            setDetailsReport(null);
          }
        }}
        onConfirm={handleConfirmRequestChanges}
        reportId={rejectingReportId ? reports.find(r => r.id === rejectingReportId)?.reportCode : undefined}
      />
    </div>
  );
}