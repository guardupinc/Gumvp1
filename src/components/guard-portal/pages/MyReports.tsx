import React, { useState, useEffect } from 'react';
import { Plus, FileText, AlertTriangle, ClipboardList, Eye } from 'lucide-react';
import { PageHeader } from '../../ui/PageHeader';
import { Card } from '../../ui/Card';
import { SelectReportTypeModal } from '../../ui/SelectReportTypeModal';
import { CreateReportModal } from '../../ui/CreateReportModal';
import { GuardReportViewModal } from '../modals/GuardReportViewModal';
import { useAppState } from '../../../contexts/AppStateContext';
import { toast } from 'sonner';
import { formatDate, formatTimestamp as formatTimestampTz, getTodayLocalDate } from '../../../utils/timezone';

export function MyReports() {
  const { appState, currentUser, addReport, updateReport, getDraftCounter, deleteReport } = useAppState();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'draft'>('all');
  const [isSelectReportTypeModalOpen, setIsSelectReportTypeModalOpen] = useState(false);
  const [isCreateReportModalOpen, setIsCreateReportModalOpen] = useState(false);
  const [createReportType, setCreateReportType] = useState<'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon'>('incident');
  const [generatedCaseId, setGeneratedCaseId] = useState<string>('');
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  
  // View modal state
  const [viewingReport, setViewingReport] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // ============================================================================
  // HELPER: Sequential ID Generation (Same as Admin Portal)
  // ============================================================================
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
    const existingNumbers = appState.reports
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
  useEffect(() => {
    // Only regenerate if we're in the process of creating a report
    if (!isCreateReportModalOpen && !isSelectReportTypeModalOpen) {
      return;
    }

    // Generate the next sequential ID based on the report type
    const newCaseId = getNextReportId(createReportType);
    
    // Update the generatedCaseId state with the new ID
    setGeneratedCaseId(newCaseId);
    
  }, [createReportType, isCreateReportModalOpen, isSelectReportTypeModalOpen, appState.reports]);

  // ============================================================================
  // REPORT CREATION HANDLERS (Same as Admin Portal)
  // ============================================================================
  const handleSelectReportType = (type: 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon') => {
    setCreateReportType(type);
    setIsCreateReportModalOpen(true);
    setIsSelectReportTypeModalOpen(false);
  };

  const handleCreateReport = async (reportData: any) => {
    // Extract report code
    const reportCode = (reportData.caseId || reportData.id || '').replace(/^#/, '');

    if (!reportCode) {
      toast.error('Error: No Report Code provided. Please try again.');
      console.error('CRITICAL: Missing Report Code from modal submission', reportData);
      return;
    }

    // Validation
    if (!reportData.site || !reportData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Determine report type
    let type: 'DAR' | 'Incident' | 'Maintenance' | 'Disciplinary' | 'Shift Pass-On' = 'DAR';
    let reportType: 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift_pass_on' = 'dar';

    if (createReportType === 'incident') {
      type = 'Incident';
      reportType = 'incident';
    } else if (createReportType === 'dar') {
      type = 'DAR';
      reportType = 'dar';
    } else if (createReportType === 'maintenance') {
      type = 'Maintenance';
      reportType = 'maintenance';
    } else if (createReportType === 'disciplinary') {
      type = 'Disciplinary';
      reportType = 'disciplinary';
    } else if (createReportType === 'shift-passon') {
      type = 'Shift Pass-On';
      reportType = 'shift_pass_on';
    }

    // Use local date formatting to avoid UTC timezone bugs
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(now);

    // Create the report object - GUARDS' REPORTS ALWAYS START AS "PENDING"
    const newReport = {
      reportCode: reportCode,
      caseId: reportData.caseId,
      type,
      reportType,
      priority: reportData.priority || 'normal',
      guardName: currentUser.name, // Always use the current guard's name
      site: reportData.site,
      location: reportData.location,
      attachments: reportData.attachments || [],
      date: formattedDate, // Display date (submission date)
      incidentDate: reportData.date, // ACTUAL incident date from form (e.g., "2026-01-08")
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
      // Disciplinary-specific fields
      employeeName: reportData.employeeName || 'N/A',
      violationType: reportData.violationType || 'N/A',
      disciplineLevel: reportData.disciplineLevel || 'N/A',
      witnessName: reportData.witnessName || 'N/A',
      immediateAction: reportData.immediateAction || 'N/A',
      companyPolicyRef: reportData.companyPolicyRef || 'N/A',
      employeeStatement: reportData.employeeStatement || 'N/A',
      supervisorRecommendation: reportData.supervisorRecommendation || 'N/A',
      // Shift Pass-On specific fields
      oncomingGuard: reportData.oncomingGuard,
      shiftPassOnNotes: reportData.shiftPassOnNotes,
      content: reportData.content,
      status: 'pending' as const, // Guards' reports always start as pending for admin approval
      filedBy: currentUser.name,
      filedOn: new Date().toISOString(),
      dateTime: reportData.dateTime || new Date().toISOString(),
      reportNumber: reportCode,
    };

    // Add report to global state
    if (addReport) {
      console.log('🔵 [MyReports] Submitting report:', {
        reportCode,
        type: newReport.type,
        guardName: newReport.guardName,
        status: newReport.status
      });
      
      try {
        await addReport(newReport);
        console.log('✅ [MyReports] Report submitted successfully');
        toast.success('Report submitted successfully! Awaiting admin approval.');
        setIsCreateReportModalOpen(false);
      } catch (error) {
        console.error('❌ [MyReports] Failed to submit report:', error);
        toast.error(`Failed to submit report: ${error.message || 'Unknown error'}`);
      }
    }
  };

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
    let reportType: 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift_pass_on' = 'dar';

    if (createReportType === 'incident') {
      type = 'Incident';
      reportType = 'incident';
    } else if (createReportType === 'dar') {
      type = 'DAR';
      reportType = 'dar';
    } else if (createReportType === 'maintenance') {
      type = 'Maintenance';
      reportType = 'maintenance';
    } else if (createReportType === 'disciplinary') {
      type = 'Disciplinary';
      reportType = 'disciplinary';
    } else if (createReportType === 'shift-passon') {
      type = 'Shift Pass-On';
      reportType = 'shift_pass_on';
    }

    // Use local date formatting to avoid UTC timezone bugs
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(now);

    if (existingDraft) {
      // Update existing draft - preserve date/time fields in correct format
      updateReport(existingDraft.id, {
        ...reportData,
        type,
        reportType,
        priority: reportData.priority || 'normal',
        guardName: currentUser.name,
        site: reportData.site || 'Draft - Not Set',
        content: reportData.content || '',
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
      setIsCreateReportModalOpen(false);
      setEditingReport(null);
    } else {
      // Create new draft with temporary DRAFT-XXX code
      const draftReport = {
        reportCode: reportCode,
        caseId: `#${reportCode}`,
        type,
        reportType,
        priority: reportData.priority || 'normal',
        guardName: currentUser.name,
        site: reportData.site || 'Draft - Not Set',
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
        witnessName: reportData.witnessName,
        immediateAction: reportData.immediateAction,
        companyPolicyRef: reportData.companyPolicyRef,
        employeeStatement: reportData.employeeStatement,
        supervisorRecommendation: reportData.supervisorRecommendation,
        disciplinaryDate: reportData.disciplinaryDate, // YYYY-MM-DD format
        disciplinaryTime: reportData.disciplinaryTime, // HH:mm format
        
        // Shift Pass-On specific fields
        oncomingGuard: reportData.oncomingGuard,
        shiftPassOnNotes: reportData.shiftPassOnNotes,
        
        content: reportData.content || '',
        status: 'draft' as const,
        filedBy: currentUser.name,
        filedOn: new Date().toISOString(),
        dateTime: reportData.dateTime || new Date().toISOString(),
        reportNumber: reportCode,
        createdBy: currentUser.name, // Add createdBy field for draft privacy
      };

      if (addReport) {
        addReport(draftReport);
        toast.success('Draft saved successfully!');
        setIsCreateReportModalOpen(false);
      }
    }
  };

  // ============================================================================
  // REPORT EDITING AND RESUBMISSION HANDLERS
  // ============================================================================
  const handleEditReport = (report: any) => {
    // Determine the report type from the existing report
    let reportType: 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon' = 'dar';
    
    if (report.type === 'Incident') {
      reportType = 'incident';
    } else if (report.type === 'DAR') {
      reportType = 'dar';
    } else if (report.type === 'Maintenance') {
      reportType = 'maintenance';
    } else if (report.type === 'Disciplinary') {
      reportType = 'disciplinary';
    } else if (report.type === 'Shift Pass-On') {
      reportType = 'shift-passon';
    }
    
    setCreateReportType(reportType);
    setEditingReport(report);
    setIsResubmitting(true);
    setIsEditModalOpen(true);
  };

  const handleResubmitReport = (reportData: any) => {
    if (!editingReport || !updateReport) return;
    
    // IMPORTANT: Preserve original dates and only update the editable content
    // Do NOT overwrite: filedOn (original submission date), date (display date)
    const updatedReport = {
      // Preserve original report metadata
      ...editingReport,
      
      // Update only the editable content fields
      content: reportData.content,
      site: reportData.site,
      location: reportData.location,
      priority: reportData.priority,
      
      // Update report-specific fields
      incidentType: reportData.incidentType,
      urgency: reportData.urgency,
      policeCalled: reportData.policeCalled,
      narrativeOnly: reportData.narrativeOnly,
      actionTaken: reportData.actionTaken,
      pdCaseNumber: reportData.pdCaseNumber,
      
      // DAR-specific updates
      shiftStart: reportData.shiftStart,
      shiftEnd: reportData.shiftEnd,
      reliefGuard: reportData.reliefGuard,
      equipmentStatus: reportData.equipmentStatus,
      
      // Maintenance-specific updates
      maintenanceCategory: reportData.maintenanceCategory,
      specificArea: reportData.specificArea,
      assetId: reportData.assetId,
      
      // Disciplinary-specific updates
      employeeName: reportData.employeeName,
      violationType: reportData.violationType,
      disciplineLevel: reportData.disciplineLevel,
      correctiveAction: reportData.correctiveAction,
      
      // Shift Pass-On specific updates
      shiftPassOnNotes: reportData.shiftPassOnNotes,
      
      // Update attachments if provided
      ...(reportData.attachments && { attachments: reportData.attachments }),
      
      // Change status back to pending for review
      status: 'pending' as const,
      
      // Track resubmission timestamp (separate from original filedOn)
      resubmittedAt: new Date().toISOString(),
    };
    
    updateReport(editingReport.id, updatedReport);
    
    toast.success('Report resubmitted successfully! It will be reviewed again.');
    setIsEditModalOpen(false);
    setEditingReport(null);
    setIsResubmitting(false);
  };

  // ============================================================================
  // DRAFT MANAGEMENT HANDLERS
  // ============================================================================
  
  const handleEditDraft = (draft: any) => {
    // Set report type based on draft type
    let reportType: 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon' = 'dar';
    
    if (draft.type === 'Incident') {
      reportType = 'incident';
    } else if (draft.type === 'DAR') {
      reportType = 'dar';
    } else if (draft.type === 'Maintenance') {
      reportType = 'maintenance';
    } else if (draft.type === 'Disciplinary') {
      reportType = 'disciplinary';
    } else if (draft.type === 'Shift Pass-On') {
      reportType = 'shift-passon';
    }
    
    setCreateReportType(reportType);
    setEditingReport(draft);
    setIsCreateReportModalOpen(true);
  };

  const handleSubmitDraft = (draft: any) => {
    // Get a permanent report code to replace the temporary DRAFT-XXX code
    const permanentCode = getNextReportId(draft.type);
    
    // Submit the draft (change status to pending and assign permanent code)
    updateReport(draft.id, {
      reportCode: permanentCode,
      caseId: `#${permanentCode}`,
      status: 'pending',
      filedOn: new Date().toISOString()
    });
    
    toast.success(`Report #${permanentCode} submitted for review!`);
  };

  const handleDeleteDraft = (draftId: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this draft? This action cannot be undone.');
    if (confirmed) {
      deleteReport(draftId);
      toast.success('✓ Draft deleted successfully.');
    }
  };

  // ============================================================================
  // FILTER REPORTS FOR CURRENT GUARD
  // ============================================================================
  // GUARDS SHOULD ONLY SEE THEIR OWN REPORTS
  let filteredReports = appState.reports.filter(report => {
    // For drafts, check createdBy field for strict privacy
    if (report.status === 'draft') {
      return report.createdBy === currentUser.name;
    }
    // For submitted reports, check guardName
    return report.guardName === currentUser.name;
  });
  
  if (filter !== 'all') {
    filteredReports = filteredReports.filter(report => report.status === filter);
  }
  
  // Sort by date (most recent first)
  filteredReports = filteredReports.sort((a, b) => 
    new Date(b.timestamp || b.filedOn || '').getTime() - new Date(a.timestamp || a.filedOn || '').getTime()
  );

  // ============================================================================
  // TAB COUNTS (matching stat cards)
  // ============================================================================
  const allReportsCount = appState.reports.filter(r => {
    if (r.status === 'draft') {
      return r.createdBy === currentUser.name;
    }
    return r.guardName === currentUser.name;
  }).length;
  
  const pendingCount = appState.reports.filter(r => r.guardName === currentUser.name && r.status === 'pending').length;
  const approvedCount = appState.reports.filter(r => r.guardName === currentUser.name && r.status === 'approved').length;
  const rejectedCount = appState.reports.filter(r => r.guardName === currentUser.name && r.status === 'rejected').length;
  const draftsCount = appState.reports.filter(r => r.createdBy === currentUser.name && r.status === 'draft').length;

  const getReportTypeIcon = (type: 'Incident' | 'DAR' | 'Maintenance' | 'Disciplinary' | 'Shift Pass-On') => {
    switch (type) {
      case 'Incident':
        return <AlertTriangle size={16} className="report-icon-incident" />;
      case 'DAR':
        return <FileText size={16} className="report-icon-daily" />;
      case 'Maintenance':
        return <FileText size={16} className="report-icon-maintenance" />;
      case 'Disciplinary':
        return <AlertTriangle size={16} className="report-icon-safety" />;
      case 'Shift Pass-On':
        return <FileText size={16} className="report-icon-daily" />;
      default:
        return <FileText size={16} />;
    }
  };

  const renderStatusPill = (status: 'approved' | 'pending' | 'rejected' | 'draft' | 'sent') => {
    switch (status) {
      case 'approved':
        return <span className="status-badge approved">Approved</span>;
      case 'pending':
        return <span className="status-badge pending">Pending Review</span>;
      case 'rejected':
        return <span className="status-badge rejected">Needs Revision</span>;
      case 'draft':
        return <span className="status-badge draft">Draft</span>;
      case 'sent':
        return <span className="status-badge sent">Sent to Client</span>;
      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Report Outbox"
        description="View and manage your submitted reports"
        primaryAction={{
          label: 'Create Report',
          onClick: () => setIsSelectReportTypeModalOpen(true),
          icon: <Plus size={16} />,
        }}
      />

      {/* Quick Stats */}
      <div className="reports-stats">
        <div className="stat-card">
          <div className="stat-value">{allReportsCount}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{approvedCount}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{rejectedCount}</div>
          <div className="stat-label">Needs Revision</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{draftsCount}</div>
          <div className="stat-label">Drafts</div>
        </div>
      </div>

      {/* Status Tabs (matching Admin portal design) */}
      <div className="status-tabs">
        <button 
          className={`status-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Reports ({allReportsCount})
        </button>
        <button 
          className={`status-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending Review ({pendingCount})
        </button>
        <button 
          className={`status-tab ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Approved ({approvedCount})
        </button>
        <button 
          className={`status-tab ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Needs Revision ({rejectedCount})
        </button>
        <button 
          className={`status-tab ${filter === 'draft' ? 'active' : ''}`}
          onClick={() => setFilter('draft')}
        >
          Drafts ({draftsCount})
        </button>
      </div>

      {/* Reports Table */}
      <Card className="reports-table-card">
        <div className="card-header">
          <h3>Report History</h3>
        </div>

        <div className="table-container">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Type</th>
                <th>Site</th>
                <th>Description</th>
                <th>Date Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getReportTypeIcon(report.type)}
                      <span className="report-id">{report.caseId || report.referenceId}</span>
                    </div>
                  </td>
                  <td>{report.type}</td>
                  <td>{report.site}</td>
                  <td className="report-description">{report.content.substring(0, 60)}...</td>
                  <td className="text-muted">
                    {report.filedOn 
                      ? formatTimestampTz(report.filedOn)
                      : report.date || report.timestamp
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {renderStatusPill(report.status)}
                      {/* Show rejection reason if report was rejected */}
                      {report.status === 'rejected' && report.rejectionNote && (
                        <div 
                          style={{ 
                            fontSize: '0.75rem', 
                            color: '#FF6B6B',
                            fontWeight: 500,
                            marginTop: '0.25rem',
                            maxWidth: '200px'
                          }}
                          title={report.rejectionNote}
                        >
                          Reason: {report.rejectionNote.length > 40 ? `${report.rejectionNote.substring(0, 40)}...` : report.rejectionNote}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {/* Actions based on report status */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {/* Approved: View only */}
                      {report.status === 'approved' && (
                        <button
                          className="button-ghost"
                          style={{  
                            fontSize: '0.875rem', 
                            padding: '0.5rem 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            transition: 'all 0.15s ease-out',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.04)';
                            e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.4)';
                            e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          onClick={() => {
                            setViewingReport(report);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye size={16} />
                          View
                        </button>
                      )}
                      
                      {/* Pending: View only (read-only) */}
                      {report.status === 'pending' && (
                        <button
                          className="button-ghost"
                          style={{  
                            fontSize: '0.875rem', 
                            padding: '0.5rem 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            transition: 'all 0.15s ease-out',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.04)';
                            e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.4)';
                            e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          onClick={() => {
                            setViewingReport(report);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye size={16} />
                          View
                        </button>
                      )}
                      
                      {/* Rejected: View + Revise */}
                      {report.status === 'rejected' && (
                        <>
                          <button
                            className="button-ghost"
                            style={{  
                              fontSize: '0.875rem', 
                              padding: '0.5rem 0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                              transition: 'all 0.15s ease-out',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.04)';
                              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.4)';
                              e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            onClick={() => {
                              setViewingReport(report);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye size={16} />
                            View
                          </button>
                          <button
                            className="button-primary"
                            style={{ 
                              fontSize: '0.875rem', 
                              padding: '0.5rem 1rem',
                              backgroundColor: '#FF7A18',
                              borderColor: '#FF7A18',
                              border: '1px solid #FF7A18',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease-out'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.04)';
                              e.currentTarget.style.backgroundColor = '#FF8A28';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 122, 24, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.backgroundColor = '#FF7A18';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            onClick={() => handleEditReport(report)}
                          >
                            Revise Report
                          </button>
                        </>
                      )}
                      
                      {/* Drafts: Edit / Submit / Delete */}
                      {report.status === 'draft' && (
                        <>
                          <button
                            className="button-ghost"
                            style={{  
                              fontSize: '0.875rem', 
                              padding: '0.5rem 0.75rem',
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                              transition: 'all 0.15s ease-out',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.04)';
                              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.4)';
                              e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            onClick={() => handleEditDraft(report)}
                          >
                            Edit
                          </button>
                          <button
                            className="button-primary"
                            style={{ 
                              fontSize: '0.875rem', 
                              padding: '0.5rem 0.75rem',
                              backgroundColor: '#3BD16F',
                              borderColor: '#3BD16F',
                              border: '1px solid #3BD16F',
                              transition: 'all 0.15s ease-out',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.04)';
                              e.currentTarget.style.backgroundColor = '#4BE180';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 209, 111, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.backgroundColor = '#3BD16F';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            onClick={() => handleSubmitDraft(report)}
                          >
                            Submit
                          </button>
                          <button
                            className="button-ghost"
                            style={{ 
                              fontSize: '0.875rem', 
                              padding: '0.5rem 0.75rem',
                              color: '#EF4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              transition: 'all 0.15s ease-out',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.04)';
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            onClick={() => handleDeleteDraft(report.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Select Report Type Modal */}
      <SelectReportTypeModal
        isOpen={isSelectReportTypeModalOpen}
        onClose={() => setIsSelectReportTypeModalOpen(false)}
        onSelectType={handleSelectReportType}
      />

      {/* Create Report Modal */}
      <CreateReportModal
        isOpen={isCreateReportModalOpen}
        onClose={() => setIsCreateReportModalOpen(false)}
        reportType={createReportType}
        officerName={currentUser.name}
        caseId={generatedCaseId}
        onSubmit={handleCreateReport}
        onSaveAsDraft={handleSaveAsDraft}
      />

      {/* Revise Report Modal - Reuses CreateReportModal with isResubmission flag */}
      <CreateReportModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingReport(null);
          setIsResubmitting(false);
        }}
        reportType={createReportType}
        officerName={currentUser.name}
        caseId={editingReport?.caseId || editingReport?.reportCode || ''}
        initialData={editingReport}
        isResubmission={isResubmitting}
        rejectionNote={editingReport?.rejectionNote}
        decision_note={editingReport?.decision_note}
        reviewed_by_name={editingReport?.reviewed_by_name}
        reviewed_by_role={editingReport?.reviewed_by_role}
        reviewed_at={editingReport?.reviewed_at}
        onSubmit={handleResubmitReport}
      />

      {/* View Report Modal */}
      <GuardReportViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        report={viewingReport}
      />
    </div>
  );
}