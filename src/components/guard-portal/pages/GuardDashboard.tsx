import React from 'react';
import { Calendar, Clock, Shield, CheckCircle, AlertTriangle, FileText, MapPin } from 'lucide-react';
import { PageHeader } from '../../ui/PageHeader';
import { Card } from '../../ui/Card';
import { KPICard } from '../../ui/KPICard';

interface ShiftSchedule {
  id: number;
  time: string;
  timeRange: string;
  site: string;
  status: 'completed' | 'scheduled';
  date: string;
}

interface Report {
  id: number;
  type: 'Incident' | 'DAR' | 'Maintenance';
  site: string;
  date: string;
  status: 'submitted' | 'approved' | 'pending';
}

interface Alert {
  id: number;
  icon: 'warning' | 'info';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

const shifts: ShiftSchedule[] = [
  {
    id: 1,
    time: '08:00 AM - 04:00 PM',
    timeRange: 'Today',
    site: 'Building A',
    status: 'completed',
    date: 'Jan 5, 2026'
  },
  {
    id: 2,
    time: '08:00 AM - 04:00 PM',
    timeRange: 'Tomorrow',
    site: 'Building B',
    status: 'scheduled',
    date: 'Jan 6, 2026'
  },
  {
    id: 3,
    time: '02:00 PM - 10:00 PM',
    timeRange: 'Wed',
    site: 'Building C',
    status: 'scheduled',
    date: 'Jan 8, 2026'
  }
];

const recentReports: Report[] = [
  {
    id: 1,
    type: 'Incident',
    site: 'Building A',
    date: 'Jan 4, 2026',
    status: 'approved'
  },
  {
    id: 2,
    type: 'DAR',
    site: 'Building A',
    date: 'Jan 3, 2026',
    status: 'submitted'
  },
  {
    id: 3,
    type: 'Maintenance',
    site: 'Building B',
    date: 'Jan 2, 2026',
    status: 'approved'
  }
];

const alerts: Alert[] = [
  {
    id: 1,
    icon: 'warning',
    title: 'License Expiring in 30 Days',
    description: 'Your security license expires on Feb 5, 2026. Please renew before expiration.',
    severity: 'high'
  },
  {
    id: 2,
    icon: 'info',
    title: 'Training Reminder',
    description: 'Annual safety training is due by Jan 15, 2026.',
    severity: 'medium'
  }
];

export function GuardDashboard() {
  const renderShiftStatusPill = (status: ShiftSchedule['status']) => {
    if (status === 'completed') {
      return <div className="ops-status-pill completed">Completed</div>;
    }
    return <div className="ops-status-pill scheduled">Scheduled</div>;
  };

  const renderReportStatusPill = (status: Report['status']) => {
    switch (status) {
      case 'approved':
        return <span className="status-badge approved">Approved</span>;
      case 'submitted':
        return <span className="status-badge submitted">Submitted</span>;
      case 'pending':
        return <span className="status-badge pending">Pending</span>;
      default:
        return null;
    }
  };

  const getReportIcon = (type: Report['type']) => {
    switch (type) {
      case 'Incident':
        return <AlertTriangle size={16} className="text-accent" />;
      case 'DAR':
        return <FileText size={16} className="text-primary" />;
      case 'Maintenance':
        return <FileText size={16} className="text-muted" />;
      default:
        return <FileText size={16} />;
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Welcome Back, John!"
        description="Your personal guard dashboard - Stay on top of your schedule and tasks"
      />

      {/* Top KPI Cards */}
      <div className="kpi-grid">
        <KPICard
          title="Next Shift"
          value="Tomorrow, 08:00 AM"
          change={{ value: 'Building B', trend: 'neutral' }}
          icon={<Calendar size={20} />}
          iconColor="blue"
        />
        <KPICard
          title="Hours This Week"
          value="32 / 40 Hrs"
          change={{ value: '80% Complete', trend: 'up' }}
          icon={<Clock size={20} />}
          iconColor="amber"
          progress={80}
        />
        <KPICard
          title="My Reliability Score"
          value="98%"
          change={{ value: 'Top Tier', trend: 'up' }}
          icon={<Shield size={20} />}
          iconColor="green"
        />
        <KPICard
          title="Pending Actions"
          value="0"
          change={{ value: 'All caught up!', trend: 'up' }}
          icon={<CheckCircle size={20} />}
          iconColor="green"
        />
      </div>

      {/* My Timeline - Flight Board Style */}
      <Card className="timeline-card">
        <div className="daily-ops-timeline">
          {/* Header */}
          <div className="daily-ops-header">
            <div className="daily-ops-title">
              <Clock size={20} />
              My Schedule & Status
            </div>
            <button className="button-ghost">
              View Full Schedule
            </button>
          </div>

          {/* Timeline List - Flight Board Style */}
          <div className="daily-ops-list">
            {shifts.map((shift) => (
              <div key={shift.id} className="ops-row">
                {/* Time Column */}
                <div className="ops-time">
                  <div className="ops-time-main">{shift.timeRange}</div>
                  <div className="ops-time-sub">{shift.time}</div>
                </div>

                {/* Site Column */}
                <div className="ops-site">
                  <div className="ops-site-name">
                    <MapPin size={16} />
                    {shift.site}
                  </div>
                </div>

                {/* Status Column */}
                <div className="ops-status">
                  {renderShiftStatusPill(shift.status)}
                </div>

                {/* Date Column */}
                <div className="ops-guard">
                  <div className="ops-guard-info">
                    <span className="ops-guard-name">{shift.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Bottom Widgets - Two Columns */}
      <div className="dashboard-panels">
        {/* Left Widget - My Recent Reports */}
        <div className="dashboard-main-column">
          <Card className="reports-card">
            <div className="card-header">
              <h3>My Recent Reports</h3>
              <button className="button-ghost">View All</button>
            </div>
            <div className="reports-table">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Site</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <div className="table-cell-with-icon">
                          {getReportIcon(report.type)}
                          <span>{report.type}</span>
                        </div>
                      </td>
                      <td>{report.site}</td>
                      <td className="text-muted">{report.date}</td>
                      <td>{renderReportStatusPill(report.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Widget - My Alerts */}
        <div className="dashboard-side-column">
          <Card className="alerts-card">
            <div className="card-header">
              <h3>My Alerts</h3>
            </div>
            <div className="alerts-list">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`alert-item ${alert.severity === 'high' ? 'danger' : 'info'}`}
                >
                  {alert.icon === 'warning' ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <FileText size={20} />
                  )}
                  <div className="alert-content">
                    <p className="alert-title">{alert.title}</p>
                    <p className="alert-description">{alert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
