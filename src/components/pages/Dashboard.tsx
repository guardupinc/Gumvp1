import React, { useState, useEffect } from 'react';
import { Plus, Users, Calendar as CalendarIcon, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, FileText, Banknote, Shield, Check, Eye, MoreHorizontal } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { KPICard } from '../ui/KPICard';
import { Table, Column } from '../ui/Table';
import { ShiftCalendar } from '../ui/ShiftCalendar';
import { AddShiftModal, ShiftFormData } from '../modals/AddShiftModal';
import { QuickActionModal } from '../modals/QuickActionModal';
import { ReportDetailsModal } from '../ui/ReportDetailsModal';
import { DailyOperationsTimeline, generateTodayOperations } from '../widgets/DailyOperationsTimeline';
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
                  console.log('View report:', row.id);
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
                    console.log('Quick approve:', row.id);
                  }}
                  title="Approve"
                >
                  <Check size={16} />
                </button>
                <button 
                  className="action-button action-view"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('View report:', row.id);
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

export function Dashboard({ reports = [], onNavigateToPendingReports, onNavigateToOperations }: DashboardProps) {
  const shifts = generateShiftData();
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [addShiftPrefilledDate, setAddShiftPrefilledDate] = useState<Date | undefined>();
  const [addShiftPrefilledTimeSlot, setAddShiftPrefilledTimeSlot] = useState<string | undefined>();
  const todayOperations = generateTodayOperations();
  
  const [isAddShiftModalOpen, setAddShiftModalOpen] = useState(false);
  const [isQuickActionModalOpen, setQuickActionModalOpen] = useState(false);
  const [isReportDetailsModalOpen, setReportDetailsModalOpen] = useState(false);

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

  const handleQuickAction = (actionId: string) => {
    console.log('Quick action selected:', actionId);
    if (actionId === 'add-shift') {
      setAddShiftModalOpen(true);
    } else if (actionId === 'review-reports') {
      setReportDetailsModalOpen(true);
    }
    // Add other quick action handlers here
  };

  const handleApproveReport = (reportId: number, comments: string) => {
    console.log('Approved report:', reportId, 'Comments:', comments);
    // Here you would typically send this to your backend
  };

  const handleRejectReport = (reportId: number, comments: string) => {
    console.log('Rejected report:', reportId, 'Comments:', comments);
    // Here you would typically send this to your backend
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Dashboard"
        description="Overview of your security operations and key metrics"
        primaryAction={{
          label: 'Quick Action',
          onClick: () => setQuickActionModalOpen(true),
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
        />
        <KPICard
          title="Pending Reports"
          value={pendingCount}
          change={{ value: 'Awaiting review', trend: 'neutral' }}
          icon={<FileText size={20} />}
          onClick={onNavigateToPendingReports}
        />
        <KPICard
          title="Compliance Rate"
          value="98%"
          change={{ value: '+2% this month', trend: 'up' }}
          icon={<CheckCircle size={20} />}
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
            console.log('View full schedule clicked');
            onNavigateToOperations?.();
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
          <button className="button-primary" onClick={() => setReportDetailsModalOpen(true)}>
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

        <div className="dashboard-side-column">
          <Card className="alerts-card">
            <div className="card-header">
              <h3>Important Alerts</h3>
            </div>
            <div className="alerts-list">
              {/* Card 1: Financial Risk - Overtime */}
              <div className="alert-item alert-financial">
                <Banknote size={20} />
                <div className="alert-content">
                  <p className="alert-title">Overtime Risk Detected</p>
                  <p className="alert-description">3 guards are approaching 40 hours this week.</p>
                  <button className="alert-link">View Roster</button>
                </div>
              </div>

              {/* Card 2: Compliance - License Expiring */}
              <div className="alert-item alert-critical">
                <AlertTriangle size={20} />
                <div className="alert-content">
                  <p className="alert-title">License Expiring Soon</p>
                  <p className="alert-description">John Smith's Guard Card expires in 3 days.</p>
                </div>
              </div>

              {/* Card 3: Operations - Coverage */}
              <div className="alert-item alert-operational">
                <Shield size={20} />
                <div className="alert-content">
                  <p className="alert-title">Shift Coverage Needed</p>
                  <p className="alert-description">2 shifts tomorrow are unassigned.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AddShiftModal 
        isOpen={isAddShiftModalOpen} 
        onClose={() => setAddShiftModalOpen(false)} 
        prefilledDate={addShiftPrefilledDate}
        prefilledTimeSlot={addShiftPrefilledTimeSlot}
        onSubmit={handleSubmitShift}
      />
      <QuickActionModal 
        isOpen={isQuickActionModalOpen} 
        onClose={() => setQuickActionModalOpen(false)} 
        onActionSelect={handleQuickAction} 
      />
      <ReportDetailsModal 
        isOpen={isReportDetailsModalOpen} 
        onClose={() => setReportDetailsModalOpen(false)} 
        report={selectedReport}
        onApprove={handleApproveReport}
        onReject={handleRejectReport}
        onPrevious={handlePreviousReport}
        onNext={handleNextReport}
        hasPrevious={hasPreviousReport}
        hasNext={hasNextReport}
      />
    </div>
  );
}