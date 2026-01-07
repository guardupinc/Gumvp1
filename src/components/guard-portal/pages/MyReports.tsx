import React, { useState } from 'react';
import { Plus, FileText, AlertTriangle, ClipboardList } from 'lucide-react';
import { PageHeader } from '../../ui/PageHeader';
import { Card } from '../../ui/Card';

interface Report {
  id: number;
  type: 'Incident' | 'DAR' | 'Maintenance' | 'Safety';
  site: string;
  dateSubmitted: string;
  status: 'pending' | 'approved' | 'submitted';
  description: string;
}

const reports: Report[] = [
  {
    id: 1,
    type: 'Incident',
    site: 'Building A',
    dateSubmitted: 'Jan 4, 2026',
    status: 'approved',
    description: 'Unauthorized access attempt at north entrance'
  },
  {
    id: 2,
    type: 'DAR',
    site: 'Building A',
    dateSubmitted: 'Jan 3, 2026',
    status: 'submitted',
    description: 'Daily Activity Report for 8-hour shift'
  },
  {
    id: 3,
    type: 'Maintenance',
    site: 'Building B',
    dateSubmitted: 'Jan 2, 2026',
    status: 'approved',
    description: 'Broken security camera - Parking Lot B'
  },
  {
    id: 4,
    type: 'DAR',
    site: 'Building A',
    dateSubmitted: 'Jan 1, 2026',
    status: 'approved',
    description: 'Daily Activity Report for 8-hour shift'
  },
  {
    id: 5,
    type: 'Safety',
    site: 'Building C',
    dateSubmitted: 'Dec 30, 2025',
    status: 'approved',
    description: 'Wet floor hazard - Main lobby'
  },
  {
    id: 6,
    type: 'Incident',
    site: 'Building B',
    dateSubmitted: 'Dec 28, 2025',
    status: 'approved',
    description: 'Vehicle break-in reported in parking structure'
  }
];

export function MyReports() {
  const [isCreating, setIsCreating] = useState(false);

  const getReportIcon = (type: Report['type']) => {
    switch (type) {
      case 'Incident':
        return <AlertTriangle size={16} className="report-icon-incident" />;
      case 'DAR':
        return <FileText size={16} className="report-icon-daily" />;
      case 'Maintenance':
        return <FileText size={16} className="report-icon-maintenance" />;
      case 'Safety':
        return <AlertTriangle size={16} className="report-icon-safety" />;
      default:
        return <FileText size={16} />;
    }
  };

  const renderStatusPill = (status: Report['status']) => {
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

  return (
    <div className="page-container">
      <PageHeader
        title="Report Outbox"
        description="View and manage your submitted reports"
        primaryAction={{
          label: 'Create New Report',
          onClick: () => setIsCreating(true),
          icon: <Plus size={16} />,
        }}
      />

      {/* Quick Stats */}
      <div className="reports-stats">
        <div className="stat-card">
          <div className="stat-value">{reports.length}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reports.filter(r => r.status === 'approved').length}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reports.filter(r => r.status === 'submitted').length}</div>
          <div className="stat-label">Under Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reports.filter(r => r.status === 'pending').length}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      {/* Reports Table */}
      <Card className="reports-table-card">
        <div className="card-header">
          <h3>Report History</h3>
          <button className="button-ghost" onClick={() => setIsCreating(true)}>
            <Plus size={16} />
            New Report
          </button>
        </div>

        <div className="table-container">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Site</th>
                <th>Description</th>
                <th>Date Submitted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <div className="table-cell-with-icon">
                      {getReportIcon(report.type)}
                      <span>{report.type}</span>
                    </div>
                  </td>
                  <td>{report.site}</td>
                  <td className="report-description">{report.description}</td>
                  <td className="text-muted">{report.dateSubmitted}</td>
                  <td>{renderStatusPill(report.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Report Modal Placeholder */}
      {isCreating && (
        <div className="modal-overlay" onClick={() => setIsCreating(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Report</h2>
              <button className="modal-close" onClick={() => setIsCreating(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Report Type</label>
                <select className="form-input">
                  <option>Incident Report</option>
                  <option>Daily Activity Report (DAR)</option>
                  <option>Maintenance Request</option>
                  <option>Safety Concern</option>
                </select>
              </div>
              <div className="form-group">
                <label>Site Location</label>
                <select className="form-input">
                  <option>Building A</option>
                  <option>Building B</option>
                  <option>Building C</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  className="form-input" 
                  rows={6}
                  placeholder="Provide detailed information about the incident, activity, or concern..."
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="button-secondary" onClick={() => setIsCreating(false)}>
                Cancel
              </button>
              <button className="button-primary" onClick={() => setIsCreating(false)}>
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
