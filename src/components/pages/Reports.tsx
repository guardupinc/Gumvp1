import React, { useState } from 'react';
import { FileText, CheckCircle, X, Send, Calendar, Filter, Eye, Check } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Dropdown_Dark } from '../ui/Dropdown_Dark';
import { DatePickerModal } from '../ui/DatePickerModal';
import { ReportCard } from '../ui/ReportCard';
import { EditReportModal, ReportUpdates } from '../ui/EditReportModal';
import { ReportDetailsModal } from '../ui/ReportDetailsModal';
import { PDFPreviewModal } from '../ui/PDFPreviewModal';
import { EmailConfirmModal } from '../ui/EmailConfirmModal';
import '../../reports.css';

export type ClientType = 'building-a' | 'global-logistics' | 'tech-innovations';

interface Report {
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
  setReports: (reports: Report[]) => void;
  onNavigateToReport?: (clientType: ClientType) => void;
  is_IR2024_1156_Approved: boolean;
  setIs_IR2024_1156_Approved: (value: boolean) => void;
  is_DAR445_Approved: boolean;
  setIs_DAR445_Approved: (value: boolean) => void;
  is_DAR446_Approved: boolean;
  setIs_DAR446_Approved: (value: boolean) => void;
}

const mockReports: Report[] = [
  {
    id: 1,
    referenceId: '#IR-2024-1156',
    type: 'Incident',
    priority: 'high',
    guardName: 'John Smith',
    site: 'Building A - Main Entrance',
    timestamp: 'Dec 30, 2025 • 11:45 PM',
    content: 'Observed unauthorized individual attempting to enter through rear loading dock. Individual was escorted off premises. No physical altercation occurred. Police were notified and arrived at 23:52. Incident number #IR-2024-1156.',
    status: 'pending'
  },
  {
    id: 2,
    referenceId: '#DAR-445',
    type: 'DAR',
    priority: 'normal',
    guardName: 'Maria Garcia',
    site: 'Parking Structure B',
    timestamp: 'Dec 30, 2025 • 10:30 PM',
    content: 'Completed hourly patrol of all 5 levels. All emergency exits secure. Lighting operational on all floors. No vehicles observed in restricted areas. Total vehicle count: 47 vehicles. Weather: Clear, temperature 68°F.',
    status: 'pending'
  },
  {
    id: 3,
    referenceId: '#IR-2024-1157',
    type: 'Incident',
    priority: 'high',
    guardName: 'Robert Chen',
    site: 'Office Tower C',
    timestamp: 'Dec 30, 2025 • 9:15 PM',
    content: 'Fire alarm activated on 12th floor at 21:10. Initiated evacuation protocol per SOP. Fire department notified and arrived at 21:18. Cause determined to be burnt popcorn in break room. All clear given at 21:35. Building re-occupied at 21:40.',
    status: 'pending'
  },
  {
    id: 4,
    referenceId: '#DAR-446',
    type: 'DAR',
    priority: 'normal',
    guardName: 'Sarah Johnson',
    site: 'Retail Complex D',
    timestamp: 'Dec 30, 2025 • 8:00 PM',
    content: 'Evening shift commenced at 20:00. Perimeter check completed - all doors secured. Video surveillance systems operational. Received delivery at loading dock 20:45 - verified credentials and escorted vendor. No incidents to report.',
    status: 'pending'
  },
  {
    id: 5,
    referenceId: '#IR-2024-1158',
    type: 'Incident',
    priority: 'normal',
    guardName: 'Michael Torres',
    site: 'Building A - Lobby',
    timestamp: 'Dec 30, 2025 • 7:30 PM',
    content: 'Assisted visitor who locked keys in vehicle. Contacted parking management. Locksmith arrived at 19:45. Issue resolved. Visitor departed at 20:00. No damage to property.',
    status: 'rejected',
    rejectionNote: 'Please attach a photo of the damaged lock.'
  },
  {
    id: 6,
    referenceId: '#DAR-447',
    type: 'DAR',
    priority: 'normal',
    guardName: 'Lisa Anderson',
    site: 'Distribution Center E',
    timestamp: 'Dec 29, 2025 • 6:45 PM',
    content: 'Shift change completed. Equipment inspection performed - all radios, flashlights, and emergency equipment operational. Logbook reviewed with outgoing guard. Building secure. Temperature monitoring systems showing normal readings.',
    status: 'pending'
  },
  {
    id: 7,
    referenceId: '#IR-2024-1159',
    type: 'Incident',
    priority: 'high',
    guardName: 'David Martinez',
    site: 'Medical Plaza F',
    timestamp: 'Dec 29, 2025 • 5:20 PM',
    content: 'Medical emergency in suite 304. Visitor experienced chest pain. Called 911 at 17:18. Administered first aid and remained with patient until paramedics arrived at 17:24. Patient transported to hospital. Family notified.',
    status: 'pending'
  },
  {
    id: 8,
    referenceId: '#DAR-448',
    type: 'DAR',
    priority: 'normal',
    guardName: 'Jessica Lee',
    site: 'Corporate Campus G',
    timestamp: 'Dec 29, 2025 • 4:15 PM',
    content: 'Afternoon patrol completed. Inspected all perimeter gates - functioning properly. Parking lot inspection revealed no suspicious activity. Greeted employees during shift change. Weather conditions: Partly cloudy, no weather advisories.',
    status: 'rejected',
    rejectionNote: 'Report missing timestamp for gate inspections. Please include specific times for each checkpoint.'
  },
  {
    id: 9,
    referenceId: '#IR-2024-1160',
    type: 'Incident',
    priority: 'normal',
    guardName: 'Thomas Brown',
    site: 'Warehouse H',
    timestamp: 'Dec 29, 2025 • 3:00 PM',
    content: 'Water leak detected in northwest corner of warehouse. Immediately contacted facilities management. Area cordoned off with caution tape. Maintenance arrived at 15:15. Leak source identified and repairs initiated. No inventory damage.',
    status: 'pending'
  },
  {
    id: 10,
    referenceId: '#DAR-449',
    type: 'DAR',
    priority: 'normal',
    guardName: 'Amanda Wilson',
    site: 'Research Facility I',
    timestamp: 'Dec 28, 2025 • 2:30 PM',
    content: 'Mid-day security check completed. All access control systems operational. Verified badge reader functionality at all entry points. Escorted contractor crew working on HVAC system. Crew departed at 14:45. All areas secured.',
    status: 'pending'
  },
  {
    id: 11,
    referenceId: '#IR-2024-1161',
    type: 'Incident',
    priority: 'high',
    guardName: 'Christopher Davis',
    site: 'Data Center J',
    timestamp: 'Dec 28, 2025 • 1:45 PM',
    content: 'Unauthorized access attempt detected at server room. Individual claimed to be new IT contractor but could not provide valid credentials. Access denied. IT director contacted and confirmed individual not authorized. Subject escorted off property. Incident logged.',
    status: 'rejected',
    rejectionNote: 'Incident report incomplete. Please include subject description, vehicle information, and follow-up actions taken.'
  },
  {
    id: 12,
    referenceId: '#DAR-450',
    type: 'DAR',
    priority: 'normal',
    guardName: 'Emily Taylor',
    site: 'Building A - Rooftop',
    timestamp: 'Dec 27, 2025 • 12:30 PM',
    content: 'Rooftop access inspection performed. All doors properly secured. HVAC equipment area clear of debris. No unauthorized personnel observed. Bird deterrent systems functioning. Weather monitoring equipment operational.',
    status: 'approved'
  },
  {
    id: 13,
    referenceId: '#IR-2024-1162',
    type: 'Incident',
    priority: 'high',
    guardName: 'Brandon White',
    site: 'Shopping Mall K',
    timestamp: 'Dec 26, 2025 • 11:15 AM',
    content: 'Shoplifting incident reported by retail staff. Suspect detained at store exit. Police called and arrived at 11:22. Subject arrested without incident. Store manager provided video footage. Incident report filed with local PD. Case #SL-2025-0891.',
    status: 'approved'
  },
  {
    id: 14,
    referenceId: '#DAR-451',
    type: 'DAR',
    priority: 'normal',
    guardName: 'Nicole Green',
    site: 'Financial District L',
    timestamp: 'Dec 26, 2025 • 10:00 AM',
    content: 'Morning shift security briefing completed. All entry points checked and verified secure. Badge access system tested and operational. Visitor log reviewed - 23 visitors checked in/out previous night. All contractors properly escorted.',
    status: 'approved'
  }
];

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

export function Reports({ reports, setReports, onNavigateToReport, is_IR2024_1156_Approved, setIs_IR2024_1156_Approved, is_DAR445_Approved, setIs_DAR445_Approved, is_DAR446_Approved, setIs_DAR446_Approved }: ReportsProps) {
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

  const handleEdit = (report: Report) => {
    // In a real app, this would open an edit modal
    setEditingReport(report);
    setIsEditModalOpen(true);
  };

  const handleReject = (reportId: number) => {
    setReports(reports.map(r => 
      r.id === reportId ? { ...r, status: 'rejected' as const, rejectionNote: 'Not applicable' } : r
    ));
    setSelectedReportIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(reportId);
      return newSet;
    });
  };

  const handleApprove = (reportId: number) => {
    // Find the report being approved to check its reference ID
    const approvedReport = reports.find(r => r.id === reportId);
    
    // Update the report status to approved
    setReports(reports.map(r => 
      r.id === reportId ? { ...r, status: 'approved' as const } : r
    ));
    
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
    
    // Get all reports being approved
    const approvedReports = reports.filter(r => selectedReportIds.has(r.id));
    
    // Update all selected reports to approved status
    setReports(reports.map(r => 
      selectedReportIds.has(r.id) ? { ...r, status: 'approved' as const } : r
    ));
    
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
    console.log('Email sent successfully for package:', emailPackage.id);
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
      </div>
      
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
          setReports(reports.map(r => 
            r.id === reportId ? { ...r, ...updates } : r
          ));
        }}
        onApprove={(reportId, updates) => {
          // Find the report being approved to check its reference ID
          const approvedReport = reports.find(r => r.id === reportId);
          
          // Update the report with edits AND set status to approved
          setReports(reports.map(r => 
            r.id === reportId ? { ...r, ...updates, status: 'approved' as const } : r
          ));
          
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
          }
        }}
        onReject={(reportId, updates) => {
          // Update the report with any edits made during review AND set status to rejected
          setReports(reports.map(r => 
            r.id === reportId ? { 
              ...r, 
              ...updates, 
              status: 'rejected' as const,
              rejectionNote: updates.adminNote || 'Rejected by supervisor'
            } : r
          ));
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
    </div>
  );
}