import React from 'react';
import { Plus, AlertTriangle, MapPin, Clock, User } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Table, Column } from '../ui/Table';
import { EmptyState } from '../ui/EmptyState';
import { FileX } from 'lucide-react';

interface Incident {
  id: number;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  reportedBy: string;
  reportedAt: string;
  status: 'open' | 'investigating' | 'resolved';
}

const incidents: Incident[] = [
  { id: 1, title: 'Unauthorized access attempt', severity: 'high', location: 'Building A - Main Entrance', reportedBy: 'John Smith', reportedAt: '2 hours ago', status: 'investigating' },
  { id: 2, title: 'Suspicious package found', severity: 'critical', location: 'Building B - Parking Lot', reportedBy: 'Maria Garcia', reportedAt: '5 hours ago', status: 'investigating' },
  { id: 3, title: 'Equipment malfunction', severity: 'medium', location: 'Building C - Lobby', reportedBy: 'David Lee', reportedAt: '1 day ago', status: 'open' },
  { id: 4, title: 'Noise complaint', severity: 'low', location: 'Building A - Floor 3', reportedBy: 'Lisa Wang', reportedAt: '2 days ago', status: 'resolved' },
  { id: 5, title: 'Fire alarm false trigger', severity: 'medium', location: 'Building B - Floor 2', reportedBy: 'Robert Brown', reportedAt: '3 days ago', status: 'resolved' },
];

const incidentColumns: Column<Incident>[] = [
  {
    key: 'title',
    header: 'Incident',
    render: (row) => (
      <div>
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className={`severity-${row.severity}`} />
          <span>{row.title}</span>
        </div>
      </div>
    ),
  },
  {
    key: 'severity',
    header: 'Severity',
    render: (row) => <span className={`severity-badge ${row.severity}`}>{row.severity}</span>,
    width: '100px',
  },
  {
    key: 'location',
    header: 'Location',
    render: (row) => (
      <div className="flex items-center gap-2">
        <MapPin size={16} className="text-muted" />
        <span className="text-muted">{row.location}</span>
      </div>
    ),
    hideOnMobile: true,
  },
  {
    key: 'reportedBy',
    header: 'Reported By',
    render: (row) => (
      <div className="flex items-center gap-2">
        <User size={16} className="text-muted" />
        <span>{row.reportedBy}</span>
      </div>
    ),
    width: '150px',
    hideOnMobile: true,
  },
  {
    key: 'reportedAt',
    header: 'Time',
    render: (row) => (
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-muted" />
        <span className="text-muted">{row.reportedAt}</span>
      </div>
    ),
    width: '130px',
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <span className={`status-badge ${row.status}`}>{row.status}</span>,
    width: '120px',
  },
];

export function IncidentReporting() {
  return (
    <div className="page-container">
      <PageHeader
        title="Incident Reporting"
        description="Track and manage security incidents and investigations"
        primaryAction={{
          label: 'Report Incident',
          onClick: () => console.log('Report incident'),
          icon: <Plus size={16} />,
        }}
      />

      <Card padding="none">
        <Table columns={incidentColumns} data={incidents} />
      </Card>
    </div>
  );
}
