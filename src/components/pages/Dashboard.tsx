import React, { useState } from 'react';
import { Plus, Users, Calendar as CalendarIcon, AlertTriangle, FileText, Check, Eye, MoreHorizontal, Banknote, Shield } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { KPICard } from '../ui/KPICard';
import { ImportantAlertsCard } from '../ui/ImportantAlertsCard';
import { AlertsModal, Alert } from '../ui/AlertsModal';
import { Table, Column } from '../ui/Table';
import { ShiftCalendar } from '../ui/ShiftCalendar';
import { AddShiftModal, ShiftFormData } from '../modals/AddShiftModal';
import { AddNewGuardModal } from '../ui/AddNewGuardModal';
import { SelectReportTypeModal } from '../ui/SelectReportTypeModal';
import { CreateReportModal } from '../ui/CreateReportModal';
import { ReportDetailsModal } from '../ui/ReportDetailsModal';
import { RequestChangesModal } from '../modals/RequestChangesModal';
import { QuickActionsModal } from '../modals/QuickActionsModal';
import { DailyOperationsTimeline, generateTodayOperations } from '../widgets/DailyOperationsTimeline';
import { useAppState } from '../../contexts/AppStateContext';
import { useGuards } from '../../contexts/GuardsContext';
import { toast } from 'sonner';
import '../../modals.css';

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

interface DashboardProps {
  reports?: Report[];
  onNavigateToPendingReports?: () => void;
  onNavigateToOperations?: () => void;
  onQuickActionAddGuard?: () => void;
  onQuickActionCreateShift?: () => void;
  onQuickActionCreateReport?: () => void;
  onNavigateToScheduling?: () => void;
  onReviewAllPendingReports?: () => void;
}

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  user: string;
  timestamp: string;
  status: string;
}

interface PendingReport {
  id: number;
  type: 'DAR' | 'Incident';
  site: string;
  description: string;
  submittedBy: string;
  submittedDate: string;
  priority: 'normal' | 'high';
}

const recentActivities: RecentActivity[] = [
  { id: 1, type: 'Shift', description: 'Night shift assigned to Building A', user: 'John Smith', timestamp: '10 min ago', status: 'success' },
  { id: 2, type: 'Incident', description: 'Minor security breach reported', user: 'Maria Garcia', timestamp: '1 hour ago', status: 'warning' },
  { id: 3, type: 'License', description: 'Security license renewed', user: 'David Lee', timestamp: '2 hours ago', status: 'success' },
  { id: 4, type: 'Audit', description: 'Compliance report generated', user: 'Sarah Chen', timestamp: '3 hours ago', status: 'success' },
  { id: 5, type: 'Document', description: 'SOP document uploaded', user: 'Robert Brown', timestamp: '5 hours ago', status: 'success' },
];

const activityColumns: Column<RecentActivity>[] = [
  {
    key: 'type',
    header: 'Type',
    render: (row) => <span className="table-badge">{row.type}</span>,
    width: '100px',
  },
  {
    key: 'description',
    header: 'Description',
    render: (row) => row.description,
  },
  {
    key: 'user',
    header: 'User',
    render: (row) => row.user,
    width: '150px',
    hideOnMobile: true,
  },
  {
    key: 'timestamp',
    header: 'Time',
    render: (row) => <span className="text-muted">{row.timestamp}</span>,
    width: '120px',
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <span className={`status-dot ${row.status}`} />,
    width: '80px',
  },
];

const reportColumns: Column<PendingReport>[] = [
  {
    key: 'icon',
    header: '',
    render: (row) => {
      if (row.type === 'Incident') {
        return <AlertTriangle size={18} className="report-icon-incident" />;
      } else {
        return <FileText size={18} className="report-icon-daily" />;
      }
    },
    width: '50px',
  },
  {
    key: 'context',
    header: 'Report Context',
    render: (row) => (
      <div className="report-context">
        <span className="report-site-name">{row.site}</span>
        <span className="report-description"> - {row.description}</span>
      </div>
    ),
  },
  {
    key: 'submittedDate',
    header: 'Date',
    render: (row) => <span className="text-muted">{row.submittedDate}</span>,
    width: '120px',
  },
  {
    key: 'priority',
    header: 'Priority',
    render: (row) => (
      <span className={`status-badge ${row.priority === 'high' ? 'expired' : 'success'}`}>
        {row.priority}
      </span>
    ),
    width: '100px',
  },
  {
    key: 'actions',
    header: 'Actions',
    render: (row, isHovered) => (
      <div className="table-actions">
        {isHovered ? (
          <>
            {/* High priority incidents: Only show Eye icon (safety logic) */}
            {row.priority === 'high' ? (
              <button 
                className="action-button action-view"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewReport(row.id);
                }}
                title="View Details"
              >
                <Eye size={16} />
              </button>
            ) : (
              /* Normal priority: Show both Eye and Checkmark */
              <>
                <button 
                  className="action-button action-approve"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickReview(row.id);
                  }}
                  title="Review / Approve"
                >
                  <Check size={16} />
                </button>
                <button 
                  className="action-button action-view"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewReport(row.id);
                  }}
                  title="View Details"
                >
                  <Eye size={16} />
                </button>
              </>
            )}
          </>
        ) : (
          <MoreHorizontal size={16} className="action-more" />
        )}
      </div>
    ),
    width: '120px',
  },
];

// Generate sample shift data
const generateShiftData = () => {
  const today = new Date();
  const shifts = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Morning shifts
    shifts.push({
      id: i * 3 + 1,
      guardName: i % 3 === 0 ? 'John Smith' : i % 3 === 1 ? 'Maria Garcia' : 'David Lee',
      location: i % 2 === 0 ? 'Building A' : 'Building B',
      startTime: '08:00',
      endTime: '16:00',
      date: new Date(date),
      status: 'scheduled' as const,
    });
    
    // Day shifts
    if (i < 5) {
      shifts.push({
        id: i * 3 + 2,
        guardName: i % 2 === 0 ? 'Lisa Wang' : 'Robert Brown',
        location: 'Building C',
        startTime: '16:00',
        endTime: '00:00',
        date: new Date(date),
        status: i === 0 ? 'pending' as const : 'scheduled' as const,
      });
    }
    
    // Night shifts
    if (i < 4) {
      shifts.push({
        id: i * 3 + 3,
        guardName: 'Mike Johnson',
        location: 'Building A',
        startTime: '00:00',
        endTime: '08:00',
        date: new Date(date),
        status: 'scheduled' as const,
      });
    }
  }
  
  return shifts;
};

export function Dashboard({ reports = [], onNavigateToPendingReports, onNavigateToOperations, onQuickActionAddGuard, onQuickActionCreateShift, onQuickActionCreateReport, onNavigateToScheduling, onReviewAllPendingReports }: DashboardProps) {
  const { addReport, currentUser, approveReport, rejectReport } = useAppState();
  const { addGuard } = useGuards();
  const shifts = generateShiftData();
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [addShiftPrefilledDate, setAddShiftPrefilledDate] = useState<Date | undefined>();
  const [addShiftPrefilledTimeSlot, setAddShiftPrefilledTimeSlot] = useState<string | undefined>();
  const todayOperations = generateTodayOperations();
  
  // Modal States
  const [isQuickActionsModalOpen, setQuickActionsModalOpen] = useState(false);
  const [isAddShiftModalOpen, setAddShiftModalOpen] = useState(false);
  const [isAddGuardModalOpen, setAddGuardModalOpen] = useState(false);
  const [isSelectReportTypeModalOpen, setSelectReportTypeModalOpen] = useState(false);
  const [isCreateReportModalOpen, setCreateReportModalOpen] = useState(false);
  const [createReportType, setCreateReportType] = useState<'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon'>('incident');
  const [isReportDetailsModalOpen, setReportDetailsModalOpen] = useState(false);
  const [isRequestChangesModalOpen, setRequestChangesModalOpen] = useState(false);
  const [isAlertsModalOpen, setAlertsModalOpen] = useState(false);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false); // Track if modal is read-only (Eye) or review mode (Checkmark)
  
  // Filter only pending reports
  const pendingReports = reports.filter(r => r.status === 'pending');

  // Calculate active guards count (guards currently on shift)
  // In production: This would query the database for status = 'On Shift'
  const activeGuardsCount = todayOperations.filter(op => op.status === 'active').length;
  
  // For demo state: Set to 8 (5 at Building B + 3 at Building A)
  const displayActiveGuardsCount = 8;

  // Transform Report data to PendingReport format for table display
  const pendingReportsData: PendingReport[] = pendingReports.map(r => ({
    id: r.id,
    type: r.type,
    site: r.site,
    description: `${r.content.substring(0, 50)}...`,
    submittedBy: r.guardName,
    submittedDate: r.timestamp.split('•')[0].trim(),
    priority: r.priority
  }));

  // Get the full Report object for the selected report
  const selectedReport = selectedReportId !== null 
    ? pendingReports.find(r => r.id === selectedReportId) || null
    : null;

  // Calculate pending reports count from live data
  const pendingCount = pendingReports.length;

  // Important Alerts data
  const alerts: Alert[] = [
    {
      id: 1,
      type: 'financial',
      icon: <Banknote size={20} />,
      title: 'Overtime Risk Detected',
      description: '3 guards approaching 40 hours this week',
      timestamp: '2 hours ago',
      route: 'scheduling',
      filterType: 'overtime-risk'
    },
    {
      id: 2,
      type: 'critical',
      icon: <AlertTriangle size={20} />,
      title: 'License Expiring Soon',
      description: "John Smith's Guard Card expires in 3 days",
      timestamp: '4 hours ago',
      route: 'guards',
      filterType: 'expiring-licenses'
    },
    {
      id: 3,
      type: 'operational',
      icon: <Shield size={20} />,
      title: 'Shift Coverage Needed',
      description: '2 shifts tomorrow are unassigned',
      timestamp: '5 hours ago',
      route: 'scheduling',
      filterType: 'unassigned-shifts'
    },
  ];

  // Handle alert click - navigate to appropriate page
  const handleAlertClick = (alert: Alert) => {
    console.log('Alert clicked:', alert);
    toast.info(`Navigating to ${alert.route}...`);
    
    // Route based on alert type
    if (alert.route === 'scheduling') {
      onNavigateToScheduling?.();
      // In a real app, you would also set filters here
    } else if (alert.route === 'guards') {
      // Navigate to workforce management/guards page
      // For MVP, just show a toast
      toast.info('Guard filtering would be applied here');
    }
  };

  const handleShiftClick = (shift: any) => {
    console.log('Shift clicked:', shift);
  };

  const handleAddShift = (date: Date, timeSlot: string) => {
    setAddShiftPrefilledDate(date);
    setAddShiftPrefilledTimeSlot(timeSlot);
    setAddShiftModalOpen(true);
  };

  const handleReviewReport = (reportId: number) => {
    setSelectedReportId(reportId);
    setIsViewOnlyMode(false); // Default to review mode (with approve/reject buttons)
    setReportDetailsModalOpen(true);
  };

  // Handler for Eye icon - View report in read-only mode
  const handleViewReport = (reportId: number) => {
    setSelectedReportId(reportId);
    setIsViewOnlyMode(true); // View-only mode (no approve/reject buttons)
    setReportDetailsModalOpen(true);
  };

  // Handler for Checkmark icon - Review/Approve report
  const handleQuickReview = (reportId: number) => {
    setSelectedReportId(reportId);
    setIsViewOnlyMode(false); // Review mode (with approve/reject buttons)
    setReportDetailsModalOpen(true);
  };

  const handlePreviousReport = () => {
    if (!selectedReportId) return;
    const currentIndex = pendingReports.findIndex(r => r.id === selectedReportId);
    if (currentIndex > 0) {
      setSelectedReportId(pendingReports[currentIndex - 1].id);
    }
  };

  const handleNextReport = () => {
    if (!selectedReportId) return;
    const currentIndex = pendingReports.findIndex(r => r.id === selectedReportId);
    if (currentIndex < pendingReports.length - 1) {
      setSelectedReportId(pendingReports[currentIndex + 1].id);
    }
  };

  const hasPreviousReport = selectedReportId !== null 
    ? pendingReports.findIndex(r => r.id === selectedReportId) > 0 
    : false;
  
  const hasNextReport = selectedReportId !== null 
    ? pendingReports.findIndex(r => r.id === selectedReportId) < pendingReports.length - 1 
    : false;

  const handleSubmitShift = (shiftData: ShiftFormData) => {
    console.log('New shift submitted:', shiftData);
    // Here you would typically send this to your backend
  };

  const handleApproveReportFromModal = () => {
    if (!selectedReport) return;
    
    // Call canonical approval function from context
    approveReport(selectedReport.id);
    
    // Show success toast
    toast.success(`✓ Report Approved & Filed to ${selectedReport.guardName}'s Personnel Record.`);
    
    // Close modal
    setReportDetailsModalOpen(false);
    setSelectedReportId(null);
  };

  const handleRejectReportFromModal = () => {
    if (!selectedReport) return;
    
    // COMPLIANCE: Open Request Changes modal instead of direct rejection
    setReportDetailsModalOpen(false);
    setRequestChangesModalOpen(true);
  };

  const handleConfirmRequestChanges = (rejectionReason: string, notes?: string, notifyGuard?: boolean) => {
    if (!selectedReport) return;
    
    // COMPLIANCE: Call canonical rejection (status → "rejected" = "Changes Requested")
    rejectReport(selectedReport.id, rejectionReason);
    
    // Show success toast
    toast.success('Changes requested. Report returned to author.');
    
    // Close modals and reset state
    setRequestChangesModalOpen(false);
    setSelectedReportId(null);
  };
  
  // Handle Add Guard
  const handleAddGuard = (guardData: any) => {
    const newGuard = {
      id: Date.now(),
      name: `${guardData.firstName} ${guardData.lastName}`,
      status: 'Available',
      badge: guardData.badgeId,
      licenses: [{
        type: 'Guard Card',
        number: guardData.guardCardNumber,
        expiry: guardData.expiryDate,
        status: 'valid' as const
      }],
      contact: {
        email: guardData.email,
        phone: guardData.phone
      },
      imageUrl: guardData.imageUrl
    };
    
    addGuard(newGuard);
    toast.success(`${newGuard.name} has been added to the workforce`);
    setAddGuardModalOpen(false);
  };
  
  // Handle Report Type Selection
  const handleSelectReportType = (type: 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon') => {
    setCreateReportType(type);
    setSelectReportTypeModalOpen(false);
    setCreateReportModalOpen(true);
  };
  
  // Handle Create Report
  const handleCreateReport = async (reportData: any) => {
    try {
      // Here you would call your API to create the report
      console.log('Creating report:', reportData);
      toast.success('Report submitted successfully!');
      setCreateReportModalOpen(false);
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Failed to create report');
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Dashboard"
        description="Overview of your security operations and key metrics"
        primaryAction={{
          label: 'Quick Action',
          onClick: () => setQuickActionsModalOpen(true),
          icon: <Plus size={16} />,
        }}
      />

      <div className="kpi-grid">
        <KPICard
          title="Active Guards"
          value={displayActiveGuardsCount.toString()}
          change={{ value: 'Active On Site', trend: 'neutral' }}
          icon={<Users size={20} />}
          onClick={onNavigateToOperations}
        />
        <KPICard
          title="Shifts Today"
          value="12"
          change={{ value: '2 pending coverage', trend: 'neutral' }}
          icon={<CalendarIcon size={20} />}
          onClick={onNavigateToScheduling}
        />
        <KPICard
          title="Pending Reports"
          value={pendingCount}
          change={{ value: 'Awaiting review', trend: 'neutral' }}
          icon={<FileText size={20} />}
          onClick={onNavigateToPendingReports}
        />
        <ImportantAlertsCard 
          maxAlerts={3}
          onViewAll={() => setAlertsModalOpen(true)}
          onAlertClick={handleAlertClick}
          alerts={alerts}
        />
      </div>

      {/* Daily Operations Timeline Section */}
      <div className="dashboard-full-width">
        <DailyOperationsTimeline 
          operations={todayOperations}
          onAssignGuard={(operationId) => {
            console.log('Assign guard to operation:', operationId);
            setAddShiftModalOpen(true);
          }}
          onViewFullSchedule={() => {
            console.log('View full schedule clicked - navigating to Scheduling tab');
            // Close any open modals
            setAddShiftModalOpen(false);
            setAddGuardModalOpen(false);
            setQuickActionsModalOpen(false);
            setReportDetailsModalOpen(false);
            setRequestChangesModalOpen(false);
            setSelectReportTypeModalOpen(false);
            setCreateReportModalOpen(false);
            setAlertsModalOpen(false);
            // Navigate to Scheduling tab
            onNavigateToScheduling?.();
          }}
        />
      </div>

      {/* Reports Pending Review Section */}
      <Card className="pending-reports-card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-accent" />
            <h3>Reports Pending Review</h3>
          </div>
          <button 
            className="button-primary" 
            onClick={() => {
              if (pendingCount === 0) {
                toast.info('No reports pending review.');
              } else {
                onReviewAllPendingReports?.();
              }
            }}
            disabled={pendingCount === 0}
          >
            Review All
          </button>
        </div>
        <Table 
          columns={reportColumns} 
          data={pendingReportsData}
          onRowClick={(row) => handleReviewReport(row.id)}
        />
      </Card>

      <div className="dashboard-panels">
        <div className="dashboard-main-column">
          <Card className="activity-card">
            <div className="card-header">
              <h3>Recent Activity</h3>
              <button className="button-link">View All</button>
            </div>
            <Table columns={activityColumns} data={recentActivities} />
          </Card>
        </div>
      </div>

      {/* Modals */}
      <QuickActionsModal 
        isOpen={isQuickActionsModalOpen} 
        onClose={() => setQuickActionsModalOpen(false)} 
        onAddGuard={onQuickActionAddGuard || (() => setAddGuardModalOpen(true))}
        onCreateShift={onQuickActionCreateShift || (() => setAddShiftModalOpen(true))}
        onCreateReport={onQuickActionCreateReport || (() => setSelectReportTypeModalOpen(true))}
      />
      <AddShiftModal 
        isOpen={isAddShiftModalOpen} 
        onClose={() => setAddShiftModalOpen(false)} 
        prefilledDate={addShiftPrefilledDate}
        prefilledTimeSlot={addShiftPrefilledTimeSlot}
        onSubmit={handleSubmitShift}
      />
      <AddNewGuardModal 
        isOpen={isAddGuardModalOpen} 
        onClose={() => setAddGuardModalOpen(false)} 
        onSave={handleAddGuard}
      />
      <SelectReportTypeModal 
        isOpen={isSelectReportTypeModalOpen} 
        onClose={() => setSelectReportTypeModalOpen(false)} 
        onSelectType={handleSelectReportType}
      />
      <CreateReportModal 
        isOpen={isCreateReportModalOpen} 
        onClose={() => setCreateReportModalOpen(false)} 
        reportType={createReportType}
        officerName={currentUser?.name || 'Admin User'}
        onSubmit={handleCreateReport}
      />
      <ReportDetailsModal 
        isOpen={isReportDetailsModalOpen} 
        onClose={() => {
          setReportDetailsModalOpen(false);
          setSelectedReportId(null);
          setIsViewOnlyMode(false);
        }} 
        report={selectedReport}
        currentUser={currentUser}
        onApprove={!isViewOnlyMode && selectedReport?.status === 'pending' ? handleApproveReportFromModal : undefined}
        onReject={!isViewOnlyMode && selectedReport?.status === 'pending' ? handleRejectReportFromModal : undefined}
        onPrevious={handlePreviousReport}
        onNext={handleNextReport}
        hasPrevious={hasPreviousReport}
        hasNext={hasNextReport}
      />
      <AlertsModal 
        isOpen={isAlertsModalOpen} 
        onClose={() => setAlertsModalOpen(false)}
        alerts={alerts}
        onAlertClick={handleAlertClick}
      />
      <RequestChangesModal
        isOpen={isRequestChangesModalOpen}
        onClose={() => {
          setRequestChangesModalOpen(false);
        }}
        onConfirm={handleConfirmRequestChanges}
        reportId={selectedReport?.reportCode}
      />
    </div>
  );
}