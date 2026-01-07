import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FileText, CheckCircle, X, Send, Calendar, Filter, Eye, Check, Plus } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Dropdown_Dark } from '../ui/Dropdown_Dark';
import { DatePickerModal } from '../ui/DatePickerModal';
import { ReportCard } from '../ui/ReportCard';
import { EditReportModal, ReportUpdates } from '../ui/EditReportModal';
import { ReportDetailsModal } from '../ui/ReportDetailsModal';
import { PDFPreviewModal } from '../ui/PDFPreviewModal';
import { EmailConfirmModal } from '../ui/EmailConfirmModal';
import { SelectReportTypeModal } from '../ui/SelectReportTypeModal';
import { CreateReportModal } from '../ui/CreateReportModal';
import { EnhancedReportModal } from '../ui/EnhancedReportModal';
import { useAppState } from '../../contexts/AppStateContext';
import { toast } from 'sonner';
import '../../reports.css';

export type ClientType = 'building-a' | 'global-logistics' | 'tech-innovations';

interface Report {
  id: number;
  referenceId: string;
  caseId?: string;            // Auto-generated Case ID (e.g., "#IR-2026-8492")
  type: 'DAR' | 'Incident' | 'Maintenance' | 'Disciplinary';
  priority: 'normal' | 'high';
  guardName: string;
  site: string;
  timestamp: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'sent';
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
}

interface ClientPackage {
  id: number;
  clientName: string;
  siteName: string;
  reportCount: number;
  date?: string;
  reports: {
    type: string;
    id: string;
    status: 'ready' | 'pending';
  }[];
}

interface ReportsProps {
  reports: Report[];
  onNavigateToReport?: (clientType: ClientType) => void;
  is_IR2024_1156_Approved: boolean;
  setIs_IR2024_1156_Approved: (value: boolean) => void;
  is_DAR445_Approved: boolean;
  setIs_DAR445_Approved: (value: boolean) => void;
  is_DAR446_Approved: boolean;
  setIs_DAR446_Approved: (value: boolean) => void;
}

export function Reports({ reports, onNavigateToReport, is_IR2024_1156_Approved, setIs_IR2024_1156_Approved, is_DAR445_Approved, setIs_DAR445_Approved, is_DAR446_Approved, setIs_DAR446_Approved }: ReportsProps) {
  const { currentUser, syncReportToGuardVault, broadcastVaultEntry, addReport, updateReportStatus, updateReport, getPreviewId, addVaultDocument } = useAppState();
  const [selectedReportIds, setSelectedReportIds] = useState<Set<number>>(new Set());
  const [dateRange, setDateRange] = useState<string>('last-7-days');
  const [reportType, setReportType] = useState<string>('all');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<[Date, Date] | null>(null);
  const [customDateLabel, setCustomDateLabel] = useState<string>('Custom Range');
  const [statusTab, setStatusTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsReport, setDetailsReport] = useState<Report | null>(null);
  const [isPDFPreviewModalOpen, setIsPDFPreviewModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ClientPackage | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailPackage, setEmailPackage] = useState<ClientPackage | null>(null);
  const [sentPackageIds, setSentPackageIds] = useState<Set<number>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [sentSiteName, setSentSiteName] = useState('');
  const [isSelectReportTypeModalOpen, setIsSelectReportTypeModalOpen] = useState(false);
  const [isCreateReportModalOpen, setIsCreateReportModalOpen] = useState(false);
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
    
    return `${prefixPattern}${nextNum}`;
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

  // Derive Client Outbox packages from approved reports grouped by site
  const outboxPackages = useMemo(() => {
    // Filter approved reports only
    const approvedReports = reports.filter(r => r.status === 'approved');
    
    // Group by site
    const groupedBySite: {[site: string]: Report[]} = {};
    approvedReports.forEach(report => {
      if (!groupedBySite[report.site]) {
        groupedBySite[report.site] = [];
      }
      groupedBySite[report.site].push(report);
    });
    
    // Convert to package format
    const packages: ClientPackage[] = Object.keys(groupedBySite).map((site, index) => {
      const siteReports = groupedBySite[site];
      const firstReport = siteReports[0];
      
      return {
        id: index + 1,
        siteName: site,
        clientName: firstReport?.site || site, // Use site as client name for now
        reportCount: siteReports.length,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        reports: siteReports.map(report => ({
          type: report.type === 'Incident' ? 'Incident Report' : 
                report.type === 'DAR' ? 'Daily Activity Report' : 'Maintenance Report',
          id: report.referenceId,
          status: 'ready' as const // All approved reports are ready
        }))
      };
    });
    
    return packages;
  }, [reports]);

  // Helper function to determine if report matches date filter
  const matchesDateFilter = (report: Report, index: number): boolean => {
    // For demo purposes, simulate date filtering based on report position
    // Top 2 reports = "today" (Dec 30, 2025), next 4 = "yesterday" (Dec 29), next 4 = older (Dec 28, Dec 27)
    if (dateRange === 'today') {
      return index < 2;
    } else if (dateRange === 'yesterday') {
      return index >= 2 && index < 6;
    } else if (dateRange === 'last-7-days') {
      return index < 10;
    } else if (dateRange === 'last-30-days') {
      return true; // Show all
    } else if (dateRange === 'custom') {
      // Strict date range filtering based on actual custom range selection
      if (!customDateRange) return false;
      
      // Parse the report's date from timestamp (e.g., "Dec 30, 2025 • 11:45 PM")
      const reportDateStr = report.timestamp.split('•')[0].trim(); // "Dec 30, 2025"
      const reportDate = new Date(reportDateStr);
      
      // Get start and end dates from custom range (normalize to start of day)
      const [startDate, endDate] = customDateRange;
      const rangeStart = new Date(startDate);
      rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(endDate);
      rangeEnd.setHours(23, 59, 59, 999);
      
      // Normalize report date to start of day for comparison
      const reportDateNormalized = new Date(reportDate);
      reportDateNormalized.setHours(0, 0, 0, 0);
      
      // Boolean visibility logic:
      // Is_Card_Dec28_Visible = reportDate >= rangeStart (e.g., False when range starts Dec 29)
      // Is_Card_Dec30_Visible = reportDate <= rangeEnd (e.g., True when range ends Dec 30)
      const isVisible = reportDateNormalized >= rangeStart && reportDateNormalized <= rangeEnd;
      
      return isVisible;
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

  // Apply filters to reports based on status tab
  const filteredReportsByStatus = reports
    .filter(r => r.status === statusTab)
    .map((report, index) => ({ report, index }))
    .filter(({ report, index }) => matchesTypeFilter(report) && matchesDateFilter(report, index))
    .map(({ report }) => report);

  // Calculate counts for each status tab (based on current date/type filters)
  const pendingCount = reports
    .filter(r => r.status === 'pending')
    .filter((report, index) => matchesTypeFilter(report) && matchesDateFilter(report, index))
    .length;
  const approvedCount = reports
    .filter(r => r.status === 'approved')
    .filter((report, index) => matchesTypeFilter(report) && matchesDateFilter(report, index))
    .length;
  const rejectedCount = reports
    .filter(r => r.status === 'rejected')
    .filter((report, index) => matchesTypeFilter(report) && matchesDateFilter(report, index))
    .length;

  const displayedReports = filteredReportsByStatus;
  const allSelected = displayedReports.length > 0 && selectedReportIds.size === displayedReports.length;

  // Helper function to generate document metadata based on report type
  const generateDocumentMetadata = (report: Report): { fileName: string; category: 'Incident Reports' | 'Daily Reports' | 'Maintenance' } => {
    if (report.type === 'Maintenance') {
      return {
        fileName: `Maintenance Request ${report.referenceId}.pdf`,
        category: 'Maintenance'
      };
    } else if (report.type === 'Incident') {
      return {
        fileName: `Incident Report ${report.referenceId}.pdf`,
        category: 'Incident Reports'
      };
    } else { // DAR
      return {
        fileName: `Daily Activity Report ${report.referenceId}.pdf`,
        category: 'Daily Reports'
      };
    }
  };

  const handleEdit = (report: Report) => {
    // In a real app, this would open an edit modal
    setEditingReport(report);
    setIsEditModalOpen(true);
  };

  const handleReject = (reportId: number) => {
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
    
    updateReport(reportId, {
      status: 'rejected' as const, 
      rejectionNote: 'Not applicable',
      rejectedBy: signature,
      rejectedByRole: currentUser.role,
      rejectedAt: rejectedAt
    });
    
    setSelectedReportIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(reportId);
      return newSet;
    });
  };

  const handleApprove = (reportId: number) => {
    // Find the report being approved to check its reference ID
    const approvedReport = reports.find(r => r.id === reportId);
    
    // Hard-coded user identity - self-contained approval logic
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
    const approvedAt = time;
    
    // ============================================================================
    // INTERNAL ROUTE: Disciplinary Reports
    // ============================================================================
    // Disciplinary reports bypass Client Outbox and go directly to Internal Vault
    if (approvedReport?.type === 'Disciplinary') {
      // Set status to 'archived' (NOT 'approved') - prevents Client Outbox inclusion
      updateReport(reportId, {
        status: 'archived' as const,
        approvedBy: signature,
        approvedByRole: currentUser.role,
        approvedAt: approvedAt
      });
      
      // File immediately to HR & Internal vault
      addVaultDocument({
        name: `Disciplinary Action - ${approvedReport.guardName} - ${approvedReport.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.pdf`,
        category: 'HR & Internal',
        uploadedBy: currentUser.name,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        size: '856 KB', // Mock size
        status: 'Active',
        reportReferenceId: approvedReport.referenceId
      });
      
      // Sync to guard's employee history (for internal tracking)
      syncReportToGuardVault(approvedReport.guardName, {
        reportId: approvedReport.referenceId,
        reportType: 'Disciplinary',
        status: 'approved',
        approvedBy: signature,
        approvedAt: approvedAt,
        site: approvedReport.site,
        timestamp: approvedReport.timestamp
      });
      
      // Show success notification
      toast.success(`🔒 Disciplinary Report filed to Internal Vault (HR & Internal).`);
      
      // Deselect report
      setSelectedReportIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
      
      return; // Exit early - do NOT run standard approval logic
    }
    
    // ============================================================================
    // STANDARD ROUTE: Client-Facing Reports (DAR, Incident, Maintenance)
    // ============================================================================
    // Update the report status to approved with audit trail
    updateReport(reportId, {
      status: 'approved' as const,
      approvedBy: signature,
      approvedByRole: currentUser.role,
      approvedAt: approvedAt
    });
    
    // Update state variables and Client Outbox based on approved report
    if (approvedReport?.referenceId) {
      const refId = approvedReport.referenceId;
      
      // Update specific state variables
      if (refId === '#DAR-446') {
        setIs_DAR446_Approved(true);
      } else if (refId === '#DAR-445') {
        setIs_DAR445_Approved(true);
      } else if (refId === '#IR-2024-1156') {
        setIs_IR2024_1156_Approved(true);
      }
      
      // SyncToVault: File this approved report to the guard's employee history
      if (approvedReport) {
        syncReportToGuardVault(approvedReport.guardName, {
          reportId: approvedReport.referenceId,
          reportType: approvedReport.type,
          status: 'approved',
          approvedBy: signature,
          approvedAt: approvedAt,
          site: approvedReport.site,
          timestamp: approvedReport.timestamp
        });
        
        // Determine the correct Vault category based on report ID prefix or title
        let vaultCategory = 'Daily Reports'; // Default
        
        // IF Title contains 'Incident' OR ID starts with '#IR': Set vaultCategory = 'Incident Reports'
        if (approvedReport.type === 'Incident' || approvedReport.referenceId.startsWith('#IR')) {
          vaultCategory = 'Incident Reports';
        }
        // IF Title contains 'Daily Activity' OR ID starts with '#DAR': Set vaultCategory = 'Daily Reports'
        else if (approvedReport.type === 'DAR' || approvedReport.referenceId.startsWith('#DAR')) {
          vaultCategory = 'Daily Reports';
        }
        // Check for maintenance requests
        else if (approvedReport.referenceId.startsWith('#MAINT')) {
          vaultCategory = 'Maintenance Reports';
        }
        // Check for disciplinary forms
        else if (approvedReport.referenceId.startsWith('#DISC') || approvedReport.referenceId.startsWith('#WU')) {
          vaultCategory = 'Internal Reports';
        }
        // Check for shift pass-on logs
        else if (approvedReport.referenceId.startsWith('#PASS')) {
          vaultCategory = 'Shift Logs';
        }
        
        // Broadcast Global Vault Entry - Set newVaultEntry = true & store latestReportData
        const reportTypeName = approvedReport.type === 'DAR' ? 'Daily Activity Report' : 'Incident Report';
        broadcastVaultEntry({
          name: `${reportTypeName} ${approvedReport.referenceId}`,
          user: approvedReport.guardName,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: 'Active',
          reportId: approvedReport.referenceId,
          reportType: approvedReport.type,
          site: approvedReport.site,
          category: vaultCategory // Send the correct category to the Vault
        });
        
        // Generate document metadata based on report type
        const { fileName, category } = generateDocumentMetadata(approvedReport);
        
        // Add document to Vault
        addVaultDocument({
          name: fileName,
          category: category,
          uploadedBy: approvedReport.guardName,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          size: '1.8 MB', // Mock size
          status: 'Active',
          reportReferenceId: approvedReport.referenceId
        });
        
        // Show toast notification
        toast.success(`✓ Report Approved & Filed to ${approvedReport.guardName}'s Personnel Record.`);
      }
    }
    
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
    
    // Hard-coded user identity - self-contained approval logic
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
    const approvedAt = time;
    
    // Get all reports being approved
    const approvedReports = reports.filter(r => selectedReportIds.has(r.id));
    
    // Update all selected reports to approved status with signature
    approvedReports.forEach(report => {
      updateReport(report.id, {
        status: 'approved' as const,
        approvedBy: signature,
        approvedByRole: currentUser.role,
        approvedAt: approvedAt
      });
    });
    
    // Update state variables and Client Outbox for each approved report
    approvedReports.forEach(report => {
      const refId = report.referenceId;
      
      // Update specific state variables
      if (refId === '#DAR-446') {
        setIs_DAR446_Approved(true);
      } else if (refId === '#DAR-445') {
        setIs_DAR445_Approved(true);
      } else if (refId === '#IR-2024-1156') {
        setIs_IR2024_1156_Approved(true);
      }
      
      // SyncToVault: File this approved report to the guard's employee history
      if (report) {
        syncReportToGuardVault(report.guardName, {
          reportId: report.referenceId,
          reportType: report.type,
          status: 'approved',
          approvedBy: signature,
          approvedAt: approvedAt,
          site: report.site,
          timestamp: report.timestamp
        });
        
        // Determine the correct Vault category based on report ID prefix or title
        let vaultCategory = 'Daily Reports'; // Default
        
        // IF Title contains 'Incident' OR ID starts with '#IR': Set vaultCategory = 'Incident Reports'
        if (report.type === 'Incident' || report.referenceId.startsWith('#IR')) {
          vaultCategory = 'Incident Reports';
        }
        // IF Title contains 'Daily Activity' OR ID starts with '#DAR': Set vaultCategory = 'Daily Reports'
        else if (report.type === 'DAR' || report.referenceId.startsWith('#DAR')) {
          vaultCategory = 'Daily Reports';
        }
        // Check for maintenance requests
        else if (report.referenceId.startsWith('#MAINT')) {
          vaultCategory = 'Maintenance Reports';
        }
        // Check for disciplinary forms
        else if (report.referenceId.startsWith('#DISC') || report.referenceId.startsWith('#WU')) {
          vaultCategory = 'Internal Reports';
        }
        // Check for shift pass-on logs
        else if (report.referenceId.startsWith('#PASS')) {
          vaultCategory = 'Shift Logs';
        }
        
        // Broadcast Global Vault Entry - Set newVaultEntry = true & store latestReportData
        const reportTypeName = report.type === 'DAR' ? 'Daily Activity Report' : 'Incident Report';
        broadcastVaultEntry({
          name: `${reportTypeName} ${report.referenceId}`,
          user: report.guardName,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: 'Active',
          reportId: report.referenceId,
          reportType: report.type,
          site: report.site,
          category: vaultCategory // Send the correct category to the Vault
        });
        
        // Generate document metadata based on report type
        const { fileName, category } = generateDocumentMetadata(report);
        
        // Add document to Vault
        addVaultDocument({
          name: fileName,
          category: category,
          uploadedBy: report.guardName,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          size: '1.8 MB', // Mock size
          status: 'Active',
          reportReferenceId: report.referenceId
        });
        
        // Show toast notification
        toast.success(`✓ Report Approved & Filed to ${report.guardName}'s Personnel Record.`);
      }
    });
    
    setSelectedReportIds(new Set());
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

  const handleGeneratePDF = (pkg: ClientPackage) => {
    // Open PDF preview modal instead of navigating to a different page
    // This prevents component unmounting and preserves all approval states
    setSelectedPackage(pkg);
    setIsPDFPreviewModalOpen(true);
  };

  const handleSendPackage = (pkg: ClientPackage) => {
    // Open email confirmation modal
    setEmailPackage(pkg);
    setIsEmailModalOpen(true);
  };

  const handleEmailSend = () => {
    if (!emailPackage) return;
    
    // Start loading
    setIsSending(true);
    
    // Capture site name before we delete the package
    const site = emailPackage.siteName || 'Client';
    setSentSiteName(site);
    
    // Simulate delay (1.5 seconds)
    setTimeout(() => {
      // Get current date for vault entries
      const currentDate = new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      // Find all actual Report objects for this package
      const packageReportIds = emailPackage.reports.map(r => r.id);
      const packageReports = reports.filter(r => packageReportIds.includes(r.referenceId));
      
      // Archive each report in the package (mark as sent)
      // NOTE: We do NOT add reports to Vault here - they were already added when approved
      packageReports.forEach(report => {
        // Archive the report by updating its status to 'sent'
        updateReport(report.id, {
          status: 'sent' as const
        });
      });
      
      // Save the Client Packet itself to Vault (this is the only new Vault entry)
      addVaultDocument({
        name: `Client Packet - ${emailPackage.siteName} - ${currentDate}.pdf`,
        category: 'Client Packets',
        uploadedBy: currentUser.name,
        date: currentDate,
        size: '2.5 MB', // Mock size
        status: 'Active',
        reportReferenceId: `PACKET-${emailPackage.siteName}-${Date.now()}`
      });
      
      // Mark package as sent
      setSentPackageIds(prev => {
        const newSet = new Set(prev);
        newSet.add(emailPackage.id);
        return newSet;
      });
      
      // Close the Email Modal
      setIsEmailModalOpen(false);
      
      // Open the Success Modal
      setIsSending(false);
      setShowSuccessModal(true);
    }, 1500);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setIsSending(false); // Reset sending state
    setSentSiteName(''); // Clear the temp name
    setEmailPackage(null); // Clear the email package reference
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
    // Set the report type - the useEffect hook will automatically regenerate the ID
    setCreateReportType(type);
    
    // Open the create report modal
    setIsCreateReportModalOpen(true);
    setIsSelectReportTypeModalOpen(false);
  };

  const handleCreateReport = (reportData: any) => {
    // ============================================================================
    // 1. TRUST THE ID PASSED FROM THE MODAL
    // ============================================================================
    // The modal (child) already has the correct #DIS-xxxx ID. We just need to grab it.
    const finalCaseId = reportData.caseId || reportData.id;

    if (!finalCaseId) {
      toast.error('Error: No Case ID provided. Please try again.');
      console.error('CRITICAL: Missing Case ID from modal submission', reportData);
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
    // 3. DETERMINE REPORT TYPE
    // ============================================================================
    let type: 'DAR' | 'Incident' | 'Maintenance' | 'Disciplinary' = 'DAR';
    const reportTypeStr = createReportType.toLowerCase();
    
    if (reportTypeStr.includes('disciplinary')) {
      type = 'Disciplinary';
    } else if (reportTypeStr.includes('incident')) {
      type = 'Incident';
    } else if (reportTypeStr.includes('maintenance')) {
      type = 'Maintenance';
    } else if (reportTypeStr.includes('dar')) {
      type = 'DAR';
    } else if (reportTypeStr.includes('shift') || reportTypeStr.includes('passon')) {
      type = 'Incident'; // Shift Pass-On is categorized as Incident
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
    addReport({
      caseId: finalCaseId,  // <--- DIRECT ASSIGNMENT. NO LOGIC HERE.
      type,
      priority: reportData.priority || 'normal',
      guardName: currentUser.name,
      site: reportData.site,
      content: reportData.content,
      status: 'pending',
      location: reportData.location,
      attachments: reportData.attachments || [],
      date: formattedDate,
      time: reportData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      incidentType: reportData.incidentType,
      urgency: reportData.urgency,
      policeCalled: reportData.policeCalled,
      narrativeOnly: reportData.narrativeOnly,
      actionTaken: reportData.actionTaken,
      pdCaseNumber: reportData.pdCaseNumber,
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
      correctiveAction: reportData.correctiveAction || 'N/A'
    });
    
    // ============================================================================
    // 6. CLOSE MODAL & SHOW SUCCESS NOTIFICATION
    // ============================================================================
    setIsCreateReportModalOpen(false);
    
    const reportTypeName = type === 'Incident' ? 'Incident Report' 
      : type === 'DAR' ? 'Daily Activity Report' 
      : type === 'Maintenance' ? 'Maintenance Request' 
      : type === 'Disciplinary' ? 'Disciplinary Action' 
      : 'Report';
    
    toast.success(`✓ ${reportTypeName} ${finalCaseId} created successfully.`);
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
        onClose={() => setIsCreateReportModalOpen(false)}
        reportType={createReportType}
        officerName={currentUser.name}
        caseId={generatedCaseId}
        onSubmit={handleCreateReport}
      />
      
      <div className="reports-layout">
        {/* Left Column: Review Queue */}
        <div className="review-queue">
          <div className="review-queue-header">
            <div className="review-queue-title">
              <h2>Incoming Feed</h2>
            </div>

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
              </div>
            )}
          </div>

          <div className="report-cards-container">
            {displayedReports.map((report) => (
              <ReportCard
                key={report.id}
                id={report.id}
                referenceId={report.caseId || report.referenceId}
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
              />
            ))}

            {displayedReports.length === 0 && (
              <div className="empty-queue">
                <CheckCircle size={48} className="empty-icon" />
                <h3>All Caught Up!</h3>
                <p>No {statusTab} reports to review</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Client Outbox */}
        <div className="client-packages">
          <div className="packages-header">
            <h2>Client Outbox</h2>
          </div>

          <div className="package-cards-container">
            {outboxPackages.map((pkg) => {
              // Get current date for subtitle
              const currentDate = new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              });
              
              // Calculate report type counts
              const incidentCount = pkg.reports.filter(r => r.type.includes('Incident')).length;
              const darCount = pkg.reports.filter(r => r.type.includes('Daily Activity')).length;
              const maintenanceCount = pkg.reports.filter(r => r.type.includes('Maintenance')).length;
              const totalCount = pkg.reports.length;
              
              // Build summary text
              const summaryParts = [];
              if (incidentCount > 0) summaryParts.push(`${incidentCount} Incident${incidentCount > 1 ? 's' : ''}`);
              if (darCount > 0) summaryParts.push(`${darCount} Daily Log${darCount > 1 ? 's' : ''}`);
              if (maintenanceCount > 0) summaryParts.push(`${maintenanceCount} Maintenance`);
              const summaryText = summaryParts.join(' • ');
              
              return (
                <div key={pkg.id} className="package-card">
                  <div className="package-card-with-preview">
                    <div className="pdf-preview-thumbnail">
                      <FileText size={20} className="pdf-icon" />
                      <div className="pdf-lines">
                        <div className="pdf-line"></div>
                        <div className="pdf-line"></div>
                        <div className="pdf-line"></div>
                        <div className="pdf-line short"></div>
                      </div>
                    </div>

                    <div className="package-content">
                      <div className="package-header">
                        <div>
                          <h3>{pkg.siteName}</h3>
                          <p className="package-subtitle">Daily Shift Summary • {currentDate}</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="package-status-badge ready-to-send">
                        <CheckCircle size={14} />
                        <span>READY TO SEND</span>
                      </div>

                      {/* Content Summary */}
                      <div className="package-summary">
                        <p className="summary-text">{summaryText}</p>
                        <p className="summary-total">{totalCount} {totalCount === 1 ? 'Report' : 'Reports'} Total</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="package-actions">
                        <button 
                          className="package-preview-btn"
                          onClick={() => handleGeneratePDF(pkg)}
                        >
                          <Eye size={14} />
                          <span>Preview PDF</span>
                        </button>

                        <button 
                          className={`package-send-btn-primary ${
                            sentPackageIds.has(pkg.id) ? 'package-send-btn-sent' : ''
                          }`}
                          onClick={() => handleSendPackage(pkg)}
                          disabled={sentPackageIds.has(pkg.id)}
                        >
                          {sentPackageIds.has(pkg.id) ? (
                            <>
                              <CheckCircle size={16} />
                              <span>Sent Successfully</span>
                            </>
                          ) : (
                            <>
                              <Send size={16} />
                              <span>Send Packet ({totalCount} {totalCount === 1 ? 'Report' : 'Reports'})</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
          // Hard-coded user identity - self-contained approval logic
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
          const approvedAt = time;
          
          // Find the report being approved to check its reference ID
          const approvedReport = reports.find(r => r.id === reportId);
          
          // Update the report with edits AND set status to approved with signature
          updateReport(reportId, {
            ...updates, 
            status: 'approved' as const,
            approvedBy: signature,
            approvedByRole: currentUser.role,
            approvedAt: approvedAt
          });
          
          // Update state variables and Client Outbox based on approved report
          if (approvedReport?.referenceId) {
            const refId = approvedReport.referenceId;
            
            // Update specific state variables
            if (refId === '#DAR-446') {
              setIs_DAR446_Approved(true);
            } else if (refId === '#DAR-445') {
              setIs_DAR445_Approved(true);
            } else if (refId === '#IR-2024-1156') {
              setIs_IR2024_1156_Approved(true);
            }
            
            // SyncToVault: File this approved report to the guard's employee history
            if (approvedReport) {
              syncReportToGuardVault(approvedReport.guardName, {
                reportId: approvedReport.referenceId,
                reportType: approvedReport.type,
                status: 'approved',
                approvedBy: signature,
                approvedAt: approvedAt,
                site: approvedReport.site,
                timestamp: approvedReport.timestamp
              });
              
              // Determine the correct Vault category based on report ID prefix or title
              let vaultCategory = 'Daily Reports'; // Default
              
              // IF Title contains 'Incident' OR ID starts with '#IR': Set vaultCategory = 'Incident Reports'
              if (approvedReport.type === 'Incident' || approvedReport.referenceId.startsWith('#IR')) {
                vaultCategory = 'Incident Reports';
              }
              // IF Title contains 'Daily Activity' OR ID starts with '#DAR': Set vaultCategory = 'Daily Reports'
              else if (approvedReport.type === 'DAR' || approvedReport.referenceId.startsWith('#DAR')) {
                vaultCategory = 'Daily Reports';
              }
              // Check for maintenance requests
              else if (approvedReport.referenceId.startsWith('#MAINT')) {
                vaultCategory = 'Maintenance Reports';
              }
              // Check for disciplinary forms
              else if (approvedReport.referenceId.startsWith('#DISC') || approvedReport.referenceId.startsWith('#WU')) {
                vaultCategory = 'Internal Reports';
              }
              // Check for shift pass-on logs
              else if (approvedReport.referenceId.startsWith('#PASS')) {
                vaultCategory = 'Shift Logs';
              }
              
              // Broadcast Global Vault Entry - Set newVaultEntry = true & store latestReportData
              const reportTypeName = approvedReport.type === 'DAR' ? 'Daily Activity Report' : 'Incident Report';
              broadcastVaultEntry({
                name: `${reportTypeName} ${approvedReport.referenceId}`,
                user: approvedReport.guardName,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                status: 'Active',
                reportId: approvedReport.referenceId,
                reportType: approvedReport.type,
                site: approvedReport.site,
                category: vaultCategory // Send the correct category to the Vault
              });
              
              // Generate document metadata based on report type
              const { fileName, category } = generateDocumentMetadata(approvedReport);
              
              // Add document to Vault
              addVaultDocument({
                name: fileName,
                category: category,
                uploadedBy: approvedReport.guardName,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                size: '1.8 MB', // Mock size
                status: 'Active',
                reportReferenceId: approvedReport.referenceId
              });
              
              // Show toast notification
              toast.success(`✓ Report Approved & Filed to ${approvedReport.guardName}'s Personnel Record.`);
            }
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
        onClose={() => setIsDetailsModalOpen(false)}
        report={detailsReport}
        onPrevious={handlePreviousReport}
        onNext={handleNextReport}
        hasPrevious={hasPreviousReport}
        hasNext={hasNextReport}
      />

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={isPDFPreviewModalOpen}
        onClose={() => setIsPDFPreviewModalOpen(false)}
        package={selectedPackage}
        allReports={reports}
      />

      {/* Email Confirm Modal */}
      <EmailConfirmModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        package={emailPackage}
        sentPackageIds={sentPackageIds}
        onEmailSend={handleEmailSend}
        isSending={isSending}
        onPreviewPDF={() => {
          // Open PDF preview with the current email package
          setSelectedPackage(emailPackage);
          setIsPDFPreviewModalOpen(true);
        }}
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

      {/* Success Confirmation Modal */}
      {showSuccessModal && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleCloseSuccessModal}
        >
          <div 
            className="bg-[#1F2937] border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl shadow-green-900/20 animate-in fade-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-500/20 mb-6 ring-4 ring-green-500/10">
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Packet Sent!</h3>
            <p className="text-gray-300 text-[15px] leading-relaxed mb-8">
              The security report for <span className="text-white font-medium">{sentSiteName}</span> has been emailed to the client and archived.
            </p>
            <button 
              onClick={handleCloseSuccessModal}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-500/20"
            >
              Return to Outbox
            </button>
          </div>
        </div>
      )}
    </div>
  );
}