import React, { useState } from 'react';
import { Plus, Users, Calendar as CalendarIcon, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { KPICard } from '../ui/KPICard';
import { Table, Column } from '../ui/Table';
import { ShiftCalendar } from '../ui/ShiftCalendar';
import { AddShiftModal, ShiftFormData } from '../modals/AddShiftModal';
import { QuickActionModal } from '../modals/QuickActionModal';
import { ReviewReportModal } from '../modals/ReviewReportModal';
import '../../modals.css';

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  user: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

interface PendingReport {
  id: number;
  type: string;
  title: string;
  submittedBy: string;
  submittedDate: string;
  priority: 'high' | 'medium' | 'low';
}

const recentActivities: RecentActivity[] = [
  { id: 1, type: 'Shift', description: 'Night shift assigned to Building A', user: 'John Smith', timestamp: '10 min ago', status: 'success' },
  { id: 2, type: 'Incident', description: 'Minor security breach reported', user: 'Maria Garcia', timestamp: '1 hour ago', status: 'warning' },
  { id: 3, type: 'License', description: 'Security license renewed', user: 'David Lee', timestamp: '2 hours ago', status: 'success' },
  { id: 4, type: 'Audit', description: 'Compliance report generated', user: 'Sarah Chen', timestamp: '3 hours ago', status: 'success' },
  { id: 5, type: 'Document', description: 'SOP document uploaded', user: 'Robert Brown', timestamp: '5 hours ago', status: 'success' },
];

const pendingReports: PendingReport[] = [
  { id: 1, type: 'Incident', title: 'Unauthorized Access Attempt - Building A', submittedBy: 'John Smith', submittedDate: 'Dec 22, 2024', priority: 'high' },
  { id: 2, type: 'Daily', title: 'Night Shift Summary - Dec 21', submittedBy: 'Maria Garcia', submittedDate: 'Dec 21, 2024', priority: 'medium' },
  { id: 3, type: 'Maintenance', title: 'Camera Malfunction Report', submittedBy: 'David Lee', submittedDate: 'Dec 20, 2024', priority: 'medium' },
  { id: 4, type: 'Visitor', title: 'After Hours Visitor Log', submittedBy: 'Sarah Chen', submittedDate: 'Dec 20, 2024', priority: 'low' },
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
    key: 'type',
    header: 'Type',
    render: (row) => <span className="table-badge">{row.type}</span>,
    width: '100px',
  },
  {
    key: 'title',
    header: 'Report Title',
    render: (row) => row.title,
  },
  {
    key: 'submittedBy',
    header: 'Submitted By',
    render: (row) => row.submittedBy,
    width: '150px',
    hideOnMobile: true,
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
      <span className={`status-badge ${row.priority === 'high' ? 'expired' : row.priority === 'medium' ? 'pending' : 'success'}`}>
        {row.priority}
      </span>
    ),
    width: '100px',
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

export function Dashboard() {
  const shifts = generateShiftData();
  const [selectedReport, setSelectedReport] = useState<PendingReport | null>(null);
  const [addShiftPrefilledDate, setAddShiftPrefilledDate] = useState<Date | undefined>();
  const [addShiftPrefilledTimeSlot, setAddShiftPrefilledTimeSlot] = useState<string | undefined>();
  
  const [isAddShiftModalOpen, setAddShiftModalOpen] = useState(false);
  const [isQuickActionModalOpen, setQuickActionModalOpen] = useState(false);
  const [isReviewReportModalOpen, setReviewReportModalOpen] = useState(false);

  const handleShiftClick = (shift: any) => {
    console.log('Shift clicked:', shift);
  };

  const handleAddShift = (date: Date, timeSlot: string) => {
    setAddShiftPrefilledDate(date);
    setAddShiftPrefilledTimeSlot(timeSlot);
    setAddShiftModalOpen(true);
  };

  const handleReviewReport = (reportId: number) => {
    const report = pendingReports.find(r => r.id === reportId);
    if (report) {
      setSelectedReport(report);
      setReviewReportModalOpen(true);
    }
  };

  const handleSubmitShift = (shiftData: ShiftFormData) => {
    console.log('New shift submitted:', shiftData);
    // Here you would typically send this to your backend
  };

  const handleQuickAction = (actionId: string) => {
    console.log('Quick action selected:', actionId);
    if (actionId === 'add-shift') {
      setAddShiftModalOpen(true);
    } else if (actionId === 'review-reports') {
      setReviewReportModalOpen(true);
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
          value="47"
          change={{ value: '+3 from last week', trend: 'up' }}
          icon={<Users size={20} />}
        />
        <KPICard
          title="Shifts Today"
          value="12"
          change={{ value: '2 pending coverage', trend: 'neutral' }}
          icon={<CalendarIcon size={20} />}
        />
        <KPICard
          title="Pending Reports"
          value="4"
          change={{ value: 'Awaiting review', trend: 'neutral' }}
          icon={<FileText size={20} />}
        />
        <KPICard
          title="Compliance Rate"
          value="98%"
          change={{ value: '+2% this month', trend: 'up' }}
          icon={<CheckCircle size={20} />}
        />
      </div>

      {/* Weekly Shift Schedule Section */}
      <div className="dashboard-full-width">
        <Card className="shift-calendar-card">
          <div className="card-header">
            <h3>Weekly Shift Schedule</h3>
            <button className="button-link">View Full Schedule</button>
          </div>
          <ShiftCalendar 
            shifts={shifts}
            onShiftClick={handleShiftClick}
            onAddShift={handleAddShift}
          />
        </Card>
      </div>

      {/* Reports Pending Review Section */}
      <Card className="pending-reports-card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-accent" />
            <h3>Reports Pending Review</h3>
          </div>
          <button className="button-primary" onClick={() => setReviewReportModalOpen(true)}>
            Review All
          </button>
        </div>
        <Table 
          columns={reportColumns} 
          data={pendingReports}
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
              <div className="alert-item warning">
                <AlertTriangle size={20} />
                <div className="alert-content">
                  <p className="alert-title">License Expiring Soon</p>
                  <p className="alert-description">3 guards have licenses expiring in 7 days</p>
                </div>
              </div>
              <div className="alert-item info">
                <TrendingUp size={20} />
                <div className="alert-content">
                  <p className="alert-title">Shift Coverage Needed</p>
                  <p className="alert-description">2 shifts require guard assignment</p>
                </div>
              </div>
              <div className="alert-item success">
                <CheckCircle size={20} />
                <div className="alert-content">
                  <p className="alert-title">Audit Report Ready</p>
                  <p className="alert-description">Q4 compliance report available for review</p>
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
      <ReviewReportModal 
        isOpen={isReviewReportModalOpen} 
        onClose={() => setReviewReportModalOpen(false)} 
        report={selectedReport}
        onApprove={handleApproveReport}
        onReject={handleRejectReport}
      />
    </div>
  );
}