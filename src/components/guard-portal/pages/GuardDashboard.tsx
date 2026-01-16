import React from 'react';
import { Calendar, Clock, Shield, CheckCircle, AlertTriangle, FileText, MapPin } from 'lucide-react';
import { PageHeader } from '../../ui/PageHeader';
import { Card } from '../../ui/Card';
import { KPICard } from '../../ui/KPICard';
import { useAppState } from '../../../contexts/AppStateContext';

export function GuardDashboard() {
  const { appState, currentUser } = useAppState();
  
  // Helper function to parse date strings like "Jan 7, 2026"
  const parseShiftDate = (dateStr: string): Date => {
    return new Date(dateStr);
  };
  
  // Helper function to check if shift is in the future
  const isFutureShift = (shift: any): boolean => {
    const today = new Date('2026-01-07'); // Current date: Wednesday, January 7, 2026
    const shiftDate = parseShiftDate(shift.date);
    
    // Reset time to start of day for comparison
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const shiftStart = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate());
    
    // Only include shifts from tomorrow onwards (exclude today)
    return shiftStart.getTime() > todayStart.getTime();
  };
  
  // Filter shifts for the current guard - only future shifts (tomorrow and beyond)
  const myShifts = appState.scheduledShifts
    .filter(shift => shift.guardId === currentUser.id)
    .filter(isFutureShift)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3); // Get next 3 shifts
  
  // Filter reports for the current guard
  const myReports = appState.reports
    .filter(report => report.guardName === currentUser.name)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3); // Get last 3 reports
  
  // Get current guard data from roster
  const guardData = appState.roster.find(g => g.id === currentUser.id);
  
  // Calculate alerts based on guard data
  const alerts: Array<{
    id: number;
    icon: 'warning' | 'info';
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }> = [];
  
  if (guardData?.securityGuardCard) {
    if (guardData.securityGuardCard.status === 'expiring') {
      alerts.push({
        id: 1,
        icon: 'warning',
        title: 'Security Guard Card Expiring Soon',
        description: `Your security guard card expires on ${guardData.securityGuardCard.expiryDate}. Please renew before expiration.`,
        severity: 'high'
      });
    } else if (guardData.securityGuardCard.status === 'expired') {
      alerts.push({
        id: 1,
        icon: 'warning',
        title: 'Security Guard Card Expired',
        description: `Your security guard card expired on ${guardData.securityGuardCard.expiryDate}. Immediate renewal required.`,
        severity: 'high'
      });
    }
  }
  
  // Get next shift
  const nextShift = myShifts.length > 0 ? myShifts[0] : null;
  
  // Count reports by status
  const approvedCount = myReports.filter(r => r.status === 'approved').length;
  const pendingCount = myReports.filter(r => r.status === 'pending').length;

  const renderShiftStatusPill = (status: 'confirmed' | 'pending') => {
    if (status === 'confirmed') {
      return <div className="ops-status-pill completed">Confirmed</div>;
    }
    return <div className="ops-status-pill scheduled">Pending</div>;
  };

  const renderReportStatusPill = (status: 'approved' | 'pending' | 'rejected') => {
    switch (status) {
      case 'approved':
        return <span className="status-badge approved">Approved</span>;
      case 'pending':
        return <span className="status-badge pending">Pending</span>;
      case 'rejected':
        return <span className="status-badge rejected">Rejected</span>;
      default:
        return null;
    }
  };

  const getReportIcon = (type: 'Incident' | 'DAR' | 'Maintenance' | 'Disciplinary') => {
    switch (type) {
      case 'Incident':
        return <AlertTriangle size={16} className="text-accent" />;
      case 'DAR':
        return <FileText size={16} className="text-primary" />;
      case 'Maintenance':
        return <FileText size={16} className="text-muted" />;
      case 'Disciplinary':
        return <AlertTriangle size={16} className="text-accent" />;
      default:
        return <FileText size={16} />;
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title={`Welcome Back, ${currentUser.name.split(' ')[0]}!`}
        description="Your personal guard dashboard - Stay on top of your schedule and tasks"
      />

      {/* Top KPI Cards */}
      <div className="kpi-grid">
        <KPICard
          title="Next Shift"
          value={nextShift ? `${nextShift.date}, ${nextShift.startTime}` : 'No Shifts Scheduled'}
          change={{ value: nextShift ? nextShift.site : 'N/A', trend: 'neutral' }}
          icon={<Calendar size={20} />}
          iconColor="blue"
        />
        <KPICard
          title="Hours This Week"
          value={guardData ? `${guardData.hoursThisWeek} / 40 Hrs` : '0 / 40 Hrs'}
          change={{ value: guardData ? `${Math.round((guardData.hoursThisWeek / 40) * 100)}% Complete` : '0%', trend: 'up' }}
          icon={<Clock size={20} />}
          iconColor="amber"
          progress={guardData ? (guardData.hoursThisWeek / 40) * 100 : 0}
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
          value={pendingCount}
          change={{ value: pendingCount === 0 ? 'All caught up!' : `${pendingCount} pending`, trend: pendingCount === 0 ? 'up' : 'neutral' }}
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
            {myShifts.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7A8F' }}>
                No upcoming shifts scheduled
              </div>
            ) : (
              myShifts.map((shift) => (
                <div key={shift.id} className="ops-row">
                  {/* Time Column */}
                  <div className="ops-time">
                    <div className="ops-time-main">{shift.dayOfWeek}</div>
                    <div className="ops-time-sub">{shift.startTime} - {shift.endTime}</div>
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
              ))
            )}
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
                  {myReports.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#6B7A8F', padding: '2rem' }}>
                        No reports submitted yet
                      </td>
                    </tr>
                  ) : (
                    myReports.map((report) => (
                      <tr key={report.id}>
                        <td>
                          <div className="table-cell-with-icon">
                            {getReportIcon(report.type)}
                            <span>{report.type}</span>
                          </div>
                        </td>
                        <td>{report.site}</td>
                        <td className="text-muted">{report.date || report.timestamp}</td>
                        <td>{renderReportStatusPill(report.status)}</td>
                      </tr>
                    ))
                  )}
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
              {alerts.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7A8F' }}>
                  <CheckCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p>No alerts at this time</p>
                </div>
              ) : (
                alerts.map((alert) => (
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
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}