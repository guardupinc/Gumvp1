import React, { useState, useEffect, useRef } from 'react';
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
  type: 'DAR' | 'Incident' | 'Maintenance';
  priority: 'normal' | 'high';
  guardName: string;
  site: string;
  timestamp: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
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
  // DAR-specific fields
  shiftStart?: string;
  shiftEnd?: string;
  reliefGuard?: string;
  equipmentStatus?: string;
  // Maintenance-specific fields
  maintenanceCategory?: string;
  specificArea?: string;
  assetId?: string;
}

interface ClientPackage {
  id: number;
  clientName: string;
  siteName: string;
  reportCount: number;
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

const mockPackages: ClientPackage[] = [
  {
    id: 1,
    clientName: 'Building A',
    siteName: 'Building A - Security Breach Report',
    reportCount: 1,
    reports: [
      { type: 'Incident Report', id: '#IR-2024-1156', status: 'pending' }
    ]
  },
  {
    id: 2,
    clientName: 'Global Logistics',
    siteName: 'Global Logistics - Clean Shift Report',
    reportCount: 1,
    reports: [
      { type: 'Daily Activity Report', id: '#DAR-882', status: 'ready' }
    ]
  },
  {
    id: 3,
    clientName: 'Tech Innovations',
    siteName: 'Tech Innovations - Maintenance Alert',
    reportCount: 1,
    reports: [
      { type: 'Maintenance Report', id: '#DAR-993', status: 'ready' }
    ]
  }
];

export function Reports({ reports, onNavigateToReport, is_IR2024_1156_Approved, setIs_IR2024_1156_Approved, is_DAR445_Approved, setIs_DAR445_Approved, is_DAR446_Approved, setIs_DAR446_Approved }: ReportsProps) {
  const { currentUser, syncReportToGuardVault, broadcastVaultEntry, addReport, updateReportStatus, updateReport, getPreviewId, addVaultDocument } = useAppState();
  const [packages, setPackages] = useState<ClientPackage[]>(mockPackages);
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

  // Persist Client Outbox state based on linked report's actual status
  // Trigger: On component mount/load and whenever reports change
  useEffect(() => {
    // Look up the actual status of report #IR-2024-1156
    const linkedReport = reports.find(r => r.referenceId === '#IR-2024-1156');
    
    if (linkedReport) {
      // Logic Check: IF Report #IR-2024-1156 status is 'Approved'
      if (linkedReport.status === 'approved') {
        // Set Outbox Status: 'READY' (Green Badge)
        // Button State: Enable 'Send Client Report' (Blue)
        setPackages(prevPackages => prevPackages.map(pkg => ({
          ...pkg,
          reports: pkg.reports.map(report => 
            report.id === '#IR-2024-1156' ? { ...report, status: 'ready' as const } : report
          )
        })));
        
        // Update the state variable to keep it in sync
        setIs_IR2024_1156_Approved(true);
      } else {
        // ELSE (If status is Pending/Rejected)
        // Set Outbox Status: 'AWAITING APPROVAL' (Orange Badge)
        // Button State: Disable 'Send Client Report' (Grey)
        setPackages(prevPackages => prevPackages.map(pkg => ({
          ...pkg,
          reports: pkg.reports.map(report => 
            report.id === '#IR-2024-1156' ? { ...report, status: 'pending' as const } : report
          )
        })));
        
        // Update the state variable to keep it in sync
        if (linkedReport.status !== 'approved') {
          setIs_IR2024_1156_Approved(false);
        }
      }
    }
  }, [reports, setIs_IR2024_1156_Approved]); // Re-run when reports change

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
    } else if (reportType === 'patrol') {
      // Patrol is a subset of DAR for demo purposes
      return report.type === 'DAR';
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
      
      // Update the Client Outbox to change the report status from pending to ready
      setPackages(prevPackages => prevPackages.map(pkg => ({
        ...pkg,
        reports: pkg.reports.map(report => 
          report.id === refId ? { ...report, status: 'ready' as const } : report
        )
      })));
      
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
      
      // Update the Client Outbox to change the report status from pending to ready
      setPackages(prevPackages => prevPackages.map(pkg => ({
        ...pkg,
        reports: pkg.reports.map(pkgReport => 
          pkgReport.id === refId ? { ...pkgReport, status: 'ready' as const } : pkgReport
        )
      })));
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

  const handleSendPackage = (packageId: number) => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;
    
    // Open email confirmation modal
    setEmailPackage(pkg);
    setIsEmailModalOpen(true);
  };

  const handleEmailSend = () => {
    if (!emailPackage) return;
    
    // Mark package as sent
    setSentPackageIds(prev => {
      const newSet = new Set(prev);
      newSet.add(emailPackage.id);
      return newSet;
    });
    
    // Show success toast (in a real app)
    toast.success('Email sent successfully for package:', emailPackage.id);
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
    setCreateReportType(type);
    
    // Generate sequential Case ID based on report type using getPreviewId
    let previewType: 'Incident' | 'DAR' | 'Maintenance' = 'Incident';
    
    if (type === 'incident' || type === 'disciplinary' || type === 'shift-passon') {
      previewType = 'Incident';
    } else if (type === 'dar') {
      previewType = 'DAR';
    } else if (type === 'maintenance') {
      previewType = 'Maintenance';
    }
    
    const newCaseId = getPreviewId(previewType);
    setGeneratedCaseId(newCaseId);
    
    setIsCreateReportModalOpen(true);
    setIsSelectReportTypeModalOpen(false);
  };

  const handleCreateReport = (reportData: { 
    content: string; 
    site: string; 
    priority: 'normal' | 'high';
    location?: string;
    attachments?: Array<{ id: number; url: string; name: string }>;
    date?: string;
    time?: string;
    incidentType?: string;
    urgency?: string;
    policeCalled?: string;
    narrativeOnly?: string;
    // DAR-specific fields
    shiftStart?: string;
    shiftEnd?: string;
    reliefGuard?: string;
    equipmentStatus?: string;
    // Maintenance-specific fields
    maintenanceCategory?: string;
    specificArea?: string;
    assetId?: string;
  }) => {
    // Determine report type based on createReportType
    let type: 'DAR' | 'Incident' | 'Maintenance' = 'DAR';
    
    if (createReportType === 'incident') {
      type = 'Incident';
    } else if (createReportType === 'dar') {
      type = 'DAR';
    } else if (createReportType === 'maintenance') {
      type = 'Maintenance';
    } else if (createReportType === 'disciplinary') {
      type = 'Incident'; // Disciplinary is a type of incident
    } else if (createReportType === 'shift-passon') {
      type = 'Incident'; // Shift Pass-On is a type of incident
    }
    
    // Format the date if provided (convert "2026-01-04" to "Jan 04, 2026")
    let formattedDate = undefined;
    if (reportData.date) {
      const dateObj = new Date(reportData.date);
      formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }
    
    // Use global addReport function which handles ID generation and timestamp
    addReport({
      caseId: generatedCaseId,
      type,
      priority: reportData.priority,
      guardName: currentUser.name,
      site: reportData.site,
      content: reportData.content,
      status: 'pending',
      location: reportData.location,
      attachments: reportData.attachments || [],
      date: formattedDate,
      time: reportData.time,
      incidentType: reportData.incidentType,
      urgency: reportData.urgency,
      policeCalled: reportData.policeCalled,
      narrativeOnly: reportData.narrativeOnly,
      // DAR-specific fields - passed directly from reportData
      shiftStart: reportData.shiftStart,
      shiftEnd: reportData.shiftEnd,
      reliefGuard: reportData.reliefGuard,
      equipmentStatus: reportData.equipmentStatus,
      // Maintenance-specific fields - passed directly from reportData
      maintenanceCategory: reportData.maintenanceCategory,
      specificArea: reportData.specificArea,
      assetId: reportData.assetId
    });
    
    // Show success toast
    toast.success(`✓ ${createReportType === 'incident' ? 'Incident Report' : createReportType === 'dar' ? 'Daily Activity Report' : createReportType === 'maintenance' ? 'Maintenance Request' : createReportType === 'disciplinary' ? 'Disciplinary Action' : 'Shift Pass-On'} created successfully.`);
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
                { value: 'patrol', label: 'Patrol Reports' }
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
                referenceId={report.referenceId}
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
            {packages.map((pkg) => (
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
                        <p className="package-client">{pkg.clientName}</p>
                        {pkg.reports.some(r => r.status === 'pending') ? (
                          <p className="package-awaiting-approval">
                            Awaiting Approval
                          </p>
                        ) : (
                          <p className="package-ready-count">
                            {pkg.reports.filter(r => r.status === 'ready').length} Report Ready for Delivery
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="package-reports-list">
                      {pkg.reports.map((report, idx) => (
                        <div key={idx} className="package-report-item">
                          <CheckCircle size={16} className="check-icon" />
                          <span className="report-type">{report.type}</span>
                          <span className="report-id">{report.id}</span>
                          {report.status === 'ready' ? (
                            <span className="report-ready-badge">READY</span>
                          ) : (
                            <span className="report-pending-badge">PENDING</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Preview PDF Link */}
                    <button 
                      className="package-preview-link"
                      onClick={() => handleGeneratePDF(pkg)}
                    >
                      <Eye size={14} />
                      <span>Preview Client Report</span>
                    </button>

                    <button 
                      className={`package-send-btn ${
                        pkg.reports.some(r => r.status === 'pending') ? 'package-send-btn-disabled' : 
                        sentPackageIds.has(pkg.id) ? 'package-send-btn-sent' : ''
                      }`}
                      onClick={() => handleSendPackage(pkg.id)}
                      disabled={pkg.reports.some(r => r.status === 'pending') || sentPackageIds.has(pkg.id)}
                    >
                      {sentPackageIds.has(pkg.id) ? (
                        <>
                          <CheckCircle size={16} />
                          <span>Sent Successfully</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Send Client Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
            
            // Update the Client Outbox to change the report status from pending to ready
            setPackages(prevPackages => prevPackages.map(pkg => ({
              ...pkg,
              reports: pkg.reports.map(report => 
                report.id === refId ? { ...report, status: 'ready' as const } : report
              )
            })));
            
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
      />

      {/* Email Confirm Modal */}
      <EmailConfirmModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        package={emailPackage}
        sentPackageIds={sentPackageIds}
        onEmailSend={handleEmailSend}
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
    </div>
  );
}