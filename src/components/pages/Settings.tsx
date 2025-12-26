import React from 'react';
import { Shield, Users, Bell, Lock, Eye, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Table, Column } from '../ui/Table';

interface BreakGlassLog {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  reason: string;
  objectAccessed: string;
  outcome: 'success' | 'denied' | 'audited';
}

const breakGlassLogs: BreakGlassLog[] = [
  { id: 1, timestamp: 'Dec 20, 2024 14:32', user: 'Sarah Chen', action: 'Emergency Access', reason: 'Critical incident response', objectAccessed: 'Building A Override', outcome: 'success' },
  { id: 2, timestamp: 'Dec 18, 2024 09:15', user: 'John Smith', action: 'Override Attempt', reason: 'Unauthorized access', objectAccessed: 'Admin Panel', outcome: 'denied' },
  { id: 3, timestamp: 'Dec 15, 2024 22:47', user: 'Maria Garcia', action: 'Emergency Access', reason: 'Fire alarm evacuation', objectAccessed: 'Door System', outcome: 'success' },
  { id: 4, timestamp: 'Dec 12, 2024 11:20', user: 'David Lee', action: 'Data Export', reason: 'Audit compliance request', objectAccessed: 'License Records', outcome: 'audited' },
  { id: 5, timestamp: 'Dec 10, 2024 16:55', user: 'Robert Brown', action: 'Emergency Access', reason: 'Medical emergency', objectAccessed: 'Building C Override', outcome: 'success' },
];

const breakGlassColumns: Column<BreakGlassLog>[] = [
  {
    key: 'timestamp',
    header: 'Timestamp',
    render: (row) => <span className="text-muted">{row.timestamp}</span>,
    width: '160px',
  },
  {
    key: 'user',
    header: 'User',
    render: (row) => row.user,
    width: '140px',
  },
  {
    key: 'action',
    header: 'Action',
    render: (row) => <span className="table-badge">{row.action}</span>,
    width: '140px',
    hideOnMobile: true,
  },
  {
    key: 'reason',
    header: 'Reason',
    render: (row) => row.reason,
  },
  {
    key: 'objectAccessed',
    header: 'Object Accessed',
    render: (row) => <span className="text-muted">{row.objectAccessed}</span>,
    hideOnMobile: true,
  },
  {
    key: 'outcome',
    header: 'Outcome',
    render: (row) => <span className={`status-badge ${row.outcome}`}>{row.outcome}</span>,
    width: '100px',
  },
];

export function Settings() {
  return (
    <div className="page-container">
      <PageHeader
        title="Settings"
        description="Manage your account, company settings, and security preferences"
      />

      <div className="settings-sections">
        <Card>
          <div className="settings-section">
            <div className="settings-section-header">
              <div className="flex items-center gap-3">
                <div className="settings-icon">
                  <Users size={20} />
                </div>
                <div>
                  <h3>Account Settings</h3>
                  <p className="text-muted">Manage your personal account information</p>
                </div>
              </div>
              <button className="button-secondary">Edit</button>
            </div>
            <div className="settings-grid">
              <div className="setting-item">
                <label>Full Name</label>
                <p>Sarah Chen</p>
              </div>
              <div className="setting-item">
                <label>Email</label>
                <p>sarah.chen@guardupapp.com</p>
              </div>
              <div className="setting-item">
                <label>Role</label>
                <p>Company Administrator</p>
              </div>
              <div className="setting-item">
                <label>Company</label>
                <p>SecureGuard Services Inc.</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="settings-section">
            <div className="settings-section-header">
              <div className="flex items-center gap-3">
                <div className="settings-icon">
                  <Bell size={20} />
                </div>
                <div>
                  <h3>Notifications</h3>
                  <p className="text-muted">Configure how you receive alerts and updates</p>
                </div>
              </div>
              <button className="button-secondary">Configure</button>
            </div>
            <div className="settings-list">
              <div className="setting-toggle">
                <div>
                  <p className="setting-label">Email Notifications</p>
                  <p className="text-muted">Receive email alerts for important updates</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-toggle">
                <div>
                  <p className="setting-label">License Expiry Alerts</p>
                  <p className="text-muted">Notify when licenses are expiring soon</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-toggle">
                <div>
                  <p className="setting-label">Incident Reports</p>
                  <p className="text-muted">Alert on new incident submissions</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="settings-section">
            <div className="settings-section-header">
              <div className="flex items-center gap-3">
                <div className="settings-icon">
                  <Lock size={20} />
                </div>
                <div>
                  <h3>Security & Audit</h3>
                  <p className="text-muted">Access controls and audit trail monitoring</p>
                </div>
              </div>
            </div>
            <div className="settings-subsection">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-muted" />
                  <h4>Break-Glass Usage Log</h4>
                </div>
                <button className="button-link">Export Log</button>
              </div>
              <div className="alert-banner info mb-4">
                <Eye size={20} />
                <div>
                  <p className="alert-banner-description">
                    Break-glass access provides emergency override capabilities and is fully audited for compliance
                  </p>
                </div>
              </div>
              <Table columns={breakGlassColumns} data={breakGlassLogs} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
