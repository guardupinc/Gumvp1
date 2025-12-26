import React from 'react';
import { Calendar, Clock, FileText, AlertCircle, CheckCircle, MapPin } from 'lucide-react';
import { PageHeader } from '../../ui/PageHeader';
import { Card } from '../../ui/Card';
import { KPICard } from '../../ui/KPICard';

export function GuardDashboard() {
  return (
    <div className="page-container">
      <PageHeader
        title="Welcome Back, John!"
        description="Your guard dashboard - View your schedule, shifts, and reports"
      />

      <div className="kpi-grid">
        <KPICard
          title="Upcoming Shift"
          value="Tomorrow"
          change={{ value: '8:00 AM - 4:00 PM', trend: 'neutral' }}
          icon={<Calendar size={20} />}
        />
        <KPICard
          title="Hours This Week"
          value="32"
          change={{ value: '8 hours remaining', trend: 'neutral' }}
          icon={<Clock size={20} />}
        />
        <KPICard
          title="Pending Reports"
          value="0"
          change={{ value: 'All caught up!', trend: 'up' }}
          icon={<FileText size={20} />}
        />
        <KPICard
          title="On-Time Rate"
          value="100%"
          change={{ value: 'Great work!', trend: 'up' }}
          icon={<CheckCircle size={20} />}
        />
      </div>

      <div className="dashboard-panels">
        <div className="dashboard-main-column">
          <Card className="activity-card">
            <div className="card-header">
              <h3>Upcoming Shifts</h3>
            </div>
            <div className="shift-summaries-list">
              <div className="shift-summary-item">
                <div className="summary-header">
                  <div className="summary-guard">
                    <MapPin size={16} />
                    Building A - Main Entrance
                  </div>
                  <span className="summary-time">Tomorrow, 8:00 AM</span>
                </div>
                <p className="summary-text">
                  8-hour shift • Day shift • Building A security patrol and monitoring
                </p>
                <div className="summary-tags">
                  <span className="summary-tag">Day Shift</span>
                  <span className="summary-tag">8 Hours</span>
                </div>
              </div>

              <div className="shift-summary-item">
                <div className="summary-header">
                  <div className="summary-guard">
                    <MapPin size={16} />
                    Building C - Lobby
                  </div>
                  <span className="summary-time">Dec 25, 4:00 PM</span>
                </div>
                <p className="summary-text">
                  8-hour shift • Evening shift • Lobby security and visitor management
                </p>
                <div className="summary-tags">
                  <span className="summary-tag">Evening Shift</span>
                  <span className="summary-tag">8 Hours</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="dashboard-side-column">
          <Card className="alerts-card">
            <div className="card-header">
              <h3>Important Alerts</h3>
            </div>
            <div className="alerts-list">
              <div className="alert-item info">
                <AlertCircle size={20} />
                <div className="alert-content">
                  <p className="alert-title">Shift Reminder</p>
                  <p className="alert-description">Your shift starts tomorrow at 8:00 AM</p>
                </div>
              </div>
              <div className="alert-item success">
                <CheckCircle size={20} />
                <div className="alert-content">
                  <p className="alert-title">License Renewed</p>
                  <p className="alert-description">Your security license has been renewed</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
